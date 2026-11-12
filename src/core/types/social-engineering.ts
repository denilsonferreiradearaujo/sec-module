export interface DarkWebBreach {
  id: string;
  name: string;
  title: string;
  domain: string;
  breachDate: string;
  addedDate: string;
  pwnCount: number;
  description: string;
  dataClasses: string[];
  isVerified: boolean;
  isFabricated: boolean;
  isSensitive: boolean;
  isRetired: boolean;
  isSpamList: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface CLevelExposureProfile {
  id: string;
  name: string;
  role: string;
  email: string;
  documentMasked?: string;
  source: 'Receita Federal (QSA Oficial)' | 'Registro.br (NIC.br)' | 'WHOIS Global';
  exposureScore: number; // 0 - 100
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  breachesCount: number;
  breachNames: string[];
  linkedInExposed: boolean;
  corporateDomain: string;
  whalingRiskFactor: 'EXTREMO' | 'ALTO' | 'MODERADO';
  spearPhishingVectors: string[];
  mitigationAdvice: string;
}

export interface SocialEngineeringAuditResult {
  target: string;
  timestamp: string;
  companyLegalName?: string;
  cnpjOrCpfMasked?: string;
  registrationSource: string;
  totalBreachesFound: number;
  totalCompromisedAccounts: number;
  darkWebBreaches: DarkWebBreach[];
  cLevelProfiles: CLevelExposureProfile[];
  overallExposureScore: number;
  whalingRiskIndex: number; // 0 - 100
  executiveSummary: string;
}
