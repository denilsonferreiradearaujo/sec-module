import { InfraReconData, SecurityFinding, SeverityLevel } from '@/core/types/security';
import dns from 'node:dns/promises';
import net from 'node:net';

// Common sensitive ports to inspect
const COMMON_PORTS = [
  { port: 80, service: 'HTTP', risk: 'INFO' as SeverityLevel },
  { port: 443, service: 'HTTPS', risk: 'INFO' as SeverityLevel },
  { port: 21, service: 'FTP', risk: 'HIGH' as SeverityLevel },
  { port: 22, service: 'SSH', risk: 'LOW' as SeverityLevel },
  { port: 23, service: 'Telnet', risk: 'CRITICAL' as SeverityLevel },
  { port: 25, service: 'SMTP', risk: 'INFO' as SeverityLevel },
  { port: 3306, service: 'MySQL', risk: 'CRITICAL' as SeverityLevel },
  { port: 5432, service: 'PostgreSQL', risk: 'CRITICAL' as SeverityLevel },
  { port: 6379, service: 'Redis', risk: 'CRITICAL' as SeverityLevel },
  { port: 8080, service: 'HTTP-Proxy/Alt', risk: 'LOW' as SeverityLevel },
  { port: 8443, service: 'HTTPS-Alt', risk: 'LOW' as SeverityLevel },
  { port: 3389, service: 'RDP (Windows Remote)', risk: 'HIGH' as SeverityLevel },
];

function checkPort(host: string, port: number, timeoutMs = 1200): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isOpened = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      isOpened = true;
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('close', () => {
      if (!isOpened) resolve(false);
    });

    try {
      socket.connect(port, host);
    } catch {
      resolve(false);
    }
  });
}

function getOrganizationalDomain(hostname: string): string {
  const parts = hostname.toLowerCase().split('.').filter(Boolean);
  if (parts.length <= 2) return hostname;

  // Common second-level domains (ccTLDs)
  const ccTlds = [
    'com.br', 'net.br', 'org.br', 'gov.br', 'edu.br', 'mil.br', 'adv.br', 'eti.br',
    'co.uk', 'org.uk', 'me.uk', 'ltd.uk',
    'com.ar', 'net.ar', 'org.ar',
    'co.nz', 'net.nz', 'org.nz',
    'com.au', 'net.au', 'org.au',
  ];

  const lastTwo = parts.slice(-2).join('.');
  if (ccTlds.includes(lastTwo) && parts.length >= 3) {
    return parts.slice(-3).join('.');
  }

  return parts.slice(-2).join('.');
}

async function discoverDmarcPolicy(host: string): Promise<{
  present: boolean;
  record?: string;
  valid: boolean;
  inherited: boolean;
  inheritedFrom?: string;
  policy?: 'none' | 'quarantine' | 'reject';
  subdomainPolicy?: 'none' | 'quarantine' | 'reject';
  effectivePolicy?: 'none' | 'quarantine' | 'reject';
}> {
  // If host is an IP address, skip
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return { present: false, valid: false, inherited: false };
  }

  const cleanHost = host.toLowerCase().trim();
  const orgDomain = getOrganizationalDomain(cleanHost);

  // Tree-walk candidate domains (RFC 7489 Section 6.6.3 Policy Discovery)
  // 1. Query _dmarc.<subdomain>.<domain>
  // 2. If not found, walk up tree until _dmarc.<domain> (Organizational Domain)
  const domainsToCheck: string[] = [cleanHost];
  if (cleanHost !== orgDomain) {
    const parts = cleanHost.split('.');
    const orgParts = orgDomain.split('.');
    while (parts.length > orgParts.length) {
      parts.shift();
      const candidate = parts.join('.');
      if (!domainsToCheck.includes(candidate)) {
        domainsToCheck.push(candidate);
      }
    }
  }

  for (const domain of domainsToCheck) {
    const isInherited = domain !== cleanHost;
    try {
      const records = await dns.resolveTxt(`_dmarc.${domain}`);
      const dmarcRaw = records.map((c) => c.join('')).find((t) => t.trim().toLowerCase().startsWith('v=dmarc1'));

      if (dmarcRaw) {
        // Parse 'p' tag (policy for apex domain)
        const pMatch = dmarcRaw.match(/\bp\s*=\s*(none|quarantine|reject)\b/i);
        const policy = pMatch ? (pMatch[1].toLowerCase() as 'none' | 'quarantine' | 'reject') : undefined;

        // Parse 'sp' tag (explicit policy for subdomains)
        const spMatch = dmarcRaw.match(/\bsp\s*=\s*(none|quarantine|reject)\b/i);
        const subdomainPolicy = spMatch ? (spMatch[1].toLowerCase() as 'none' | 'quarantine' | 'reject') : undefined;

        // RFC 7489 Section 6.3:
        // For subdomains, 'sp' takes precedence. If absent, fallback to 'p'.
        const effectivePolicy = isInherited ? (subdomainPolicy || policy || 'none') : (policy || 'none');

        return {
          present: true,
          record: dmarcRaw,
          valid: true,
          inherited: isInherited,
          inheritedFrom: isInherited ? domain : undefined,
          policy,
          subdomainPolicy,
          effectivePolicy,
        };
      }
    } catch {
      // Continue tree-walk to parent domain
    }
  }

  return { present: false, valid: false, inherited: false };
}

