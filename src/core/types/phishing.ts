export interface PhishingTemplate {
  id: string;
  category: 'REDEFINICAO_SENHA' | 'FINANCEIRO_PIX' | 'RH_BENEFICIOS' | 'TI_ALERTA_SEGURANCA' | 'URGENCIA_DIRETORIA' | 'GOV_REGULARIZACAO' | 'BOLETO_COBRANCA';
  title: string;
  brand?: string;
  difficulty: 'FACIL' | 'MEDIO' | 'DIFICIL';
  senderMask: string;
  subject: string;
  bodyPreview: string;
  fakeUrl?: string;
  indicatorsOfCompromise: string[];
  redFlags?: Array<{ title: string; explanation: string }>;
  learningObjective: string;
}

export type PhishingDispatchMode = 'RESEND' | 'SMTP' | 'SIMULATED';

export interface PhishingRecipientTelemetry {
  token: string;
  email: string;
  delivered: boolean;
  messageId?: string;
  deliveryError?: string;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  reportedAt?: string;
  lastIp?: string;
  lastUserAgent?: string;
}

export interface PhishingCampaignStats {
  campaignName: string;
  totalEmployeesTargeted: number;
  emailsDelivered: number;
  emailsOpened: number;
  linksClicked: number;
  credentialsSubmitted: number;
  reportedToSecurity: number;
  vulnerabilityIndexPercent: number; // % that submitted or clicked in real awareness mode
  humanVulnerabilityRate?: number; // HVR in percentage
  awarenessGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
}


