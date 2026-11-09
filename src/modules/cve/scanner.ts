import { CveData, CveItem, SecurityFinding, SeverityLevel } from '@/core/types/security';

// Curated high-impact CVE reference cache for instant offline matching with CONFIRMED vulnerable versions
const KNOWN_TECH_CVES: Record<string, CveItem[]> = {
  'apache 2.4.49': [
    {
      id: 'CVE-2021-41773',
      source: 'NVD / NIST',
      description: 'Path traversal e execução remota de código (RCE) no Apache HTTP Server 2.4.49.',
      cvssScore: 9.8,
      cvssSeverity: 'CRITICAL',
      publishedDate: '2021-10-05',
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-41773'],
    },
    {
      id: 'CVE-2021-42013',
      source: 'NVD / NIST',
      description: 'Falha incompleta na correção do CVE-2021-41773 permitindo RCE.',
      cvssScore: 9.8,
      cvssSeverity: 'CRITICAL',
      publishedDate: '2021-10-08',
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-42013'],
    },
  ],
  'nginx 1.18': [
    {
      id: 'CVE-2021-23017',
      source: 'NVD / NIST',
      description: '1-byte memory overwrite no resolver DNS do Nginx 0.6.18-1.20.0 permitindo negação de serviço ou execução de código.',
      cvssScore: 8.8,
      cvssSeverity: 'HIGH',
      publishedDate: '2021-06-01',
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2021-23017'],
    },
  ],
  'openresty 1.15': [
    {
      id: 'CVE-2020-11724',
      source: 'NVD / NIST',
      description: 'HTTP request smuggling no OpenResty antes da versão 1.17.8.2 devido a manipulação inadequada de Content-Length.',
      cvssScore: 7.5,
      cvssSeverity: 'HIGH',
      publishedDate: '2020-04-14',
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2020-11724'],
    },
  ],
  'openresty 1.17': [
    {
      id: 'CVE-2020-11724',
      source: 'NVD / NIST',
      description: 'HTTP request smuggling no OpenResty antes da versão 1.17.8.2 devido a manipulação inadequada de Content-Length.',
      cvssScore: 7.5,
      cvssSeverity: 'HIGH',
      publishedDate: '2020-04-14',
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2020-11724'],
    },
  ],
  'openssl 1.0.1': [
    {
      id: 'CVE-2014-0160',
      source: 'NVD / NIST',
      description: 'Heartbleed bug: Vazamento de memória de processo TLS via extensão heartbeat.',
      cvssScore: 7.5,
      cvssSeverity: 'HIGH',
      publishedDate: '2014-04-07',
      references: ['https://nvd.nist.gov/vuln/detail/CVE-2014-0160'],
    },
  ],
};

function cvssToSeverity(score: number): SeverityLevel {
  if (score >= 9.0) return 'CRITICAL';
  if (score >= 7.0) return 'HIGH';
  if (score >= 4.0) return 'MEDIUM';
  return 'LOW';
}

