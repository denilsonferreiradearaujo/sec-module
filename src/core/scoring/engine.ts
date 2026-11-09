import {
  SecurityFinding,
  SeverityLevel,
  UnifiedAuditReport,
  TargetType,
  WebPostureData,
  InfraReconData,
  ThreatIntelData,
  OsintData,
  MobileAuditData,
  CveData,
  SecretAuditData,
  ChecklistItem,
  ComplianceScorecard,
} from '../types/security';

function generateComplianceScorecard(params: {
  target: string;
  targetType: TargetType;
  webPosture?: WebPostureData;
  infraRecon?: InfraReconData;
  threatIntel?: ThreatIntelData;
  cveData?: CveData;
  secretsAudit?: SecretAuditData;
  mobileAudit?: MobileAuditData;
}): ComplianceScorecard {
  const { webPosture, infraRecon, threatIntel, cveData, secretsAudit, mobileAudit } = params;
  const items: ChecklistItem[] = [];

  // 1. Criptografia & Trânsito TLS/SSL
  if (webPosture) {
    const tlsValid = Boolean(webPosture.tls && webPosture.tls.valid);
    items.push({
      id: 'CHK-TLS-CERT',
      category: 'Criptografia & TLS',
      title: 'Criptografia em Trânsito (HTTPS / TLS Válido)',
      standard: 'NIST SP 800-52 / RFC 8446',
      status: tlsValid ? 'PASSED' : 'FAILED',
      details: tlsValid
        ? `Certificado SSL ativo e confiável emitido por ${webPosture.tls?.issuer || 'Autoridade Certificadora'}. Válido por ${webPosture.tls?.daysRemaining ?? 'N/A'} dias.`
        : 'Certificado SSL/TLS inválido, autoassinado, expirado ou protocolo HTTP inseguro em uso.',
      impact: 'Proteção contra interceptação de tráfego, roubo de senhas e ataques Man-in-the-Middle (MitM).',
      recommendation: tlsValid ? undefined : 'Instale ou renove um certificado SSL/TLS válido e force o redirecionamento global para HTTPS.',
    });

    // 2. Cabeçalhos HTTP Defensivos
    const hstsPresent = Boolean(webPosture.headers?.hsts?.present);
    items.push({
      id: 'CHK-HDR-HSTS',
      category: 'Proteção Web & Headers',
      title: 'Forçamento Estrito de HTTPS (HSTS)',
      standard: 'RFC 6797 / OWASP A05',
      status: hstsPresent ? 'PASSED' : 'FAILED',
      details: hstsPresent
        ? `Cabeçalho Strict-Transport-Security configurado: ${webPosture.headers.hsts.raw || 'Ativo'}.`
        : 'Cabeçalho Strict-Transport-Security ausente. O navegador permite conexões HTTP não criptografadas.',
      impact: 'Previne ataques de SSL Stripping e downgrade de protocolo de segurança.',
      recommendation: hstsPresent ? undefined : 'Adicione o cabeçalho "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload".',
    });

    const xfoPresent = Boolean(webPosture.headers?.xFrameOptions?.present);
    items.push({
      id: 'CHK-HDR-XFO',
      category: 'Proteção Web & Headers',
      title: 'Proteção Anti-Clickjacking (X-Frame-Options)',
      standard: 'CWE-1021 / OWASP A04',
      status: xfoPresent ? 'PASSED' : 'FAILED',
      details: xfoPresent
        ? `Cabeçalho X-Frame-Options ativo (${webPosture.headers.xFrameOptions.raw || 'SAMEORIGIN/DENY'}).`
        : 'Cabeçalho X-Frame-Options ausente. O site pode ser incorporado em iframes maliciosos de terceiros.',
      impact: 'Previne ataques de Clickjacking onde o usuário é induzido a clicar em botões invisíveis.',
      recommendation: xfoPresent ? undefined : 'Configure o cabeçalho "X-Frame-Options: SAMEORIGIN" ou utilize a diretiva "frame-ancestors" no CSP.',
    });

    const xctoPresent = Boolean(webPosture.headers?.xContentTypeOptions?.present);
    items.push({
      id: 'CHK-HDR-XCTO',
      category: 'Proteção Web & Headers',
      title: 'Prevenção de MIME-Sniffing (X-Content-Type-Options)',
      standard: 'CWE-79 / MIME Sniffing Standard',
      status: xctoPresent ? 'PASSED' : 'FAILED',
      details: xctoPresent
        ? 'Cabeçalho X-Content-Type-Options: nosniff ativo.'
        : 'Cabeçalho X-Content-Type-Options ausente. O navegador pode tentar inferir o tipo de arquivo de forma insegura.',
      impact: 'Evita a execução inadvertida de arquivos maliciosos mascarados como imagens ou textos.',
      recommendation: xctoPresent ? undefined : 'Adicione o cabeçalho "X-Content-Type-Options: nosniff" em todas as respostas HTTP.',
    });

    const cspPresent = Boolean(webPosture.headers?.csp?.present);
    items.push({
      id: 'CHK-HDR-CSP',
      category: 'Proteção Web & Headers',
      title: 'Política de Segurança de Conteúdo (CSP)',
      standard: 'W3C CSP Level 3 / OWASP A03',
      status: cspPresent ? 'PASSED' : 'FAILED',
      details: cspPresent
        ? `Content-Security-Policy configurado (${webPosture.headers.csp.raw?.substring(0, 40) || 'Ativo'}...).`
        : 'Cabeçalho Content-Security-Policy ausente. Não há restrição de origens confiáveis para execução de scripts.',
      impact: 'Mitigação de ataques de Cross-Site Scripting (XSS) e injeção de scripts maliciosos.',
      recommendation: cspPresent ? undefined : 'Defina uma política CSP restrita especificando fontes confiáveis de scripts e mídias.',
    });

    const referrerPresent = Boolean(webPosture.headers?.referrerPolicy?.present);
    items.push({
      id: 'CHK-HDR-REFERRER',
      category: 'Proteção Web & Headers',
      title: 'Privacidade de Navegação (Referrer-Policy)',
      standard: 'W3C Referrer Policy',
      status: referrerPresent ? 'PASSED' : 'WARNING',
      details: referrerPresent
        ? `Referrer-Policy configurado: ${webPosture.headers.referrerPolicy.raw || 'Ativo'}.`
        : 'Referrer-Policy ausente. URLs internas com dados sensíveis podem vazar para domínios externos.',
      impact: 'Proteção de privacidade de dados e prevenção de vazamento de tokens em URLs.',
      recommendation: referrerPresent ? undefined : 'Configure "Referrer-Policy: strict-origin-when-cross-origin".',
    });

    // 3. Cookies de Sessão
    const insecureCookies = webPosture.cookies.filter(c => !c.secure || !c.httpOnly);
    items.push({
      id: 'CHK-COOKIE-SEC',
      category: 'Segurança de Sessão & Cookies',
      title: 'Proteção e Flags de Cookies (HttpOnly / Secure)',
      standard: 'OWASP Session Management / RFC 6265',
      status: insecureCookies.length === 0 ? 'PASSED' : 'FAILED',
      details: insecureCookies.length === 0
        ? (webPosture.cookies.length > 0 ? `${webPosture.cookies.length} cookies auditados com flags de proteção ativas.` : 'Nenhum cookie inseguro identificado no tráfego.')
        : `${insecureCookies.length} cookies detectados sem flags de segurança adequadas (Secure / HttpOnly).`,
      impact: 'Cookies sem HttpOnly podem ser roubados via XSS; cookies sem Secure via conexões não cifradas.',
      recommendation: insecureCookies.length === 0 ? undefined : 'Adicione os atributos "Secure", "HttpOnly" e "SameSite=Lax/Strict" a todos os cookies de sessão.',
    });
  }

  // 4. Infraestrutura & Portas
  if (infraRecon) {
    const dangerousPorts = [3306, 5432, 27017, 1433, 6379, 3389, 23, 445];
    const exposedDangerous = infraRecon.openPorts.filter(p => p.state === 'OPEN' && dangerousPorts.includes(p.port));
    items.push({
      id: 'CHK-INFRA-PORTS',
      category: 'Infraestrutura & Rede Externa',
      title: 'Isolamento de Portas de Bancos de Dados e Acesso Remoto',
      standard: 'CIS Controls 9.2 / NIST SP 800-41',
      status: exposedDangerous.length === 0 ? 'PASSED' : 'FAILED',
      details: exposedDangerous.length === 0
        ? 'Nenhuma porta administrativa de banco de dados (MySQL, Postgres, Mongo) ou RDP/Telnet exposta publicamente.'
        : `Atenção Crítica: Portas sensíveis abertas identificadas (${exposedDangerous.map(p => `${p.port}/${p.service}`).join(', ')}).`,
      impact: 'Portas de bancos de dados ou serviços remotos abertos são alvos primários de ataques de força bruta e invasão.',
      recommendation: exposedDangerous.length === 0 ? undefined : 'Bloqueie o acesso público via Firewall/Security Groups e restrinja conexões somente via VPN.',
    });

    // DNS SPF
    const spfPresent = Boolean(infraRecon.dns?.spf?.present);
    items.push({
      id: 'CHK-DNS-SPF',
      category: 'Segurança de E-mail & Marca',
      title: 'Proteção Antispoofing de E-mail (SPF)',
      standard: 'RFC 7208 / NIST SP 800-177',
      status: spfPresent ? 'PASSED' : 'FAILED',
      details: spfPresent
        ? `Registro SPF identificado no DNS (${infraRecon.dns.spf?.record || 'Válido'}).`
        : 'Registro SPF não encontrado no DNS do domínio. Servidores externos podem enviar e-mails forjados em seu nome.',
      impact: 'Mitigação de falsificação de identidade (email spoofing) e ataques de phishing contra seus clientes.',
      recommendation: spfPresent ? undefined : 'Crie uma entrada TXT de SPF no DNS autorizando apenas seus servidores de envio legítimos.',
    });

    // DNS DMARC (RFC 7489 Policy Discovery)
    const dmarcPresent = Boolean(infraRecon.dns?.dmarc?.present);
    const dmarcInherited = Boolean(infraRecon.dns?.dmarc?.inherited);
    const dmarcEffective = infraRecon.dns?.dmarc?.effectivePolicy || 'none';
    const dmarcStatus = !dmarcPresent ? 'FAILED' : (dmarcEffective === 'none' ? 'WARNING' : 'PASSED');

    items.push({
      id: 'CHK-DNS-DMARC',
      category: 'Segurança de E-mail & Marca',
      title: 'Política de Autenticação e Reputação de E-mail (DMARC)',
      standard: 'RFC 7489 (Policy Discovery) / CISA BOD 18-01',
      status: dmarcStatus,
      details: dmarcPresent
        ? (dmarcInherited
          ? `Política DMARC herdada com sucesso do domínio organizacional (${infraRecon.dns?.dmarc?.inheritedFrom}) conforme RFC 7489: política efetiva "${dmarcEffective}".`
          : `Política DMARC configurada no DNS: política efetiva "${dmarcEffective}" (${infraRecon.dns?.dmarc?.record}).`)
        : 'Política DMARC ausente no alvo e no domínio organizacional. Provedores como Google e Microsoft podem descartar ou marcar seus e-mails como spam.',
      impact: 'Garante a autenticidade das comunicações por e-mail e previne ataques de CEO Fraud e Spear Phishing.',
      recommendation: dmarcStatus === 'PASSED' ? undefined : (dmarcPresent ? 'Evolua a política DMARC de "p=none" para "p=quarantine" ou "p=reject".' : 'Adicione uma entrada TXT de DMARC no domínio organizacional com política inicial "v=DMARC1; p=quarantine;".'),
    });
  }

  // 5. Threat Intelligence & Reputação
  if (threatIntel) {
    const isClean = !threatIntel.isMalicious && (threatIntel.blacklists?.every(b => !b.listed) ?? true);
    items.push({
      id: 'CHK-THREAT-REPUTATION',
      category: 'Inteligência de Ameaças',
      title: 'Reputação Limpa em Feeds de Malware & Blacklists',
      standard: 'ISO 27001 A.12.6.1 / Threat Feeds',
      status: isClean ? 'PASSED' : 'FAILED',
      details: isClean
        ? 'Alvo limpo e sem histórico de hospedagem de malware, phishing ou atividade maliciosa nas bases globais de inteligência.'
        : 'Alvo identificado em listas de bloqueio ou associado a atividades maliciosas recentes.',
      impact: 'Evita bloqueio por antivírus corporativos, queda de reputação de marca e perda de tráfego orgânico.',
      recommendation: isClean ? undefined : 'Investigue infecções internas imediatas e solicite remoção (delist) nas bases de segurança.',
    });

    const isEphemeralDns = Boolean(threatIntel.phishingHeuristics?.isWildcardOrDynamicDns);
    items.push({
      id: 'CHK-THREAT-DNS-TRUST',
      category: 'Inteligência de Ameaças',
      title: 'Confiabilidade de Domínio & Ausência de Wildcard DNS',
      standard: 'NIST SP 800-81-2',
      status: isEphemeralDns ? 'FAILED' : 'PASSED',
      details: isEphemeralDns
        ? 'Alvo utiliza resolvedor DNS dinâmico/efêmero comumente associado a campanhas de malware ou phishing.'
        : 'Resolução de domínio institucional confiável e estável.',
      impact: 'Garante que a infraestrutura não dependa de serviços temporários ou de alta rotatividade.',
      recommendation: isEphemeralDns ? 'Migre para um domínio corporativo próprio com controle de DNS gerenciado.' : undefined,
    });
  }

  // 6. CVEs e Versões de Software (NIST)
  if (cveData) {
    const criticalOrHighCves = cveData.cves.filter(c => c.cvssSeverity === 'CRITICAL' || c.cvssSeverity === 'HIGH');
    items.push({
      id: 'CHK-CVE-KNOWN',
      category: 'Vulnerabilidades Conhecidas',
      title: 'Conformidade com Base Nacional de Vulnerabilidades (NIST CVE)',
      standard: 'NIST NVD / CVSS v3.1',
      status: criticalOrHighCves.length === 0 ? 'PASSED' : 'FAILED',
      details: criticalOrHighCves.length === 0
        ? 'Nenhuma vulnerabilidade crítica ou de alto impacto mapeada publicamente para as assinaturas de versão auditadas.'
        : `${criticalOrHighCves.length} vulnerabilidades críticas/altas confirmadas requerendo atualização imediata.`,
      impact: 'Prevenção de exploração remota automatizada por bots e scripts maliciosos.',
      recommendation: criticalOrHighCves.length === 0 ? undefined : 'Aplique os patches oficiais indicados no laudo técnico para cada CVE mapeada.',
    });
  }

  // 7. DevSecOps & Segredos
  if (secretsAudit) {
    const leaksCount = secretsAudit.totalLeaks;
    items.push({
      id: 'CHK-SECRETS-LEAK',
      category: 'DevSecOps & Credenciais',
      title: 'Auditoria de Segredos e Chaves de API (Zero Secret Leak)',
      standard: 'OWASP Top 10 / GitGuardian Standard',
      status: leaksCount === 0 ? 'PASSED' : 'FAILED',
      details: leaksCount === 0
        ? 'Nenhum token de API, chave AWS, string de banco de dados ou certificado privado vazado no conteúdo auditado.'
        : `${leaksCount} credenciais confidenciais expostas detectadas em texto puro.`,
      impact: 'Proteção contra sequestro de contas em nuvem, roubo de dados de clientes e cobranças indevidas em APIs.',
      recommendation: leaksCount === 0 ? undefined : 'Revogue imediatamente os tokens expostos e migre as credenciais para cofres de senhas (Vault).',
    });
  }

  // 8. Mobile Audit (quando alvo for APK)
  if (mobileAudit) {
    const hasDangerousFlags = mobileAudit.dangerousFlags.some(f => f.status === 'VULNERABLE');
    items.push({
      id: 'CHK-MOBILE-FLAGS',
      category: 'Segurança Mobile (OWASP)',
      title: 'Configurações de Compilação & Sandbox Android',
      standard: 'OWASP Mobile Top 10 (M1/M3)',
      status: hasDangerousFlags ? 'FAILED' : 'PASSED',
      details: hasDangerousFlags
        ? 'Aplicativo compilado com flags inseguras (ex: debug ativo, backup permitido ou tráfego em texto claro).'
        : 'Flags de compilação em conformidade (Modo debug desativado e tráfego seguro obrigatório).',
      impact: 'Impede inspeção de memória por invasores e manipulação de dados locais.',
      recommendation: hasDangerousFlags ? 'Desative android:debuggable e android:usesCleartextTraffic no AndroidManifest.xml.' : undefined,
    });
  }

  const totalChecks = items.length;
  const passedChecks = items.filter(i => i.status === 'PASSED').length;
  const failedChecks = items.filter(i => i.status === 'FAILED').length;
  const warningChecks = items.filter(i => i.status === 'WARNING').length;
  const complianceRate = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 100;

  return {
    totalChecks,
    passedChecks,
    failedChecks,
    warningChecks,
    complianceRate,
    items,
  };
}

