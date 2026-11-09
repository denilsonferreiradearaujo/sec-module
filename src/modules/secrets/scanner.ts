import { SecretAuditData, SecretLeakItem, SecurityFinding, SeverityLevel } from '@/core/types/security';

interface SecretRule {
  name: string;
  regex: RegExp;
  severity: SeverityLevel;
  recommendation: string;
}

const SECRET_DETECTION_RULES: SecretRule[] = [
  {
    name: 'AWS Access Key ID',
    regex: /\b(AKIA[0-9A-Z]{16})\b/g,
    severity: 'CRITICAL',
    recommendation: 'Revogue imediatamente a chave de acesso no AWS IAM Console e verifique os logs no AWS CloudTrail.',
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})\b/g,
    severity: 'CRITICAL',
    recommendation: 'Revogue o token imediatamente em GitHub > Settings > Developer Settings > Personal Access Tokens.',
  },
  {
    name: 'Chave Privada Criptográfica (RSA/SSH/EC)',
    regex: /-----BEGIN (?:RSA|EC|DSA|OPENSSH) PRIVATE KEY[^-]*-----/g,
    severity: 'CRITICAL',
    recommendation: 'Invalide este par de chaves e regenere novos certificados. Nunca versione chaves privadas em repositórios.',
  },
  {
    name: 'URI de Conexão de Banco de Dados com Senha',
    regex: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/([^:\s]+):([^@\s]+)@/gi,
    severity: 'CRITICAL',
    recommendation: 'Troque a senha do usuário do banco de dados imediatamente e migre a string de conexão para variáveis de ambiente.',
  },
  {
    name: 'Google Cloud API Key',
    regex: /\b(AIza[0-9A-Za-z\-_]{35})\b/g,
    severity: 'HIGH',
    recommendation: 'Restrinja o uso desta chave no Google Cloud Console por IP/Domínio ou delete e gere uma nova credencial.',
  },
  {
    name: 'Stripe Secret Key',
    regex: /\b(sk_live_[0-9a-zA-Z]{24,32})\b/g,
    severity: 'CRITICAL',
    recommendation: 'Acesse o Stripe Dashboard > Developers > API Keys e faça o roll da chave imediatamente.',
  },
  {
    name: 'Slack Webhook URL',
    regex: /https:\/\/hooks\.slack\.com\/services\/T[0-9A-Z]+\/B[0-9A-Z]+\/[0-9a-zA-Z]+/g,
    severity: 'HIGH',
    recommendation: 'Delete o Incoming Webhook no Slack e reconfigure um novo canal.',
  },
  {
    name: 'Atribuição de Segredo ou Senha em Texto Puro',
    regex: /(?:API_KEY|SECRET_KEY|DB_PASSWORD|AUTH_SECRET|JWT_SECRET)\s*=\s*['"]([a-zA-Z0-9_\-\.]{12,})['"]/gi,
    severity: 'HIGH',
    recommendation: 'Não comite senhas em arquivos de configuração estáticos. Utilize cofre de senhas (Vault) ou .env ignorado no .gitignore.',
  },
];

function maskSecret(secret: string): string {
  if (secret.length <= 8) return '****';
  return secret.substring(0, 4) + '*'.repeat(Math.min(16, secret.length - 8)) + secret.substring(secret.length - 4);
}

export async function scanSecretsInContent(
  content: string,
  sourceName = 'Código/Arquivo Auditado'
): Promise<{ data: SecretAuditData; findings: SecurityFinding[] }> {
  const findings: SecurityFinding[] = [];
  const leaks: SecretLeakItem[] = [];
  let moduleScore = 100;

  const lines = content.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    for (const rule of SECRET_DETECTION_RULES) {
      // Reset lastIndex for global regex
      rule.regex.lastIndex = 0;
      let match;

      while ((match = rule.regex.exec(line)) !== null) {
        const fullMatch = match[0];
        const masked = maskSecret(fullMatch);

        leaks.push({
          ruleName: rule.name,
          severity: rule.severity,
          detector: 'DevSecOps Secret Engine',
          matchMasked: masked,
          line: lineIdx + 1,
          recommendation: rule.recommendation,
        });

        if (rule.severity === 'CRITICAL') {
          moduleScore -= 30;
          findings.push({
            id: `SECRET-${rule.name.replace(/\s+/g, '-').toUpperCase()}-${lineIdx + 1}`,
            title: `Vazamento Crítico de Credencial: ${rule.name}`,
            description: `Identificada credencial exposta na linha ${lineIdx + 1} (${masked}). Chaves ativas expostas permitem acesso total a recursos em nuvem ou bancos de dados.`,
            severity: 'CRITICAL',
            remediation: rule.recommendation,
            category: 'OSINT',
            cveOrStandard: 'CWE-798 (Hard-coded Credentials) / OWASP A07:2021',
            impact: 'Comprometimento total de contas de nuvem, roubo de dados e cobranças indevidas.',
          });
        } else {
          moduleScore -= 15;
          findings.push({
            id: `SECRET-${rule.name.replace(/\s+/g, '-').toUpperCase()}-${lineIdx + 1}`,
            title: `Segredo Exposto Detectado: ${rule.name}`,
            description: `Identificado segredo na linha ${lineIdx + 1} (${masked}).`,
            severity: 'HIGH',
            remediation: rule.recommendation,
            category: 'OSINT',
            cveOrStandard: 'CWE-798',
          });
        }
      }
    }
  }

  moduleScore = Math.max(0, moduleScore);

  return {
    data: {
      status: 'SUCCESS',
      totalLeaks: leaks.length,
      leaks,
      sourceName,
      moduleScore,
    },
    findings,
  };
}
