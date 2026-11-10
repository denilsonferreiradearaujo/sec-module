import { exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';
import { SecurityFinding, SeverityLevel } from '@/core/types/security';
import { KaliArsenalResult } from '@/core/types/kali-tools';

const execAsync = promisify(exec);

const TARGET_PORTS = [
  { port: 21, service: 'FTP', risk: 'HIGH' as SeverityLevel },
  { port: 22, service: 'SSH', risk: 'LOW' as SeverityLevel },
  { port: 23, service: 'Telnet', risk: 'CRITICAL' as SeverityLevel },
  { port: 25, service: 'SMTP', risk: 'LOW' as SeverityLevel },
  { port: 53, service: 'DNS', risk: 'INFO' as SeverityLevel },
  { port: 80, service: 'HTTP', risk: 'INFO' as SeverityLevel },
  { port: 110, service: 'POP3', risk: 'MEDIUM' as SeverityLevel },
  { port: 443, service: 'HTTPS', risk: 'INFO' as SeverityLevel },
  { port: 445, service: 'SMB', risk: 'CRITICAL' as SeverityLevel },
  { port: 1433, service: 'MSSQL', risk: 'CRITICAL' as SeverityLevel },
  { port: 3306, service: 'MySQL', risk: 'CRITICAL' as SeverityLevel },
  { port: 3389, service: 'RDP', risk: 'CRITICAL' as SeverityLevel },
  { port: 5432, service: 'PostgreSQL', risk: 'CRITICAL' as SeverityLevel },
  { port: 6379, service: 'Redis', risk: 'CRITICAL' as SeverityLevel },
  { port: 8080, service: 'HTTP-Proxy / Dev', risk: 'LOW' as SeverityLevel },
  { port: 8443, service: 'HTTPS-Alt', risk: 'INFO' as SeverityLevel },
  { port: 27017, service: 'MongoDB', risk: 'CRITICAL' as SeverityLevel },
];

function checkSocketPort(host: string, port: number, timeout = 1200): Promise<{ port: number; open: boolean; banner?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let banner = '';

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      // Send a safe probe to prompt banner
      socket.write('HEAD / HTTP/1.0\r\n\r\n');
    });

    socket.on('data', (data) => {
      banner = data.toString('utf-8', 0, 120).replace(/[\r\n]+/g, ' ').trim();
      socket.destroy();
      resolve({ port, open: true, banner });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, open: false });
    });

    socket.on('error', () => {
      socket.destroy();
      resolve({ port, open: false });
    });

    socket.on('close', () => {
      resolve({ port, open: Boolean(banner), banner: banner || undefined });
    });

    try {
      socket.connect(port, host);
    } catch {
      resolve({ port, open: false });
    }
  });
}

export async function runNmapScan(target: string): Promise<KaliArsenalResult> {
  const startTime = Date.now();
  const cleanHost = target.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];
  const findings: SecurityFinding[] = [];

  // Check if nmap binary is available
  let cliAvailable = false;
  try {
    const { stdout } = await execAsync('nmap --version');
    if (stdout.includes('Nmap version')) cliAvailable = true;
  } catch {
    cliAvailable = false;
  }

  if (cliAvailable) {
    try {
      const portList = TARGET_PORTS.map(p => p.port).join(',');
      const cmd = `nmap -sV -T4 --open -p ${portList} ${cleanHost}`;
      const { stdout } = await execAsync(cmd, { timeout: 25000 });

      // Parse Nmap text output
      for (const item of TARGET_PORTS) {
        const regex = new RegExp(`${item.port}/tcp\\s+open\\s+([^\\r\\n]+)`, 'i');
        const match = stdout.match(regex);
        if (match) {
          const serviceBanner = match[1].trim();
          if (item.risk === 'CRITICAL') {
            findings.push({
              id: `KALI-NMAP-EXPOSED-${item.port}`,
              title: `Porta Crítica de Infraestrutura Exposta: ${item.port}/${item.service} (Nmap)`,
              description: `O motor Nmap confirmou a porta ${item.port} (${item.service}) aberta e respondendo na Internet. Detalhes: "${serviceBanner}".`,
              severity: 'CRITICAL',
              remediation: `Bloqueie imediatamente a porta ${item.port} no firewall ou security group de nuvem (AWS/Azure/GCP). Acesso deve ser exclusivo via VPN com autenticação MFA.`,
              category: 'INFRASTRUCTURE',
              cveOrStandard: 'CIS Benchmark 9.2',
            });
          }
        }
      }

      return {
        engineName: 'Nmap (Network Mapper)',
        status: 'SUCCESS',
        durationMs: Date.now() - startTime,
        mode: 'CLI_NATIVE',
        rawOutput: stdout.substring(0, 500),
        findings,
        details: { cleanHost, mode: 'CLI' },
      };
    } catch {
      // Fallback if execution fails
    }
  }

  // TypeScript Native Socket Fallback Engine
  const socketResults = await Promise.all(
    TARGET_PORTS.map(p => checkSocketPort(cleanHost, p.port))
  );

  for (const res of socketResults) {
    if (res.open) {
      const def = TARGET_PORTS.find(p => p.port === res.port);
      if (def && (def.risk === 'CRITICAL' || def.risk === 'HIGH')) {
        findings.push({
          id: `KALI-NMAP-SOCKET-${def.port}`,
          title: `Porta Crítica de Infraestrutura Aberta: ${def.port}/${def.service}`,
          description: `Identificada conexão ativa na porta ${def.port} (${def.service})${res.banner ? ` com banner: "${res.banner}"` : ''}.`,
          severity: def.risk,
          remediation: `Restrinja o tráfego da porta ${def.port} via regras de firewall perimetrais.`,
          category: 'INFRASTRUCTURE',
          cveOrStandard: 'CWE-1188',
        });
      }
    }
  }

  return {
    engineName: 'Nmap (Engine Emulada Dev & Sec)',
    status: 'SUCCESS',
    durationMs: Date.now() - startTime,
    mode: 'TYPESCRIPT_FALLBACK',
    findings,
    details: {
      cleanHost,
      openPortsDetected: socketResults.filter(r => r.open).map(r => r.port),
    },
  };
}