export function calculateUnifiedScore(params: {
  target: string;
  targetType: TargetType;
  findings: SecurityFinding[];
  webPosture?: WebPostureData;
  infraRecon?: InfraReconData;
  threatIntel?: ThreatIntelData;
  osint?: OsintData;
  mobileAudit?: MobileAuditData;
  cveData?: CveData;
  secretsAudit?: SecretAuditData;
}): UnifiedAuditReport {
  const { target, targetType, findings, webPosture, infraRecon, threatIntel, osint, mobileAudit, cveData, secretsAudit } = params;

  // Counts by severity
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  let infoCount = 0;

  for (const f of findings) {
    switch (f.severity) {
      case 'CRITICAL':
        criticalCount++;
        break;
      case 'HIGH':
        highCount++;
        break;
      case 'MEDIUM':
        mediumCount++;
        break;
      case 'LOW':
        lowCount++;
        break;
      case 'INFO':
        infoCount++;
        break;
    }
  }

  // Base score 100 with deduction weights
  let baseScore = 100;
  baseScore -= criticalCount * 25;
  baseScore -= highCount * 12;
  baseScore -= mediumCount * 5;
  baseScore -= lowCount * 2;

  // Floor at 0, cap at 100
  const overallScore = Math.max(0, Math.min(100, Math.round(baseScore)));

  // Calculate letter grade
  let grade: UnifiedAuditReport['grade'] = 'F';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 85) grade = 'A';
  else if (overallScore >= 70) grade = 'B';
  else if (overallScore >= 55) grade = 'C';
  else if (overallScore >= 40) grade = 'D';
  else grade = 'F';

  // Overall risk level
  let riskLevel: SeverityLevel = 'LOW';
  if (criticalCount > 0) riskLevel = 'CRITICAL';
  else if (highCount > 0) riskLevel = 'HIGH';
  else if (mediumCount > 0) riskLevel = 'MEDIUM';
  else if (lowCount > 0) riskLevel = 'LOW';
  else riskLevel = 'INFO';

  // Headline
  let headline = 'Excelente postura defensiva identificada. Pequenas melhorias recomendadas.';
  if (riskLevel === 'CRITICAL') {
    headline = 'Vulnerabilidades críticas detectadas! Risco iminente de comprometimento ou invasão.';
  } else if (riskLevel === 'HIGH') {
    headline = 'Postura comprometida. Superfície de ataque exposta com lacunas de segurança.';
  } else if (riskLevel === 'MEDIUM') {
    headline = 'Nível de risco moderado. Faltam cabeçalhos de defesa essenciais ou há exposição de dados.';
  }

  // Commercial recommendation tailored for Dev & Sec
  let recommendedService = 'Consultoria Contínua de Segurança';
  let leadMagnetTitle = 'Diagnóstico Expresso de Cibersegurança';
  let ctaMessage = 'Agende uma reunião estratégica com o time da Dev & Sec para validar a segurança da sua empresa.';

  if (targetType === 'apk') {
    recommendedService = 'DevSecOps & Pentest em Aplicações Mobile';
    ctaMessage = 'Seu aplicativo possui permissões ou configurações inseguras. Proteja seus usuários com uma revisão de código especializada.';
  } else if (criticalCount > 0 || highCount > 0) {
    recommendedService = 'Pentest Web & Red Team Assessment';
    ctaMessage = 'Foram identificadas falhas de alto impacto. Recomendamos um teste de intrusão formal com a equipe técnica da Dev & Sec.';
  } else if (infraRecon && infraRecon.openPorts.some(p => p.state === 'OPEN')) {
    recommendedService = 'Gestão de Superfície de Ataque Externa (EASM)';
    ctaMessage = 'Mantenha seus IPs e portas monitorados 24/7 para evitar exposições acidentais em nuvem.';
  }

  // Generate automated compliance scorecard (Checklist of what is OK and what is NOT OK)
  const complianceScorecard = generateComplianceScorecard({
    target,
    targetType,
    webPosture,
    infraRecon,
    threatIntel,
    cveData,
    secretsAudit,
    mobileAudit,
  });

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    target,
    targetType,
    overallScore,
    grade,
    riskLevel,
    summary: {
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      headline,
    },
    findings,
    complianceScorecard,
    webPosture,
    infraRecon,
    threatIntel,
    osint,
    mobileAudit,
    cveData,
    secretsAudit,
    commercialPitch: {
      leadMagnetTitle,
      recommendedService,
      ctaMessage,
    },
  };
}