export async function scanInfraRecon(target: string): Promise<{ data: InfraReconData; findings: SecurityFinding[] }> {
  const findings: SecurityFinding[] = [];
  let host = target.trim();
  // Strip protocol and path if passed
  host = host.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];

  const reconData: InfraReconData = {
    status: 'SUCCESS',
    resolvedIps: [],
    dns: {
      a: [],
      aaaa: [],
      mx: [],
      txt: [],
      ns: [],
    },
    openPorts: [],
    subdomains: [],
    moduleScore: 100,
  };

  try {
    // 1. DNS Resolution
    try {
      reconData.dns.a = await dns.resolve4(host);
      reconData.resolvedIps = [...reconData.dns.a];
    } catch {
      // Ignore if no IPv4
    }

    try {
      reconData.dns.aaaa = await dns.resolve6(host);
      reconData.resolvedIps = [...reconData.resolvedIps, ...reconData.dns.aaaa];
    } catch {
      // Ignore if no IPv6
    }

    try {
      const mxRecords = await dns.resolveMx(host);
      reconData.dns.mx = mxRecords.map((m) => `${m.exchange} (prio ${m.priority})`);
    } catch {
      // Ignore
    }

    try {
      const txtRecords = await dns.resolveTxt(host);
      reconData.dns.txt = txtRecords.map((chunk) => chunk.join(''));
    } catch {
      // Ignore
    }

    try {
      reconData.dns.ns = await dns.resolveNs(host);
    } catch {
      // Ignore
    }

    // Check SPF
    const spfRecord = reconData.dns.txt.find((t) => t.toLowerCase().startsWith('v=spf1'));
    if (spfRecord) {
      reconData.dns.spf = { present: true, record: spfRecord, valid: true };
      if (spfRecord.includes('+all') || spfRecord.includes('?all')) {
        findings.push({
          id: 'INFRA-WEAK-SPF',
          title: 'Registro SPF Permissivo ou Fraco',
          description: 'A política de SPF termina com "+all" ou "?all", permitindo que qualquer servidor envie e-mails em nome da sua empresa.',
          severity: 'HIGH',
          remediation: 'Altere o final do registro SPF para "-all" (bloqueio rigoroso de spoofing) ou "~all" (softfail).',
          category: 'INFRASTRUCTURE',
        });
        reconData.moduleScore -= 15;
      }
    } else {
      reconData.dns.spf = { present: false, valid: false };
      findings.push({
        id: 'INFRA-MISSING-SPF',
        title: 'Registro SPF Ausente',
        description: 'Sem o registro SPF, atacantes podem falsificar o envio de e-mails corporativos (Email Spoofing / Phishing).',
        severity: 'HIGH',
        remediation: 'Crie uma entrada TXT no DNS para o domínio com a política de envio legítimo de e-mails.',
        category: 'INFRASTRUCTURE',
        cveOrStandard: 'RFC 7208',
      });
      reconData.moduleScore -= 20;
    }

    // Check DMARC with RFC 7489 Policy Discovery (Tree-Walk Fallback)
    const dmarcResult = await discoverDmarcPolicy(host);
    reconData.dns.dmarc = dmarcResult;

    if (dmarcResult.present) {
      if (dmarcResult.effectivePolicy === 'none') {
        findings.push({
          id: 'INFRA-DMARC-P-NONE',
          title: dmarcResult.inherited
            ? `DMARC em modo passivo herdado de ${dmarcResult.inheritedFrom} (p=none)`
            : 'DMARC configurado em modo passivo (p=none)',
          description: dmarcResult.inherited
            ? `A política DMARC herdada do domínio organizacional (${dmarcResult.inheritedFrom}) está definida com política efetiva "none", monitorando mas não rejeitando e-mails não autorizados.`
            : 'A política DMARC apenas monitora mas não rejeita e-mails falsificados.',
          severity: 'MEDIUM',
          remediation: `Evolua a política DMARC no domínio ${dmarcResult.inherited ? dmarcResult.inheritedFrom : 'raiz'} de "p=none" para "p=quarantine" ou "p=reject".`,
          category: 'INFRASTRUCTURE',
          cveOrStandard: 'RFC 7489',
        });
        reconData.moduleScore -= 10;
      }
    } else {
      findings.push({
        id: 'INFRA-MISSING-DMARC',
        title: 'Política DMARC Não Configurada',
        description: 'A falta de DMARC deixa a reputação de e-mails da empresa desprotegida contra fraudes de CEO e phishing corporativo.',
        severity: 'MEDIUM',
        remediation: `Configure um registro TXT em "_dmarc.${getOrganizationalDomain(host)}" com as diretrizes de tratamento de e-mails rejeitados.`,
        category: 'INFRASTRUCTURE',
        cveOrStandard: 'RFC 7489',
      });
      reconData.moduleScore -= 15;
    }

    // 2. IP Geolocation (via IP-API com timeout seguro)
    const primaryIp = reconData.resolvedIps[0];
    if (primaryIp) {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${primaryIp}?fields=status,country,countryCode,regionName,city,isp,org,as,lat,lon`, {
          signal: AbortSignal.timeout(3000),
        });
        if (geoRes.ok) {
          const geoJson = await geoRes.json();
          if (geoJson.status === 'success') {
            reconData.geolocation = {
              country: geoJson.country,
              countryCode: geoJson.countryCode,
              region: geoJson.regionName,
              city: geoJson.city,
              isp: geoJson.isp,
              org: geoJson.org,
              asn: geoJson.as,
              lat: geoJson.lat,
              lon: geoJson.lon,
            };
          }
        }
      } catch {
        // Fallback gracefully
      }

      // 3. Selective Port Scanning (concurrent)
      const portChecks = await Promise.all(
        COMMON_PORTS.map(async (cp) => {
          const open = await checkPort(primaryIp, cp.port, 1000);
          return {
            port: cp.port,
            service: cp.service,
            state: open ? ('OPEN' as const) : ('CLOSED' as const),
            riskLevel: cp.risk,
          };
        })
      );

      reconData.openPorts = portChecks;

      // Generate findings for dangerous open ports
      for (const p of portChecks) {
        if (p.state === 'OPEN') {
          if (p.port === 23) {
            findings.push({
              id: 'PORT-TELNET-OPEN',
              title: 'Porta Telnet (23) Aberta na Internet!',
              description: 'O protocolo Telnet transmite dados e credenciais em texto puro (não criptografado).',
              severity: 'CRITICAL',
              remediation: 'Desative o serviço Telnet imediatamente e migre para SSH com autenticação por chave.',
              category: 'INFRASTRUCTURE',
              cveOrStandard: 'CWE-319',
            });
            reconData.moduleScore -= 35;
          } else if ([3306, 5432, 6379].includes(p.port)) {
            findings.push({
              id: `PORT-DB-EXPOSED-${p.port}`,
              title: `Porta de Banco de Dados Exposta (${p.service} - ${p.port})`,
              description: `A porta de conexão direta ao banco ${p.service} está aberta publicamente na internet, vulnerável a ataques de força bruta.`,
              severity: 'CRITICAL',
              remediation: 'Restrinja o acesso à porta do banco usando firewall/Security Group para responder apenas à rede interna (VPC) ou VPN.',
              category: 'INFRASTRUCTURE',
              cveOrStandard: 'CWE-284',
            });
            reconData.moduleScore -= 30;
          } else if (p.port === 21) {
            findings.push({
              id: 'PORT-FTP-OPEN',
              title: 'Porta FTP (21) Aberta',
              description: 'O protocolo FTP tradicional não criptografa comandos e senhas em trânsito.',
              severity: 'HIGH',
              remediation: 'Utilize SFTP (porta 22) ou FTPS e feche a porta 21 pública.',
              category: 'INFRASTRUCTURE',
            });
            reconData.moduleScore -= 20;
          } else if (p.port === 3389) {
            findings.push({
              id: 'PORT-RDP-OPEN',
              title: 'Porta de Acesso Remoto RDP (3389) Aberta',
              description: 'Servidores com RDP exposto na internet são alvos primários de ataques automatizados de ransomware.',
              severity: 'HIGH',
              remediation: 'Feche o acesso RDP direto da internet. Exija conexão através de VPN corporativa com autenticação multifator (MFA).',
              category: 'INFRASTRUCTURE',
              cveOrStandard: 'OWASP A05',
            });
            reconData.moduleScore -= 20;
          }
        }
      }
    }

    // 4. Subdomain Discovery (Certificate Transparency Logs crt.sh)
    try {
      const crtRes = await fetch(`https://crt.sh/?q=%25.${host}&output=json`, {
        signal: AbortSignal.timeout(4000),
      });
      if (crtRes.ok) {
        const crtJson: Array<{ name_value: string }> = await crtRes.json();
        const set = new Set<string>();
        for (const item of crtJson.slice(0, 30)) {
          const names = item.name_value.split('\n');
          for (const n of names) {
            if (n.endsWith(host) && !n.includes('*')) {
              set.add(n.toLowerCase());
            }
          }
        }
        reconData.subdomains = Array.from(set).slice(0, 15);
      }
    } catch {
      // Subdomain log lookup failed or timed out
    }

    reconData.moduleScore = Math.max(0, reconData.moduleScore);
  } catch (err: unknown) {
    reconData.status = 'FAILED';
    reconData.moduleScore = 50;
  }

  return { data: reconData, findings };
}
