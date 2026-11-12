import { UnifiedAuditReport, SeverityLevel, SecurityFinding } from './security';

export interface FairRiskAssessment {
  threatEventFrequency: string;
  vulnerabilityFactor: number;
  lossMagnitudeMin: number;
  lossMagnitudeMax: number;
  annualizedLossExpectancy: number; // ALE em R$
  mitigatedLossSavings: number;
}

export interface LgpdFineEstimation {
  annualRevenue: number;
  maxLegalFine: number; // Min(revenue * 0.02, 50_000_000)
  estimatedFineBefore: number;
  estimatedFineAfter: number;
  riskAvoided: number;
}

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
  fairRisk?: FairRiskAssessment;
  lgpdFine?: LgpdFineEstimation;
  executiveROIHeadline: string;
}
