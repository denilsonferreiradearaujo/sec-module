import { PhishingTemplate, PhishingCampaignStats } from '@/core/types/phishing';

export const PHISHING_TEMPLATES: PhishingTemplate[] = [
  {
    id: 'PHISH-PWD-RESET',
    category: 'REDEFINICAO_SENHA',
    title: 'Alerta de Expiração de Senha Corporativa (Microsoft 365 / Google Workspace)',
    difficulty: 'MEDIO',
    senderMask: 'Suporte de TI <suporte-helpdesk@corporativo-atualizacao.net>',
    subject: 'Ação Urgente: Sua senha corporativa expira em 24 horas',
    bodyPreview: 'Prezado colaborador, sua senha de acesso aos sistemas internos irá expirar hoje. Para evitar o bloqueio da conta, clique no link abaixo para manter sua senha atual.',
    indicatorsOfCompromise: [
      'Domínio do remetente não condiz com o domínio oficial da empresa.',
      'Gera senso de urgência extremo (expira em 24h).',
      'Link aponta para página de captura externa clonando a identidade visual.',
    ],
    learningObjective: 'Capacitar o colaborador a verificar o domínio real do remetente e nunca inserir credenciais em links recebidos por e-mail.',
  },
  {
    id: 'PHISH-PIX-INVOICE',
    category: 'FINANCEIRO_PIX',
    title: 'Comprovante de Pagamento PIX / Nota Fiscal Eletrônica Inesperada',
    difficulty: 'FACIL',
    senderMask: 'Financeiro Banco <notificacoes@comprovantes-pix-online.com>',
    subject: 'Confirmação de Transferência PIX Recebida - R$ 4.850,00',
    bodyPreview: 'Uma nova transferência foi realizada para sua conta. Clique no anexo ou no link para visualizar o extrato e confirmar o recebedor.',
    indicatorsOfCompromise: [
      'Valores inesperados para atrair a curiosidade.',
      'Incentivo ao download de anexo executável (.zip ou .exe mascarado de PDF).',
    ],
    learningObjective: 'Evitar abertura de arquivos ou links não solicitados de instituições financeiras.',
  },
  {
    id: 'PHISH-SECURITY-ALERT',
    category: 'TI_ALERTA_SEGURANCA',
    title: 'Tentativa de Acesso Suspeito de Novo Dispositivo',
    difficulty: 'DIFICIL',
    senderMask: 'Equipe de Segurança da Informação <security-alert@suaempresa.notificacao-cloud.com>',
    subject: '[Alerta de Segurança] Tentativa de login bloqueada em Moscou, Rússia',
    bodyPreview: 'Detectamos uma tentativa de login incomum em sua conta a partir de um endereço IP na Rússia. Se não foi você, clique imediatamente para revogar o acesso.',
    indicatorsOfCompromise: [
      'Uso de medo e pânico psicológico.',
      'Subdomínio enganoso em serviço terceiro (notificacao-cloud.com).',
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
    awarenessGrade: grade,
  };
}
