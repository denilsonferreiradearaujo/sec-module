import { PhishingTemplate, PhishingCampaignStats, PhishingRecipientTelemetry } from '@/core/types/phishing';

export const PHISHING_TEMPLATES: PhishingTemplate[] = [
  {
    id: 'PHISH-RH-VACATIONS',
    category: 'RH_BENEFICIOS',
    brand: 'Portal RH / Gestão de Pessoas',
    title: 'Aviso Urgente RH: Confirmação da Escala de Férias e Pagamento de 1/3 Constitucional',
    difficulty: 'MEDIO',
    senderMask: 'Recursos Humanos <rh-notificacoes@portal-colaborador.net>',
    subject: '[RH Informa] Confirmação obrigatória do seu período de férias até 18:00',
    bodyPreview: 'Prezado colaborador, o prazo regulamentar para validação da sua escala de férias e programação do adiantamento de 1/3 constitucional se encerra hoje. Acesse o portal interno para validar seus dados bancários e assinar o aviso.',
    fakeUrl: 'https://portal-colaborador.net/ferias/validar-dados-login',
    indicatorsOfCompromise: [
      'Remetente com domínio genérico "portal-colaborador.net" em vez do domínio oficial da empresa.',
      'Prazo exíguo (até 18:00) induzindo o colaborador a agir por impulso.',
      'Solicitação de revalidação de dados bancários e senha de rede.',
    ],
    redFlags: [
      { title: '1. Domínio Não Corporativo', explanation: 'O e-mail vem de @portal-colaborador.net e não do domínio @suaempresa.com.br.' },
      { title: '2. Pressão Psicológica de Prazo', explanation: 'Exige confirmação antes das 18h com ameaça de cancelamento de benefício.' },
      { title: '3. Link de Destino Inseguro', explanation: 'O link não aponta para a intranet oficial ou sistema ADP/Senior homologado.' },
      { title: '4. Coleta de Credenciais', explanation: 'A página de destino exige usuário e senha do e-mail para visualizar um documento interno.' },
    ],
    learningObjective: 'Capacitar os funcionários a desconfiarem de e-mails de RH com prazos surpresa e a validarem avisos pelo canal direto do departamento.',
  },
  {
    id: 'PHISH-M365-AUTH',
    category: 'REDEFINICAO_SENHA',
    brand: 'Microsoft 365 / Outlook',
    title: 'Microsoft 365: Sessão Expirada - Validação de Duplo Fator (MFA) Obrigatória',
    difficulty: 'DIFICIL',
    senderMask: 'Segurança Microsoft 365 <account-security@m365-auth-portal.com>',
    subject: 'Ação Requerida: Sua conta corporativa será desconectada em 2 horas',
    bodyPreview: 'Detectamos inconsistências nos tokens de autenticação da sua conta de trabalho Microsoft 365. Para manter seu acesso ao Outlook, Teams e OneDrive sem interrupções, confirme seu logon e revalide suas credenciais.',
    fakeUrl: 'https://m365-auth-portal.com/login/oauth/authorize?tenant=corporate',
    indicatorsOfCompromise: [
      'Domínio remetente "m365-auth-portal.com" (clonagem de serviço da Microsoft).',
      'Logo oficial da Microsoft embutido para criar credibilidade ilusória.',
      'Captura silenciosa de credencial e token de sessão.',
    ],
    redFlags: [
      { title: '1. Falsificação da Microsoft', explanation: 'Notificações da Microsoft legítimas usam @microsoft.com ou o portal de TI interno.' },
      { title: '2. Urgência de 2 horas', explanation: 'Avisos de expiração repentina são a principal técnica para impedir análise crítica.' },
      { title: '3. URL de Phishing Estrangeira', explanation: 'O endereço m365-auth-portal.com é registrado em servidor offshore não relacionado à Microsoft.' },
      { title: '4. Pedido de Código MFA', explanation: 'Golpistas tentam roubar tanto a senha quanto o código SMS/Authenticator em tempo real.' },
    ],
    learningObjective: 'Reconhecer que a Microsoft nunca envia links externos de revalidação súbita com ameaça de suspensão imediata.',
  },
  {
    id: 'PHISH-FIN-BOLETO',
    category: 'BOLETO_COBRANCA',
    brand: 'Cartório & Financeiro',
    title: 'Aviso de Título em Cartório / Boleto em Atraso Protestado',
    difficulty: 'FACIL',
    senderMask: 'Cartório Central de Títulos <intimacao@notificacoes-juridicas.com.br>',
    subject: 'URGENTE: Notificação Extrajudicial de Protesto - Título Vencido nº 489201',
    bodyPreview: 'Informamos que consta em aberto em nosso sistema o título vencido há 12 dias. Foi lavrado termo de protesto com prazo de regularização de 48 horas. Faça o download da 2ª via atualizada com desconto para evitar restrição no CNPJ/CPF.',
    fakeUrl: 'https://notificacoes-juridicas.com.br/download/segunda-via-pdf.zip',
    indicatorsOfCompromise: [
      'Ameaça direta de restrição cadastral e processo judicial para paralisar o discernimento.',
      'Link para arquivo comprimido (.zip) contendo payload ou atalho executável malicioso.',
      'Dados de cobrança genéricos sem detalhamento de contrato original.',
    ],
    redFlags: [
      { title: '1. Intimação por E-mail Genérico', explanation: 'Cartórios não notificam protestos por e-mails com links de download de arquivos compactados.' },
      { title: '2. Anexo .ZIP ou Executável', explanation: 'O arquivo baixado finge ser PDF mas contém executáveis capazes de infectar a rede.' },
      { title: '3. Ameaça de Bloqueio de CNPJ', explanation: 'O medo de penalidades legais faz funcionários do setor financeiro realizarem ações sem checagem prévia.' },
      { title: '4. Falta de Dados Reais do Contrato', explanation: 'O e-mail não cita número de contrato real nem o credor de origem.' },
    ],
    learningObjective: 'Blindar o setor financeiro e administrativo contra o golpe do boleto falso e vírus trojans bancários em arquivos compactados.',
  },
  {
    id: 'PHISH-GOV-RECADASTRO',
    category: 'GOV_REGULARIZACAO',
    brand: 'Portal Gov.br / e-Social',
    title: 'Recadastramento Obrigatório Gov.br e-Social para Declaração Anual de Rendimentos',
    difficulty: 'DIFICIL',
    senderMask: 'Secretaria da Receita Federal <notificacoes@gov-br-servicos.info>',
    subject: '[e-Social] Regularização cadastral de colaborador pendente de envio',
    bodyPreview: 'Consta divergência cadastral entre seus dados previdenciários e o cadastro geral do e-Social da empresa. Para evitar suspensão de recolhimentos e benefícios trabalhistas, acerte seus dados via Certificado Digital ou senha Gov.br.',
    fakeUrl: 'https://gov-br-servicos.info/autenticacao/login-cpf',
    indicatorsOfCompromise: [
      'Domínio terminado em .info e não em .gov.br oficial do Governo Federal.',
      'Utilização de brasões oficiais da República e tipografia idêntica ao design system do Gov.br.',
      'Captura de CPF e senha de alta sensibilidade do cidadão.',
    ],
    redFlags: [
      { title: '1. TLD Falso (.info vs .gov.br)', explanation: 'Todo serviço oficial do Governo Brasileiro utiliza obrigatoriamente a terminação .gov.br.' },
      { title: '2. Solicitação da Senha do Gov.br', explanation: 'O Gov.br unifica acessos a bancos, INSS e Receita; capturar essa senha dá controle total ao criminoso.' },
      { title: '3. Ameaça Previdenciária', explanation: 'Mensagens alegando suspensão de benefícios criam urgência irracional.' },
      { title: '4. Inconsistência nos Dados', explanation: 'O sistema não menciona o nome completo nem a matrícula real do colaborador.' },
    ],
    learningObjective: 'Fixar a regra de ouro: nenhum órgão público legítimo utiliza domínios .info, .com ou .net.',
  },
  {
    id: 'PHISH-PIX-INVOICE',
    category: 'FINANCEIRO_PIX',
    brand: 'Banco Central / PIX',
    title: 'Comprovante de Pagamento PIX Recebido - R$ 4.850,00',
    difficulty: 'FACIL',
    senderMask: 'Financeiro Banco <notificacoes@comprovantes-pix-online.com>',
    subject: 'Confirmação de Transferência PIX Recebida - R$ 4.850,00',
    bodyPreview: 'Uma nova transferência PIX foi realizada para sua conta. Clique no anexo ou no link abaixo para visualizar o extrato e confirmar o recebedor.',
    fakeUrl: 'https://comprovantes-pix-online.com/extrato/visualizar-comprovante',
    indicatorsOfCompromise: [
      'Valores inesperados para atrair a curiosidade.',
      'Incentivo ao download de anexo executável (.zip ou .exe mascarado de PDF).',
    ],
    redFlags: [
      { title: '1. Transferência Inesperada', explanation: 'Valores não esperados são a isca clássica de curiosidade para induzir cliques.' },
      { title: '2. Domínio Genérico de Banco', explanation: 'Bancos nunca usam "comprovantes-pix-online.com", usam seus próprios domínios institucionais.' },
      { title: '3. Solicitação de Confirmação', explanation: 'O PIX cai automaticamente na conta; não exige cliques nem download de extratos para ser liberado.' },
      { title: '4. Risco de Trojan Bancário', explanation: 'O anexo instala um ladrão de credenciais (Banker) silencioso na máquina corporativa.' },
    ],
    learningObjective: 'Evitar abertura de arquivos ou links não solicitados de supostas transferências bancárias.',
  },
  {
    id: 'PHISH-SECURITY-ALERT',
    category: 'TI_ALERTA_SEGURANCA',
    brand: 'SOC / TI Corporativa',
    title: 'Tentativa de Acesso Suspeito de Novo Dispositivo em Moscou, Rússia',
    difficulty: 'DIFICIL',
    senderMask: 'Segurança da Informação <security-alert@suaempresa.notificacao-cloud.com>',
    subject: '[Alerta de Segurança] Tentativa de login bloqueada em Moscou, Rússia',
    bodyPreview: 'Detectamos uma tentativa de login incomum em sua conta corporativa a partir de um endereço IP na Rússia. Se não foi você, clique imediatamente para revogar o acesso.',
    fakeUrl: 'https://suaempresa.notificacao-cloud.com/revogar-sessao',
    indicatorsOfCompromise: [
      'Uso de medo e pânico psicológico com país de risco geopolítico.',
      'Subdomínio enganoso em serviço terceiro (notificacao-cloud.com).',
    ],
    redFlags: [
      { title: '1. Pânico de Invasão Estrangeira', explanation: 'O uso de cidades internacionais gera choque emocional e impede a verificação da URL.' },
      { title: '2. Subdomínio de Terceiro', explanation: 'notificacao-cloud.com é um domínio alugado por cibercriminosos para imitar serviços de nuvem.' },
      { title: '3. Falso Botão de Bloqueio', explanation: 'Clicar no link de revogação na verdade entrega a senha atual para os invasores.' },
      { title: '4. Canal de Comunicação Incorreto', explanation: 'O SOC da empresa comunica alertas críticos por chamados internos ou contato telefônico direto.' },
    ],
    learningObjective: 'Orientar o colaborador a comunicar o time de TI oficial pelos canais homologados antes de clicar em links de alarme.',
  },
];

