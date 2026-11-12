import { SecretAuditData, SecretLeakItem, SecurityFinding, SeverityLevel } from '@/core/types/security';

interface SecretRule {
  name: string;
  regex: RegExp;
  severity: SeverityLevel;
  recommendation: string;
}

interface ApiSastRule {
  id: string;
  name: string;
  standard: string;
  regex: RegExp;
  severity: SeverityLevel;
  description: string;
  remediation: string;
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
    name: 'URI de Conexão Redis com Senha',
    regex: /\bredis:\/\/(?:[^:@\s]+:)?([^@\s]+)@/gi,
    severity: 'HIGH',
    recommendation: 'Remova a senha embutida da connection string do Redis e use variáveis de ambiente seguras.',
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
    name: 'SendGrid API Key',
    regex: /\bSG\.[a-zA-Z0-9_\-\.]{50,70}\b/g,
    severity: 'HIGH',
    recommendation: 'Revogue a API Key no painel do SendGrid para impedir envio de spam/phishing através da sua conta.',
  },
  {
    name: 'Telegram Bot API Token',
    regex: /\b\d{8,10}:[a-zA-Z0-9_-]{35}\b/g,
    severity: 'HIGH',
    recommendation: 'Revogue o token do bot através do @BotFather no Telegram para impedir controle indevido.',
  },
  {
    name: 'Token JWT em Texto Puro (Header.Payload.Signature)',
    regex: /\beyJ[a-zA-Z0-9_\-]{10,}\.eyJ[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\b/g,
    severity: 'HIGH',
    recommendation: 'Tokens JWT contêm claims e assinaturas que não devem ser commitados no código-fonte.',
  },
  {
    name: 'Atribuição de Segredo ou Senha em Texto Puro',
    regex: /(?:API_KEY|SECRET_KEY|DB_PASSWORD|AUTH_SECRET|JWT_SECRET)\s*=\s*['"]([a-zA-Z0-9_\-\.]{12,})['"]/gi,
    severity: 'HIGH',
    recommendation: 'Não comite senhas em arquivos de configuração estáticos. Utilize cofre de senhas (Vault) ou .env ignorado no .gitignore.',
  },
];

const OWASP_API_RULES: ApiSastRule[] = [
  {
    id: 'OWASP-API1-BOLA',
    name: 'OWASP API1:2023 - Broken Object Level Authorization (BOLA)',
    standard: 'OWASP API Security Top 10',
    regex: /(?:\.findById|\.findOne|\.delete|\.destroy)\s*\(\s*(?:req\.params\.id|params\.id|id)\s*\)/g,
    severity: 'HIGH',
    description: 'A rota consulta ou deleta registros diretamente pelo ID da URL sem validar se o objeto pertence ao usuário autenticado (BOLA).',
    remediation: 'Sempre inclua o ID da organização ou tenant na cláusula WHERE (ex: where: { id, userId: req.user.id }).',
  },
  {
    id: 'OWASP-API2-WEAK-JWT',
    name: 'OWASP API2:2023 - Broken Authentication (Segredo JWT Fraco)',
    standard: 'OWASP API Security Top 10',
    regex: /jwt\.sign\s*\([^,]+,\s*['"](?:secret|jwt_secret|123456|admin|teste|chave)['"]/gi,
    severity: 'CRITICAL',
    description: 'Chave de assinatura de token JWT estática ou previsível embutida no código. Invasores podem forjar tokens de qualquer usuário.',
    remediation: 'Utilize segredos criptográficos com alta entropia (256 bits) carregados exclusivamente de variáveis de ambiente.',
  },
  {
    id: 'OWASP-API3-MASS-ASSIGNMENT',
    name: 'OWASP API3:2023 - Broken Object Property (Mass Assignment)',
    standard: 'OWASP API Security Top 10',
    regex: /(?:\.create|\.update|\.insert)\s*\(\s*req\.body\s*\)/g,
    severity: 'HIGH',
    description: 'O objeto req.body é passado integralmente para o modelo sem filtragem de campos permitidos (Mass Assignment).',
    remediation: 'Utilize DTOs ou bibliotecas de validação (Zod, Joi) e faça whitelist estrito dos campos que podem ser gravados.',
  },
  {
    id: 'OWASP-API7-SSRF',
    name: 'OWASP API7:2023 - Server Side Request Forgery (SSRF em API)',
    standard: 'OWASP API Security Top 10',
    regex: /(?:axios|fetch|got|http\.get)\s*\(\s*req\.(?:query|body|params)\.[a-zA-Z0-9_]+\s*\)/g,
    severity: 'CRITICAL',
    description: 'Requisição HTTP externa originada no servidor utilizando URL fornecida diretamente pelo cliente sem validação ou whitelist.',
    remediation: 'Valide a URL com whitelist estrita de domínios e bloqueie requisições para endereços IP privados ou de metadados em nuvem (169.254.169.254).',
  },
  {
    id: 'OWASP-API8-CORS-WILDCARD',
    name: 'OWASP API8:2023 - Security Misconfiguration (CORS Permissivo)',
    standard: 'OWASP API Security Top 10',
    regex: /(?:cors\(\s*\{\s*origin:\s*['"]\*['"]|res\.setHeader\(['"]Access-Control-Allow-Origin['"],\s*['"]\*['"]\))/gi,
    severity: 'MEDIUM',
    description: 'Configuração de CORS com wildcard global permitindo que qualquer site na internet execute requisições contra a API com credenciais.',
    remediation: 'Configure a diretiva de origem com a lista explícita dos domínios oficiais da sua aplicação web.',
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

  // 1. Secrets detection pass
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];

    for (const rule of SECRET_DETECTION_RULES) {
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
          moduleScore -= 25;
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
          moduleScore -= 12;
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

    // 2. OWASP API Top 10 SAST pass
    for (const apiRule of OWASP_API_RULES) {
      apiRule.regex.lastIndex = 0;
      let apiMatch;

      while ((apiMatch = apiRule.regex.exec(line)) !== null) {
        moduleScore -= apiRule.severity === 'CRITICAL' ? 25 : 15;
        findings.push({
          id: `${apiRule.id}-L${lineIdx + 1}`,
          title: `${apiRule.name} (Linha ${lineIdx + 1})`,
          description: `${apiRule.description} Trecho identificado: '${apiMatch[0].substring(0, 60)}...'`,
          severity: apiRule.severity,
          remediation: apiRule.remediation,
          category: 'INFRASTRUCTURE',
          cveOrStandard: apiRule.standard,
        });
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
