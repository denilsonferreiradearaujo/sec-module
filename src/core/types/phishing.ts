export interface PhishingTemplate {
  id: string;
  category: 'REDEFINICAO_SENHA' | 'FINANCEIRO_PIX' | 'RH_BENEFICIOS' | 'TI_ALERTA_SEGURANCA' | 'URGENCIA_DIRETORIA';
  title: string;
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  senderMask: string;
  subject: string;
  bodyPreview: string;
  indicatorsOfCompromise: string[];
  learningObjective: string;
}

export interface PhishingCampaignStats {
  campaignName: string;
  totalEmployeesTargeted: number;
  emailsDelivered: number;
  emailsOpened: number;
  linksClicked: number;
  credentialsSubmitted: number;
  reportedToSecurity: number;
  vulnerabilityIndexPercent: number; // % that submitted
  awarenessGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}
