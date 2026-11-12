export interface CloudStorageBucket {
  provider: 'AWS_S3' | 'AZURE_BLOB' | 'GCP_STORAGE';
  bucketName: string;
  url: string;
  status: 'PUBLIC_EXPOSED' | 'RESTRICTED_ACCESS' | 'NOT_FOUND' | 'ERROR';
  statusCode?: number;
  filesAccessible: boolean;
  riskLevel: 'CRITICAL' | 'HIGH' | 'INFO';
  description: string;
}

export interface CisCloudCheck {
  id: string;
  category: 'IDENTIDADE_IAM' | 'STORAGE_CRIPTO' | 'AUDITORIA_LOGGING' | 'REDE_PERIMETRO';
  title: string;
  benchmark: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  details: string;
  remediation: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface CloudAuditReport {
  companyTarget: string;
  timestamp: string;
  overallComplianceScore: number; // 0 - 100
  totalBucketsTested: number;
  exposedBucketsCount: number;
  buckets: CloudStorageBucket[];
  cisChecklist: CisCloudCheck[];
  summaryHeadline: string;
}