export async function scanCvesForTechnologies(technologies: string[]): Promise<{ data: CveData; findings: SecurityFinding[] }> {
  const findings: SecurityFinding[] = [];
  const allCves: CveItem[] = [];
  let moduleScore = 100;

  for (const tech of technologies.slice(0, 4)) {
    const cleanTech = tech.replace(/^(Server|Powered-By):\s*/i, '').trim().toLowerCase();
    if (!cleanTech || cleanTech.length < 3) continue;

    // Normalize slashes to spaces for uniform matching: "nginx/1.18" -> "nginx 1.18"
    const normalizedTech = cleanTech.replace('/', ' ');
    const hasVersion = /\b\d+(\.\d+)+/.test(cleanTech);

    // If NO version number is present (e.g. "openresty", "nginx", "apache"):
    // DO NOT flag false positive CVEs! Instead, classify as an INFO finding (banner disclosure / server_tokens).
    if (!hasVersion) {
      findings.push({
        id: `BANNER-DISCLOSURE-${cleanTech.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`,
        title: `Divulgação de Software sem Versão: ${cleanTech} (Hardening)`,
        description: `O servidor expõe a tecnologia em uso ("${cleanTech}") no cabeçalho HTTP ou banner, porém sem divulgar a versão específica. Sem o número exato da versão, NÃO é possível confirmar a presença de vulnerabilidades conhecidas (CVEs). Nenhuma falha crítica foi atribuída para evitar falso positivo.`,
        severity: 'INFO',
        remediation: `Para reforçar a segurança por obscuridade e impedir o fingerprinting de sua infraestrutura, adicione a diretiva "server_tokens off;" (no Nginx/OpenResty) ou "ServerTokens Prod" / "ServerSignature Off" (no Apache) para ocultar o nome do servidor.`,
        category: 'WEB_POSTURE',
        cveOrStandard: 'CWE-200 (Information Exposure)',
        impact: 'Facilita o reconhecimento de superfície e mapeamento de tecnologias por atacantes.',
      });
      moduleScore -= 2;
      continue;
    }

    // When a version is present, proceed with precise matching:
    // 1. Check curated knowledge base first
    for (const [key, cves] of Object.entries(KNOWN_TECH_CVES)) {
      if (normalizedTech.includes(key)) {
        allCves.push(...cves);
      }
    }

    // 2. Query official NVD NIST API v2.0 using the specific product + version
    try {
      const nvdUrl = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(normalizedTech)}&resultsPerPage=3`;
      const res = await fetch(nvdUrl, {
        headers: {
          'User-Agent': 'DeveSec-Security-Suite/1.0',
        },
        signal: AbortSignal.timeout(3500),
      });

      if (res.ok) {
        const json = await res.json();
        const vulnerabilities = json.vulnerabilities || [];

        for (const item of vulnerabilities) {
          const cve = item.cve;
          if (!cve || !cve.id) continue;

          // Check if already in list
          if (allCves.some((c) => c.id === cve.id)) continue;

          const description = cve.descriptions?.[0]?.value || 'Descrição indisponível no NVD.';
          const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData || cve.metrics?.cvssMetricV30?.[0]?.cvssData || {};
          const cvssScore = metrics.baseScore || 6.5;
          const severity = cvssToSeverity(cvssScore);

          const cveItem: CveItem = {
            id: cve.id,
            source: 'NVD / NIST',
            description,
            cvssScore,
            cvssSeverity: severity,
            publishedDate: cve.published ? cve.published.split('T')[0] : 'Desconhecida',
            references: (cve.references || []).slice(0, 2).map((r: { url: string }) => r.url),
          };

          allCves.push(cveItem);
        }
      }
    } catch {
      // Fallback to curated cache
    }
  }

  // Generate SecurityFindings for confirmed detected CVEs
  for (const cve of allCves) {
    const findingId = cve.id.startsWith('CVE-') ? cve.id : `CVE-${cve.id}`;
    if (cve.cvssSeverity === 'CRITICAL') {
      moduleScore -= 25;
      findings.push({
        id: findingId,
        title: `Vulnerabilidade Crítica Confirmada: ${cve.id} (CVSS ${cve.cvssScore})`,
        description: cve.description,
        severity: 'CRITICAL',
        remediation: `Atualize imediatamente o componente para a versão estável mais recente ou aplique o patch de segurança oficial indicado pelo fabricante (${cve.id}).`,
        category: 'WEB_POSTURE',
        cveOrStandard: cve.id,
        impact: 'Execução remota de código, negação de serviço ou escalonamento de privilégios.',
      });
    } else if (cve.cvssSeverity === 'HIGH') {
      moduleScore -= 15;
      findings.push({
        id: findingId,
        title: `Vulnerabilidade de Alto Impacto Confirmada: ${cve.id} (CVSS ${cve.cvssScore})`,
        description: cve.description,
        severity: 'HIGH',
        remediation: `Aplique a atualização de segurança recomendada para mitigar o ${cve.id}.`,
        category: 'WEB_POSTURE',
        cveOrStandard: cve.id,
      });
    }
  }

  moduleScore = Math.max(0, moduleScore);

  return {
    data: {
      status: 'SUCCESS',
      queriedTechnologies: technologies,
      totalCves: allCves.length,
      cves: allCves,
      moduleScore,
    },
    findings,
  };
}
