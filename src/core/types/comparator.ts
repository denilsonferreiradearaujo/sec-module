import { UnifiedAuditReport, SeverityLevel, SecurityFinding } from './security';

export interface AuditComparisonResult {
  baselineReport: {
    id: string;
    timestamp: string;
    overallScore: number;
    grade: string;
    riskLevel: SeverityLevel;
    criticalCount: number;
    highCount: number;
    totalFindings: number;
    complianceRate: number;
  };
  latestReport: {
    id: string;
    timestamp: string;
    overallScore: number;
    grade: string;
    riskLevel: SeverityLevel;
    criticalCount: number;
    highCount: number;
    totalFindings: number;
    complianceRate: number;
  };
  delta: {
    scoreDiff: number; // e.g. +54
    isImproved: boolean;
    criticalReduced: number;
    highReduced: number;
    complianceDiff: number; // e.g. +45%
  };
  mitigatedFindings: SecurityFinding[];
  remainingFindings: SecurityFinding[];
  newFindings: SecurityFinding[];
  executiveROIHeadline: string;
}
