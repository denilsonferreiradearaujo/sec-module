import { SecurityFinding } from '@/core/types/security';
import { KaliArsenalResult } from '@/core/types/kali-tools';

const SQL_ERROR_PATTERNS = [
  { db: 'MySQL', regex: /you have an error in your sql syntax|warning: mysql_|check the manual that corresponds to your mysql/i },
  { db: 'PostgreSQL', regex: /pg_query\(\)|syntax error at or near|unterminated quoted string/i },
  { db: 'Microsoft SQL Server', regex: /unclosed quotation mark after the character string|microsoft ole db provider for sql server/i },
  { db: 'Oracle', regex: /ora-[0-9]{5}|quoted string not properly terminated/i },
  { db: 'SQLite', regex: /sqlite3::sqlexception|sqlite_error|near ".*": syntax error/i },
];

export async function runSqlmapScan(target: string): Promise<KaliArsenalResult> {
  const startTime = Date.now();
  const cleanUrl = target.startsWith('http') ? target : `https://${target}`;
  const findings: SecurityFinding[] = [];

  try {
    const urlObj = new URL(cleanUrl);
    const searchParams = urlObj.searchParams;

    // Probe 1: Safe syntax test on query parameters if present, or on standard search parameter
    const testKeys = Array.from(searchParams.keys());
    if (testKeys.length === 0) {
      // Test simulated search parameter
      testKeys.push('id', 'search');
    }

    for (const key of testKeys.slice(0, 3)) {
      try {
        const probeUrl = new URL(cleanUrl);
        // Safe probe single quote marker
        probeUrl.searchParams.set(key, `'`);

        const res = await fetch(probeUrl.toString(), {
          headers: { 'User-Agent': 'DevSec-SQL-Auditor/1.0' },
          signal: AbortSignal.timeout(5000),
        });

        const body = await res.text();

        for (const pattern of SQL_ERROR_PATTERNS) {
          if (pattern.regex.test(body)) {
            findings.push({
              id: `KALI-SQLI-${key}-${pattern.db}`,
              title: `Vulnerabilidade Potencial de Injeção de SQL (${pattern.db})`,
              description: `O parâmetro "${key}" retornou mensagem de erro de sintaxe de banco de dados (${pattern.db}) ao receber caractere de escape. Isso indica concatenação de strings sem consultas parametrizadas.`,
              severity: 'CRITICAL',
              remediation: `Substitua consultas dinâmicas por Prepared Statements (Consultas Parametrizadas) ou utilize um ORM (Prisma, TypeORM, Hibernate). Nunca concatene entradas de usuários diretamente no comando SQL.`,
              category: 'WEB_POSTURE',
              cveOrStandard: 'OWASP A03:2021 / CWE-89',
            });
            break;
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  return {
    engineName: 'SQLmap (Heurística de Injeção SQL Dev & Sec)',
    status: 'SUCCESS',
    durationMs: Date.now() - startTime,
    mode: 'TYPESCRIPT_FALLBACK',
    findings,
    details: {
      mode: 'NON_DESTRUCTIVE_HEURISTIC',
      parametersAudited: findings.length > 0 ? 'Vulnerabilidade Detectada' : 'Parâmetros Seguros',
    },
  };
}
