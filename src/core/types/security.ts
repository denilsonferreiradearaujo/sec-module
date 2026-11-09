export type TargetType = 'url' | 'domain' | 'ip' | 'username' | 'apk' | 'repo' | 'code';

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface SecurityFinding {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  remediation: string;
  category: 'WEB_POSTURE' | 'INFRASTRUCTURE' | 'THREAT_INTEL' | 'OSINT' | 'MOBILE';
  impact?: string;
  cveOrStandard?: string; // e.g. "CWE-693", "OWASP A05:2021", "OWASP Mobile M1"
}

export interface WebPostureData {
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  protocol: string;
  statusCode?: number;
  headers: {
    hsts: { present: boolean; raw?: string; issues?: string[] };
    csp: { present: boolean; raw?: string; issues?: string[] };
    xFrameOptions: { present: boolean; raw?: string; issues?: string[] };
    xContentTypeOptions: { present: boolean; raw?: string };
    referrerPolicy: { present: boolean; raw?: string };
    permissionsPolicy: { present: boolean; raw?: string };
  };
  tls?: {
    valid: boolean;
    issuer?: string;
    validTo?: string;
    daysRemaining?: number;
    protocol?: string;
  };
  cookies: Array<{
    name: string;
    secure: boolean;
    httpOnly: boolean;
    sameSite?: string;
  }>;
  technologies: string[];
  moduleScore: number; // 0 - 100
}

export interface InfraReconData {
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  resolvedIps: string[];
  geolocation?: {
    country: string;
    countryCode: string;
    city: string;
    region: string;
    isp: string;
    org: string;
    asn: string;
    lat: number;
    lon: number;
  };
  dns: {
    a: string[];
    aaaa: string[];
    mx: string[];
    txt: string[];
    ns: string[];
    spf?: { present: boolean; record?: string; valid: boolean };
    dmarc?: {
      present: boolean;
      record?: string;
      valid: boolean;
      inherited?: boolean;
      inheritedFrom?: string;
      policy?: 'none' | 'quarantine' | 'reject';
      subdomainPolicy?: 'none' | 'quarantine' | 'reject';
      effectivePolicy?: 'none' | 'quarantine' | 'reject';
    };
  };
  openPorts: Array<{
    port: number;
    service: string;
    banner?: string;
    state: 'OPEN' | 'CLOSED' | 'FILTERED';
    riskLevel: SeverityLevel;
  }>;
  subdomains: string[];
  moduleScore: number;
}

export interface ThreatIntelData {
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  abuseConfidenceScore: number; // 0 - 100
  totalReports: number;
  isMalicious: boolean;
  malwareMatches: string[];
  virusTotal?: {
    analyzed: boolean;
    maliciousVotes: number;
    suspiciousVotes: number;
    harmlessVotes: number;
    totalEngines: number;
    detectedEngines: string[];
    permalink?: string;
  };
  phishingHeuristics: {
    suspiciousTld: boolean;
    homographAttack: boolean;
    highEntropy: boolean;
    ipAsHost: boolean;
    hasKeywords: string[];
    isWildcardOrDynamicDns: boolean;
    wildcardService?: string;
    embeddedIp?: string;
  };
  blacklists: Array<{ name: string; listed: boolean; details?: string }>;
  moduleScore: number;
}

export interface OsintData {
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  whois?: {
    registrar?: string;
    creationDate?: string;
    expirationDate?: string;
    privacyProtected: boolean;
    nameServers: string[];
  };
  socialProfiles: Array<{
    platform: string;
    url: string;
    exists: boolean;
    status: 'FOUND' | 'NOT_FOUND' | 'ERROR';
  }>;
  breachSummary?: {
    breachesDetected: number;
    sampleBreaches: string[];
    riskAdvice: string;
  };
  moduleScore: number;
}

export interface MobileAuditData {
  appName?: string;
  packageName?: string;
  minSdk?: number;
  targetSdk?: number;
  permissions: Array<{
    name: string;
    isDangerous: boolean;
    description: string;
  }>;
  dangerousFlags: Array<{
    flag: string;
    status: 'VULNERABLE' | 'SECURE';
    explanation: string;
  }>;
  exportedComponents: Array<{
    name: string;
    type: 'activity' | 'service' | 'receiver';
    exported: boolean;
    hasPermission: boolean;
    risk: SeverityLevel;
  }>;
  owaspCompliance: Array<{
    code: string;
    title: string;
    status: 'PASSED' | 'FAILED' | 'WARNING';
    notes: string;
  }>;
  moduleScore: number;
}

export interface CveItem {
  id: string; // e.g. "CVE-2021-41773"
  source: string; // "NVD / NIST"
  description: string;
  cvssScore: number;
  cvssSeverity: SeverityLevel;
  publishedDate: string;
  references: string[];
}

export interface CveData {
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  queriedTechnologies: string[];
  totalCves: number;
  cves: CveItem[];
  moduleScore: number;
}

export interface SecretLeakItem {
  ruleName: string;
  severity: SeverityLevel;
  detector: string;
  matchMasked: string;
  line?: number;
  recommendation: string;
}

export interface SecretAuditData {
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  totalLeaks: number;
  leaks: SecretLeakItem[];
  sourceName?: string;
  moduleScore: number;
}

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  standard: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  details: string;
  impact: string;
  recommendation?: string;
}

export interface ComplianceScorecard {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  complianceRate: number; // 0 - 100%
  items: ChecklistItem[];
}

export interface UnifiedAuditReport {
  id: string;
  timestamp: string;
  target: string;
  targetType: TargetType;
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  riskLevel: SeverityLevel;
  summary: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    headline: string;
  };
  findings: SecurityFinding[];
  complianceScorecard?: ComplianceScorecard;
  webPosture?: WebPostureData;
  infraRecon?: InfraReconData;
  threatIntel?: ThreatIntelData;
  osint?: OsintData;
  mobileAudit?: MobileAuditData;
  cveData?: CveData;
  secretsAudit?: SecretAuditData;
  commercialPitch: {
    leadMagnetTitle: string;
    recommendedService: string;
    ctaMessage: string;
  };
}