export function calculateCampaignAwareness(stats: {
  totalTargeted: number;
  clickedCount: number;
  submittedCount: number;
  reportedCount: number;
}): PhishingCampaignStats {
  const { totalTargeted, clickedCount, submittedCount, reportedCount } = stats;

  const vulnerabilityIndex = totalTargeted > 0 ? Math.round((submittedCount / totalTargeted) * 100) : 0;
  const humanVulnerabilityRate = vulnerabilityIndex;

  let grade: PhishingCampaignStats['awarenessGrade'] = 'F';
  if (vulnerabilityIndex === 0) grade = 'A+';
  else if (vulnerabilityIndex <= 5) grade = 'A';
  else if (vulnerabilityIndex <= 15) grade = 'B';
  else if (vulnerabilityIndex <= 30) grade = 'C';
  else if (vulnerabilityIndex <= 50) grade = 'D';
  else grade = 'F';

  return {
    campaignName: 'Simulação Trimestral de Conscientização Dev & Sec',
    totalEmployeesTargeted: totalTargeted,
    emailsDelivered: totalTargeted,
    emailsOpened: Math.min(totalTargeted, Math.round(totalTargeted * 0.85)),
    linksClicked: clickedCount,
    credentialsSubmitted: submittedCount,
    reportedToSecurity: reportedCount,
    vulnerabilityIndexPercent: vulnerabilityIndex,
    humanVulnerabilityRate,
    awarenessGrade: grade,
  };
}

