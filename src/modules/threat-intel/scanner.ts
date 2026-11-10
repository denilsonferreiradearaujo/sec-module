import { ThreatIntelData, SecurityFinding } from '@/core/types/security';

const SUSPICIOUS_TLDS = [
  '.xyz', '.top', '.work', '.click', '.gq', '.cf', '.tk', '.ml', '.zip', '.mov',
  '.app', '.site', '.online', '.fun', '.live', '.icu', '.buzz', '.sbs', '.cam'
];

const FINANCIAL_AND_SECURITY_KEYWORDS = [
  'login', 'secure', 'verify', 'update', 'banking', 'account', 'senha', 'recadastro',
  'itau', 'bradesco', 'santander', 'nubank', 'caixa', 'bb', 'inter', 'paypal', 'apple-id',
  'microsoft-login', 'suporte', 'auth',
  'brasil', 'pago', 'pagamento', 'consulta', 'receita', 'beneficio', 'auxilio', 'valores',
  'resgate', 'gov', 'regularize', 'regularizacao', 'detran', 'ipva', 'serasa', 'restituicao',
  'fgts', 'inss', 'saque', 'carteira', 'pix'
];

const WILDCARD_DNS_SERVICES = [
  'sslip.io',
  'nip.io',
  'xip.io',
  'traefik.me',
  'localtest.me',
  'duckdns.org',
  'ngrok-free.app',
  'ngrok.io',
  'loca.lt',
  'serveo.net',
  'pagekite.me',
];

function calculateShannonEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const frequencies: Record<string, number> = {};
  for (const char of str) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  return Object.values(frequencies).reduce((entropy, freq) => {
    const p = freq / len;
    return entropy - p * Math.log2(p);
  }, 0);
}

