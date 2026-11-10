import { exec } from 'child_process';
import { promisify } from 'util';
import { SecurityFinding, SeverityLevel } from '@/core/types/security';
import { KaliArsenalResult } from '@/core/types/kali-tools';

const execAsync = promisify(exec);

const NUCLEI_TEMPLATE_SIGNATURES = [
  { path: '/actuator/env', name: 'Spring Boot Actuator Env Exposto', cve: 'CVE-2022-22965', severity: 'CRITICAL' as SeverityLevel },
  { path: '/actuator/heapdump', name: 'Spring Boot Heapdump Disponível Publicamente', cve: 'CWE-200', severity: 'CRITICAL' as SeverityLevel },
  { path: '/swagger-ui/index.html', name: 'Documentação Swagger UI Exposta', cve: 'OWASP A05', severity: 'INFO' as SeverityLevel },
  { path: '/api/v1/health', name: 'Endpoint de Saúde de API Identificado', cve: 'INFO', severity: 'INFO' as SeverityLevel },
  { path: '/wp-json/wp/v2/users', name: 'Enumeração de Usuários WordPress Habilitada', cve: 'CWE-200', severity: 'MEDIUM' as SeverityLevel },
];

export async function runNucleiScan(target: string): Promise<KaliArsenalResult> {
  const startTime = Date.now();
  const cleanUrl = target.startsWith('http') ? target : `https://${target}`;
  const findings: SecurityFinding[] = [];

  // Check if nuclei CLI is installed
  let cliAvailable = false;
  try {
    const { stdout } = await execAsync('nuclei -version');
    if (stdout.includes('nuclei')) cliAvailable = true;
  } catch {
    cliAvailable = false;
  }

  if (cliAvailable) {
    try {
      const cmd = `nuclei -u ${cleanUrl} -tags cve,misconfig -severity critical,high -silent -jsonl`;
      const { stdout } = await execAsync(cmd, { timeout: 35000 });

      const lines = stdout.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          findings.push({
            id: `NUCLEI-${item.info?.name?.replace(/[^a-z0-9]/gi, '_') || item.templateID}`,
            title: `${item.info?.name || 'Vulnerabilidade Ativa Detectada'} (Nuclei)`,
            description: `${item.info?.description || 'Template do Nuclei disparou positivo para o alvo especificado.'}`,
            severity: (item.info?.severity?.toUpperCase() as SeverityLevel) || 'HIGH',
            remediation: 'Consulte a documentação oficial da CVE e aplique o patch de atualização do componente imediatamente.',
            category: 'WEB_POSTURE',
            cveOrStandard: item.info?.classification?.['cve-id']?.[0] || 'Nuclei Community Template',
          });
        } catch {
          // ignore parse error
        }
      }

      return {
        engineName: 'Nuclei (Community Templates Runner)',
        status: 'SUCCESS',
        durationMs: Date.now() - startTime,
        mode: 'CLI_NATIVE',
        findings,
      };
    } catch {
      // Fallback
    }
  }

  // TypeScript Native Nuclei-Style High-Impact Template Tests
  await Promise.all(
    NUCLEI_TEMPLATE_SIGNATURES.map(async (tmpl) => {
      try {
        const testUrl = new URL(tmpl.path, cleanUrl).toString();
        const res = await fetch(testUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: AbortSignal.timeout(4000),
        });

        if (res.status === 200) {
          const text = await res.text();
          if (text.length > 20 && !text.includes('<!DOCTYPE html') && !text.includes('404 Not Found')) {
            findings.push({
              id: `NUCLEI-EMULATED-${tmpl.path.replace(/[^a-z0-9]/gi, '_')}`,
              title: `${tmpl.name} (Template Nuclei Dev & Sec)`,
              description: `O endpoint "${tmpl.path}" respondeu com HTTP 200 e dados ativos. Exposição pública de endpoints internos expõe a arquitetura do backend.`,
              severity: tmpl.severity,
              remediation: `Restrinja o acesso ao endpoint "${tmpl.path}" para a rede interna ou adicione camada de autenticação obrigatória.`,
              category: 'WEB_POSTURE',
              cveOrStandard: tmpl.cve,
            });
          }
        }
      } catch {
        // ignore
      }
    })
  );

  return {
    engineName: 'Nuclei (Motor de Templates Dev & Sec)',
    status: 'SUCCESS',
    durationMs: Date.now() - startTime,
    mode: 'TYPESCRIPT_FALLBACK',
    findings,
  };
}
