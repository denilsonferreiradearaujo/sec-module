import { WebPostureData, SecurityFinding } from '@/core/types/security';

const SUSPICIOUS_DYNAMIC_SERVICES = ['sslip.io', 'nip.io', 'xip.io', 'traefik.me', 'duckdns.org', 'ngrok.io', 'loca.lt'];

export async function scanWebPosture(
  target: string,
  options?: { safeMode?: boolean }
): Promise<{ data: WebPostureData; findings: SecurityFinding[] }> {
  const findings: SecurityFinding[] = [];
  let url = target.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  const host = url.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0].toLowerCase();
  const isWildcardHost = SUSPICIOUS_DYNAMIC_SERVICES.some((svc) => host.endsWith(svc));

  const postData: WebPostureData = {
    status: 'SUCCESS',
    protocol: url.startsWith('https://') ? 'HTTPS' : 'HTTP',
    headers: {
      hsts: { present: false },
      csp: { present: false },
      xFrameOptions: { present: false },
      xContentTypeOptions: { present: false },
      referrerPolicy: { present: false },
      permissionsPolicy: { present: false },
    },
    cookies: [],
    technologies: [],
    moduleScore: 100,
  };

  // If safeMode is requested or host is a suspicious dynamic/wildcard service, ISOLATE and DO NOT connect
  if (options?.safeMode || isWildcardHost) {
    postData.status = 'WARNING';
    postData.moduleScore = 40;
    postData.technologies.push('Conexão direta bloqueada preventivamente (Modo de Quarentena / Proteção Anti-Malware)');
    findings.push({
      id: 'POSTURE-ISOLATED-SAFE-MODE',
      title: 'Conexão HTTP Bloqueada Preventivamente (Modo de Proteção Ativo)',
      description: `Por segurança defensiva, o scanner não realizou requisição direta ao alvo "${url}" pois ele utiliza serviços de DNS dinâmico/curinga (${host}) ou foi sinalizado para quarentena. Isso impede a detonação acidental de scripts ou arquivos maliciosos.`,
      severity: 'HIGH',
      remediation: 'Não acesse o link em navegadores sem sandbox ou ambiente isolado.',
      category: 'WEB_POSTURE',
    });
    return { data: postData, findings };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DeveSec-AuditBot/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    postData.statusCode = response.status;
    const headers = response.headers;

    // 1. Protocol check
    if (url.startsWith('http://')) {
      findings.push({
        id: 'POSTURE-NO-HTTPS',
        title: 'Comunicação Insegura (HTTP puro)',
        description: 'O site permite tráfego não criptografado, expondo dados de usuários a interceptação (MitM).',
        severity: 'HIGH',
        remediation: 'Configure redirecionamento automático permanente 301 de HTTP para HTTPS e instale certificado TLS válido.',
        category: 'WEB_POSTURE',
        cveOrStandard: 'CWE-319',
      });
      postData.moduleScore -= 30;
    }

    // 2. HSTS
    const hsts = headers.get('strict-transport-security');
    if (hsts) {
      postData.headers.hsts = { present: true, raw: hsts };
      if (!hsts.includes('includeSubDomains')) {
        findings.push({
          id: 'POSTURE-HSTS-NOSUBDOMAINS',
          title: 'HSTS incompleto: subdomínios desprotegidos',
          description: 'O cabeçalho Strict-Transport-Security está ativo, mas não inclui a diretiva includeSubDomains.',
          severity: 'LOW',
          remediation: 'Adicione "includeSubDomains; preload" ao valor do cabeçalho Strict-Transport-Security.',
          category: 'WEB_POSTURE',
        });
        postData.moduleScore -= 5;
      }
    } else {
      findings.push({
        id: 'POSTURE-MISSING-HSTS',
        title: 'Cabeçalho HSTS Ausente',
        description: 'Sem o Strict-Transport-Security, o navegador pode tentar conexões HTTP antes de redirecionar para HTTPS.',
        severity: 'MEDIUM',
        remediation: 'Configure no servidor web: "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload".',
        category: 'WEB_POSTURE',
        cveOrStandard: 'CWE-523',
      });
      postData.moduleScore -= 15;
    }

    // 3. CSP
    const csp = headers.get('content-security-policy');
    if (csp) {
      postData.headers.csp = { present: true, raw: csp };
      if (csp.includes("'unsafe-inline'") || csp.includes('*')) {
        findings.push({
          id: 'POSTURE-WEAK-CSP',
          title: 'Política de CSP Fraca ou Permissiva',
          description: "O Content-Security-Policy utiliza 'unsafe-inline' ou curingas (*), reduzindo a proteção contra XSS.",
          severity: 'MEDIUM',
          remediation: 'Remova diretivas inseguras e implemente nonces ou hashes criptográficos para scripts.',
          category: 'WEB_POSTURE',
          cveOrStandard: 'OWASP A03:2021',
        });
        postData.moduleScore -= 10;
      }
    } else {
      findings.push({
        id: 'POSTURE-MISSING-CSP',
        title: 'Cabeçalho CSP Ausente',
        description: 'A ausência do Content-Security-Policy facilita a execução de scripts maliciosos injetados (Cross-Site Scripting).',
        severity: 'HIGH',
        remediation: "Defina uma Content-Security-Policy restritiva começando com default-src 'self'.",
        category: 'WEB_POSTURE',
        cveOrStandard: 'CWE-79 / OWASP A03',
      });
      postData.moduleScore -= 20;
    }

    // 4. X-Frame-Options
    const xfo = headers.get('x-frame-options');
    if (xfo) {
      postData.headers.xFrameOptions = { present: true, raw: xfo };
    } else {
      findings.push({
        id: 'POSTURE-MISSING-XFO',
        title: 'Vulnerável a Clickjacking (Sem X-Frame-Options)',
        description: 'A página pode ser incorporada em iframes em sites de terceiros para enganar usuários.',
        severity: 'MEDIUM',
        remediation: 'Configure "X-Frame-Options: SAMEORIGIN" ou "frame-ancestors \'self\'" no CSP.',
        category: 'WEB_POSTURE',
        cveOrStandard: 'CWE-1021',
      });
      postData.moduleScore -= 10;
    }

    // 5. X-Content-Type-Options
    const xcto = headers.get('x-content-type-options');
    if (xcto && xcto.toLowerCase().includes('nosniff')) {
      postData.headers.xContentTypeOptions = { present: true, raw: xcto };
    } else {
      findings.push({
        id: 'POSTURE-MISSING-NOSNIFF',
        title: 'Sem proteção contra MIME Sniffing',
        description: 'O navegador pode interpretar incorretamente o tipo de arquivo carregado, abrindo brechas para execução de scripts.',
        severity: 'LOW',
        remediation: 'Adicione "X-Content-Type-Options: nosniff" em todas as respostas HTTP.',
        category: 'WEB_POSTURE',
      });
      postData.moduleScore -= 5;
    }

    // 6. Permissions-Policy
    const pp = headers.get('permissions-policy');
    if (pp) {
      postData.headers.permissionsPolicy = { present: true, raw: pp };
    } else {
      postData.headers.permissionsPolicy = { present: false };
    }

    // 7. Technology Leak (Server / X-Powered-By)
    const serverHeader = headers.get('server');
    const poweredBy = headers.get('x-powered-by');
    if (serverHeader) {
      postData.technologies.push(`Server: ${serverHeader}`);
      if (/\d+\.\d+/.test(serverHeader)) {
        findings.push({
          id: 'POSTURE-VERSION-LEAK',
          title: 'Vazamento de Versão exata do Servidor Web',
          description: `O cabeçalho Server expõe "${serverHeader}", facilitando que atacantes encontrem CVEs específicas da versão.`,
          severity: 'LOW',
          remediation: 'Desabilite tokens de versão no servidor web (ex: "server_tokens off;" no Nginx).',
          category: 'WEB_POSTURE',
          cveOrStandard: 'CWE-200',
        });
        postData.moduleScore -= 5;
      }
    }
    if (poweredBy) {
      postData.technologies.push(`Powered-By: ${poweredBy}`);
      findings.push({
        id: 'POSTURE-POWERED-BY-LEAK',
        title: 'Cabeçalho X-Powered-By exposto',
        description: `O cabeçalho revela a tecnologia do backend ("${poweredBy}").`,
        severity: 'LOW',
        remediation: 'Remova o cabeçalho X-Powered-By nas configurações do framework (ex: app.disable("x-powered-by") no Express).',
        category: 'WEB_POSTURE',
      });
      postData.moduleScore -= 5;
    }

    // 8. Cookies
    const setCookie = headers.get('set-cookie');
    if (setCookie) {
      const cookieParts = setCookie.split(';');
      const cookieName = cookieParts[0]?.split('=')[0]?.trim() || 'Session';
      const isSecure = /secure/i.test(setCookie);
      const isHttpOnly = /httponly/i.test(setCookie);
      const sameSiteMatch = setCookie.match(/samesite=([a-zA-Z]+)/i);

      postData.cookies.push({
        name: cookieName,
        secure: isSecure,
        httpOnly: isHttpOnly,
        sameSite: sameSiteMatch ? sameSiteMatch[1] : undefined,
      });

      if (!isHttpOnly) {
        findings.push({
          id: 'COOKIE-MISSING-HTTPONLY',
          title: `Cookie sem HttpOnly (${cookieName})`,
          description: 'Cookies sensíveis sem a flag HttpOnly podem ser lidos diretamente por scripts maliciosos em caso de XSS.',
          severity: 'HIGH',
          remediation: 'Adicione a flag "HttpOnly" na geração de todos os cookies de sessão e autenticação.',
          category: 'WEB_POSTURE',
          cveOrStandard: 'CWE-1004',
        });
        postData.moduleScore -= 15;
      }

      if (!isSecure && url.startsWith('https://')) {
        findings.push({
          id: 'COOKIE-MISSING-SECURE',
          title: `Cookie sem flag Secure (${cookieName})`,
          description: 'O cookie pode ser transmitido em conexões inseguras caso o usuário acesse HTTP.',
          severity: 'MEDIUM',
          remediation: 'Adicione a flag "Secure" a todos os cookies trafegados via HTTPS.',
          category: 'WEB_POSTURE',
          cveOrStandard: 'CWE-614',
        });
        postData.moduleScore -= 10;
      }
    }

    postData.moduleScore = Math.max(0, postData.moduleScore);
  } catch (err: unknown) {
    postData.status = 'FAILED';
    postData.moduleScore = 40;
    findings.push({
      id: 'POSTURE-CONNECTION-FAIL',
      title: 'Falha ao conectar ao endereço informado',
      description: `Não foi possível completar a requisição HTTP para "${url}". O servidor pode estar offline ou bloqueando requisições automatizadas.`,
      severity: 'MEDIUM',
      remediation: 'Verifique se o domínio ou URL está online e se as portas 80/443 estão devidamente acessíveis.',
      category: 'WEB_POSTURE',
    });
  }

  return { data: postData, findings };
}