export function recalculateRealCampaignStats(
  recipients: PhishingRecipientTelemetry[],
  campaignName = 'Campanha de Conscientização Dev & Sec'
): PhishingCampaignStats {
  const totalTargeted = recipients.length;
  const emailsDelivered = recipients.filter((r) => r.delivered).length;
  const emailsOpened = recipients.filter((r) => Boolean(r.openedAt || r.clickedAt || r.reportedAt)).length;
  const linksClicked = recipients.filter((r) => Boolean(r.clickedAt)).length;
  const reportedToSecurity = recipients.filter((r) => Boolean(r.reportedAt)).length;

  // Em testes éticos Just-in-Time não há captura de senhas reais; o risco humano é medido pela taxa de cliques no link.
  const base = Math.max(1, emailsDelivered || totalTargeted);
  const hvr = Math.round((linksClicked / base) * 100);

  let grade: PhishingCampaignStats['awarenessGrade'] = 'A+';
  if (hvr === 0) grade = 'A+';
  else if (hvr <= 5) grade = 'A';
  else if (hvr <= 15) grade = 'B';
  else if (hvr <= 30) grade = 'C';
  else if (hvr <= 50) grade = 'D';
  else grade = 'F';

  return {
    campaignName,
    totalEmployeesTargeted: totalTargeted,
    emailsDelivered,
    emailsOpened,
    linksClicked,
    credentialsSubmitted: 0,
    reportedToSecurity,
    vulnerabilityIndexPercent: hvr,
    humanVulnerabilityRate: hvr,
    awarenessGrade: grade,
  };
}