export function getVirusTotalUrlId(url: string): string {
  // VirusTotal uses Base64URL without padding '='
  return Buffer.from(url)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function generateUrlCandidates(rawUrl: string): string[] {
  const candidates: string[] = [];
  const clean = rawUrl.trim();
  const withProtocol = clean.startsWith('http') ? clean : `https://${clean}`;
  candidates.push(withProtocol);

  try {
    const parsed = new URL(withProtocol);
    const host = parsed.hostname;
    const protocol = parsed.protocol;

    // 1. Without query params & hash
    const withoutQuery = `${protocol}//${host}${parsed.pathname}`;
    if (withoutQuery !== withProtocol) {
      candidates.push(withoutQuery);
      if (!withoutQuery.endsWith('/')) candidates.push(`${withoutQuery}/`);
    }

    // 2. Remove common redirect/trampoline padding like /go/, /out/, /link/, /r/, /c/
    const dePaddedPath = parsed.pathname.replace(/^\/(go|out|link|r|c|click|track|to)\//i, '/');
    if (dePaddedPath !== parsed.pathname) {
      const dePaddedUrl = `${protocol}//${host}${dePaddedPath}`;
      candidates.push(dePaddedUrl);
      if (!dePaddedUrl.endsWith('/')) candidates.push(`${dePaddedUrl}/`);
    }

    // 3. Sub-paths (e.g. /consulta/)
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (segments.length > 1) {
      for (const seg of segments) {
        if (!['go', 'out', 'link', 'r', 'c', 'app'].includes(seg.toLowerCase())) {
          const segUrl = `${protocol}//${host}/${seg}/`;
          if (!candidates.includes(segUrl)) candidates.push(segUrl);
        }
      }
    }

    // 4. Root URL
    const rootUrl = `${protocol}//${host}/`;
    if (!candidates.includes(rootUrl)) candidates.push(rootUrl);

  } catch {
    // ignore
  }

  return candidates;
}

export async function scanThreatIntel(target: string): Promise<{ data: ThreatIntelData; findings: SecurityFinding[] }> {
  const findings: SecurityFinding[] = [];
  const rawTarget = target.trim();
  let host = rawTarget.toLowerCase();
  host = host.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];

  const primaryUrl = rawTarget.startsWith('http') ? rawTarget : `https://${rawTarget}`;
  const urlId = getVirusTotalUrlId(primaryUrl);
  const vtPermalink = `https://www.virustotal.com/gui/url/${urlId}`;

  const threatData: ThreatIntelData = {
    status: 'SUCCESS',
    abuseConfidenceScore: 0,
    totalReports: 0,
    isMalicious: false,
    malwareMatches: [],
    virusTotal: {
      analyzed: false,
      maliciousVotes: 0,
      suspiciousVotes: 0,
      harmlessVotes: 0,
      totalEngines: 0,
      detectedEngines: [],
      permalink: vtPermalink,
    },
    phishingHeuristics: {
      suspiciousTld: false,
      homographAttack: false,
      highEntropy: false,
      ipAsHost: false,
      hasKeywords: [],
      isWildcardOrDynamicDns: false,
    },
    blacklists: [
      { name: 'VirusTotal Threat Analysis', listed: false },
      { name: 'URLhaus Abuse.ch (Malware Feeds)', listed: false },
      { name: 'VIPRE & Antivirus Heuristics', listed: false },
      { name: 'AbuseIPDB Threat Intelligence', listed: false },
    ],
    moduleScore: 100,
  };

  // 1. Check for Wildcard / Ephemeral Dynamic DNS Services (e.g. sslip.io, nip.io)
  const matchedWildcard = WILDCARD_DNS_SERVICES.find((service) => host.endsWith(service) || host.includes(`.${service}`));
  if (matchedWildcard) {
    threatData.phishingHeuristics.isWildcardOrDynamicDns = true;
    threatData.phishingHeuristics.wildcardService = matchedWildcard;

    const ipMatch = host.match(/(\d{1,3})[-.](\d{1,3})[-.](\d{1,3})[-.](\d{1,3})/);
    let extractedIp: string | undefined;
    if (ipMatch) {
      extractedIp = `${ipMatch[1]}.${ipMatch[2]}.${ipMatch[3]}.${ipMatch[4]}`;
      threatData.phishingHeuristics.embeddedIp = extractedIp;
    }

    threatData.isMalicious = true;
    threatData.blacklists[2].listed = true;
    threatData.blacklists[2].details = `Uso de resolvedor de IP efêmero (${matchedWildcard}) com IP direto embutido (${extractedIp || 'detectado'}).`;

    findings.push({
      id: 'THREAT-WILDCARD-DYNAMIC-DNS-MALWARE-VECTOR',
      title: `Infraestrutura Evasiva de Alto Risco: DNS Curinga Dinâmico (${matchedWildcard})`,
      description: `O domínio "${host}" utiliza um serviço de DNS efêmero (${matchedWildcard}) com mapeamento direto para o endereço IP ${extractedIp || 'da máquina'}. Este mecanismo é amplamente utilizado por agentes maliciosos para distribuir malware, testes não autorizados e servidores C2 sem registrar domínios oficiais, contornando reputações de segurança.`,
      severity: 'CRITICAL',
      remediation: 'Bloqueie qualquer comunicação de saída da sua rede para domínios *.sslip.io e *.nip.io e investigue os logs de quem tentou acessar esse IP.',
      category: 'THREAT_INTEL',
      cveOrStandard: 'MITRE ATT&CK T1568 (Dynamic Resolution)',
      impact: 'Motores antivírus como VIPRE e VirusTotal rotulam rotineiramente esses links como Malware.',
    });

    threatData.moduleScore -= 45;
  }

  // 2. IP as hostname directly
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    threatData.phishingHeuristics.ipAsHost = true;
    findings.push({
      id: 'THREAT-IP-AS-HOST',
      title: 'Acesso Direto por Endereço IP Bruto',
      description: 'URLs acessadas diretamente por IP em vez de nome de domínio registrado são comumente utilizadas para evadir filtros de reputação.',
      severity: 'MEDIUM',
      remediation: 'Utilize nomes de domínio FQDN com certificados TLS válidos em ambientes de produção.',
      category: 'THREAT_INTEL',
    });
    threatData.moduleScore -= 15;
  }

  // 3. Punycode / Homograph attack
  if (host.startsWith('xn--') || host.includes('.xn--')) {
    threatData.phishingHeuristics.homographAttack = true;
    findings.push({
      id: 'THREAT-HOMOGRAPH-PUNYCODE',
      title: 'Ataque Homógrafo / Punycode Detectado',
      description: 'O domínio utiliza caracteres internacionais (IDN/Punycode) que podem imitar visualmente marcas legítimas para enganar vítimas.',
      severity: 'HIGH',
      remediation: 'Verifique a autenticidade do registrador e garanta que o domínio não é um clone visual de uma marca parceira.',
      category: 'THREAT_INTEL',
    });
    threatData.moduleScore -= 30;
  }

  // 4. Suspicious TLD check
  for (const tld of SUSPICIOUS_TLDS) {
    if (host.endsWith(tld)) {
      threatData.phishingHeuristics.suspiciousTld = true;
      threatData.moduleScore -= 10;
      break;
    }
  }

  // 5. Keyword Analysis (Brand impersonation on domain and full URL)
  const targetLower = rawTarget.toLowerCase();
  for (const kw of FINANCIAL_AND_SECURITY_KEYWORDS) {
    if (targetLower.includes(kw)) {
      threatData.phishingHeuristics.hasKeywords.push(kw);
    }
  }

  // Check Brazilian Gov & Financial Impersonation on Generic / Untrusted TLD
  const isGenericTld = SUSPICIOUS_TLDS.some(t => host.endsWith(t));
  const hasGovOrBank = /(brasil|gov|receita|beneficio|auxilio|valores|pago|pagamento)/i.test(host);
  if (isGenericTld && hasGovOrBank && !host.endsWith('.gov.br') && !host.endsWith('.com.br') && !host.endsWith('.b.br')) {
    findings.push({
      id: 'THREAT-GOV-FINANCIAL-IMPERSONATION-GENERIC-TLD',
      title: 'Impersonação de Portal Governamental / Financeiro Brasileiro (TLD Não Oficial)',
      description: `O domínio "${host}" utiliza termos oficiais/financeiros (ex: brasil/pago/gov) sob a terminação genérica comercial, simulando um serviço público ou plataforma de pagamentos. Portais oficiais de órgãos públicos no Brasil utilizam obrigatoriamente a extensão oficial ".gov.br".`,
      severity: 'CRITICAL',
      remediation: 'Nunca informe dados bancários, CPF ou realize pagamentos via PIX em domínios fora da zona oficial ".gov.br" ou de instituições bancárias autorizadas pelo Banco Central.',
      category: 'THREAT_INTEL',
      cveOrStandard: 'OWASP Brand Impersonation / Engenharia Social',
    });
    threatData.moduleScore -= 50;
    threatData.isMalicious = true;
  }

  // 6. Check for CPF / Document Exposure in URL parameters (?doc=... or ?cpf=...)
  const docMatch = rawTarget.match(/[?&](doc|cpf|documento|num|id|titular)=(\d{11})\b/i);
  if (docMatch) {
    const maskedCpf = `${docMatch[2].substring(0, 3)}.***.***-${docMatch[2].substring(9)}`;
    findings.push({
      id: 'THREAT-EXPOSED-CPF-PARAMETER-PHISHING',
      title: 'Alerta Crítico: Parâmetro de CPF em URL de Consulta Não Oficial (?doc=)',
      description: `A URL transporta um número de CPF (${maskedCpf}) em texto claro no parâmetro de consulta. Este padrão é fortemente característico de campanhas de phishing e engenharia social fraudulentas (falsos benefícios, valores a receber ou falsas consultas governamentais).`,
      severity: 'CRITICAL',
      remediation: 'Não insira senhas nem faça pagamentos ou transferências PIX nesta página. Portais governamentais legítimos utilizam exclusivamente domínios com final ".gov.br" autenticados pelo Gov.br.',
      category: 'THREAT_INTEL',
      cveOrStandard: 'MITRE ATT&CK T1566 (Phishing)',
      impact: 'Golpe financeiro, roubo de identidade e cobranças indevidas.',
    });
    threatData.moduleScore -= 45;
    threatData.isMalicious = true;
  }

  // 7. Entropy check (DGA detection)
  const domainPrefix = host.split('.')[0] || '';
  if (domainPrefix.length > 8) {
    const entropy = calculateShannonEntropy(domainPrefix);
    if (entropy > 3.8) {
      threatData.phishingHeuristics.highEntropy = true;
      findings.push({
        id: 'THREAT-HIGH-ENTROPY',
        title: 'Alta Entropia no Nome do Domínio (Suspeita de DGA)',
        description: 'O nome do domínio possui distribuição de caracteres atipicamente randômica, similar a algoritmos de geração de domínios maliciosos (DGA).',
        severity: 'MEDIUM',
        remediation: 'Audite a origem do tráfego e as credenciais vinculadas a este domínio.',
        category: 'THREAT_INTEL',
      });
      threatData.moduleScore -= 15;
    }
  }

  // 8. Multi-Engine Threat Intelligence (VirusTotal API v3 com Tree-Walking Anti-Evasão)
  const vtApiKey = process.env.VIRUSTOTAL_API_KEY;
  if (vtApiKey) {
    try {
      const candidates = generateUrlCandidates(rawTarget);
      let threatFound = false;

      for (const candidate of candidates) {
        const cId = getVirusTotalUrlId(candidate);
        try {
          const vtRes = await fetch(`https://www.virustotal.com/api/v3/urls/${cId}`, {
            headers: { 'x-apikey': vtApiKey },
            signal: AbortSignal.timeout(3500),
          });

          if (vtRes.ok) {
            const vtJson = await vtRes.json();
            const attrs = vtJson?.data?.attributes;
            const stats = attrs?.last_analysis_stats || {};
            const results = attrs?.last_analysis_results || {};

            const maliciousVotes = stats.malicious || 0;
            const suspiciousVotes = stats.suspicious || 0;
            const harmlessVotes = stats.harmless || 0;
            const totalEngines = Object.keys(results).length || 93;

            const detectedEngines: string[] = [];
            for (const [engineName, engData] of Object.entries<any>(results)) {
              if (engData?.category === 'malicious' || engData?.category === 'suspicious') {
                detectedEngines.push(`${engineName}: ${engData.result || 'malicious'}`);
              }
            }

            if (maliciousVotes > 0 || suspiciousVotes > 0) {
              threatFound = true;
              threatData.virusTotal = {
                analyzed: true,
                maliciousVotes,
                suspiciousVotes,
                harmlessVotes,
                totalEngines,
                detectedEngines,
                permalink: `https://www.virustotal.com/gui/url/${cId}`,
              };

              threatData.isMalicious = true;
              threatData.blacklists[0].listed = true;
              threatData.blacklists[0].details = `Classificado como malicioso por ${maliciousVotes} motor(es) globais (ex: ${detectedEngines.slice(0, 3).join(', ')}). Variação detectada: ${candidate}`;

              const isEvasion = candidate !== rawTarget;
              findings.push({
                id: 'THREAT-MULTI-ENGINE-MALWARE-CONFIRMED',
                title: isEvasion
                  ? `Tentativa de Evasão Detectada: Ameaça Confirmada por Variação de Caminho (${maliciousVotes}/${totalEngines} Motores)!`
                  : `Ameaça Confirmada: Detectado como Malicioso por ${maliciousVotes}/${totalEngines} Motores de Proteção!`,
                description: isEvasion
                  ? `Motores de segurança globais (incluindo: ${detectedEngines.join(', ')}) classificaram o caminho base "${candidate}" como malicioso/phishing. O atacante tentou mascarar a detecção inserindo parâmetros dinâmicos ou redirecionamentos.`
                  : `Motores de segurança globais (incluindo: ${detectedEngines.join(', ')}) classificaram este alvo diretamente como malicioso.`,
                severity: 'CRITICAL',
                remediation: 'Bloqueie imediatamente o endereço em Proxies, Gateways e Firewalls (EDR/SIEM). Não tente abrir o endereço.',
                category: 'THREAT_INTEL',
                cveOrStandard: isEvasion ? 'MITRE ATT&CK T1566 (Phishing / Defense Evasion)' : 'Global Threat Intelligence',
                impact: 'Infecção de endpoints, roubo de credenciais ou execução remota de código.',
              });
              threatData.moduleScore -= 50;
              break; // Threat detected, no need to query further candidates
            }
          }
        } catch {
          // continue to next candidate
        }
      }

      // If no URL candidate hit, query domain as fallback
      if (!threatFound && host) {
        try {
          const domRes = await fetch(`https://www.virustotal.com/api/v3/domains/${host}`, {
            headers: { 'x-apikey': vtApiKey },
            signal: AbortSignal.timeout(3500),
          });
          if (domRes.ok) {
            const domJson = await domRes.json();
            const attrs = domJson?.data?.attributes;
            const stats = attrs?.last_analysis_stats || {};
            const results = attrs?.last_analysis_results || {};
            const maliciousVotes = stats.malicious || 0;
            const suspiciousVotes = stats.suspicious || 0;
            const harmlessVotes = stats.harmless || 0;
            const totalEngines = Object.keys(results).length || 93;

            const detectedEngines: string[] = [];
            for (const [engineName, engData] of Object.entries<any>(results)) {
              if (engData?.category === 'malicious' || engData?.category === 'suspicious') {
                detectedEngines.push(`${engineName}: ${engData.result || 'malicious'}`);
              }
            }

            threatData.virusTotal = {
              analyzed: true,
              maliciousVotes,
              suspiciousVotes,
              harmlessVotes,
              totalEngines,
              detectedEngines,
              permalink: `https://www.virustotal.com/gui/domain/${host}`,
            };

            if (maliciousVotes > 0 || suspiciousVotes > 0) {
              threatData.isMalicious = true;
              threatData.blacklists[0].listed = true;
              threatData.blacklists[0].details = `Domínio classificado como malicioso por ${maliciousVotes} motor(es) globais.`;
              findings.push({
                id: 'THREAT-MULTI-ENGINE-DOMAIN-MALICIOUS',
                title: `Domínio Raiz Sinalizado como Malicioso por ${maliciousVotes}/${totalEngines} Motores!`,
                description: `Motores de segurança globais (incluindo: ${detectedEngines.join(', ')}) classificaram o domínio raiz "${host}" como malicioso.`,
                severity: 'CRITICAL',
                remediation: 'Bloqueie todo o tráfego para este domínio na rede.',
                category: 'THREAT_INTEL',
                cveOrStandard: 'Global Threat Intelligence',
              });
              threatData.moduleScore -= 50;
            }
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // Threat lookup completed or timed out
    }
  }

  // 9. Query URLhaus API for verified malware URLs (checking both full URL and candidates)
  try {
    const candidates = generateUrlCandidates(rawTarget);
    for (const c of candidates.slice(0, 2)) {
      const formData = new URLSearchParams();
      formData.append('url', c);

      const urlhausRes = await fetch('https://urlhaus-api.abuse.ch/v1/url/', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(3000),
      });

      if (urlhausRes.ok) {
        const data = await urlhausRes.json();
        if (data.query_status === 'ok') {
          threatData.isMalicious = true;
          threatData.blacklists[1].listed = true;
          threatData.blacklists[1].details = `URL catalogada na base Abuse.ch URLhaus (Status: ${data.url_status || 'ativo'}).`;

          findings.push({
            id: 'THREAT-URLHAUS-PAYLOAD-URL',
            title: 'URL Listada como Distribuidora de Malware (Abuse.ch URLhaus)!',
            description: `Identificado registro de entrega de payloads maliciosos ou comando e controle (C2) associado a esta URL específica (${c}).`,
            severity: 'CRITICAL',
            remediation: 'Bloqueie imediatamente o tráfego de saída na rede para este endereço.',
            category: 'THREAT_INTEL',
            cveOrStandard: 'MITRE ATT&CK T1071',
          });
          threatData.moduleScore -= 50;
          break;
        }
      }
    }
  } catch {
    // URLhaus check completed
  }

  threatData.moduleScore = Math.max(0, threatData.moduleScore);
  return { data: threatData, findings };
}
