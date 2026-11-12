import { UnifiedAuditReport, SecurityFinding } from '../types/security';
import { AuditComparisonResult, FairRiskAssessment, LgpdFineEstimation } from '../types/comparator';

export function calculateLgpdAndFairRisk(
  baselineCritical: number,
  baselineHigh: number,
  latestCritical: number,
  latestHigh: number,
  annualRevenue = 12000000 // R$ 12M default
): { fairRisk: FairRiskAssessment; lgpdFine: LgpdFineEstimation } {
  // 1. LGPD Art. 52 (2% of revenue up to R$ 50M per infraction)
  const maxLegalFine = Math.min(annualRevenue * 0.02, 50000000);

  // Fine severity factor (critical count weighs heavily)
  const fineFactorBefore = Math.min(1.0, (baselineCritical * 0.35 + baselineHigh * 0.15));
  const fineFactorAfter = Math.min(1.0, (latestCritical * 0.35 + latestHigh * 0.15));

  const estimatedFineBefore = Math.round(maxLegalFine * fineFactorBefore);
  const estimatedFineAfter = Math.round(maxLegalFine * fineFactorAfter);
  const riskAvoided = Math.max(0, estimatedFineBefore - estimatedFineAfter);

  // 2. FAIR Model (Factor Analysis of Information Risk)
  const lossMagnitudeMin = Math.round(annualRevenue * 0.015); // e.g. 180k
  const lossMagnitudeMax = Math.round(annualRevenue * 0.12); // e.g. 1.44M

  const threatEventFrequency = baselineCritical > 0 ? 'Elevada (3 - 6 tentativas/mês)' : 'Moderada (1 - 2 tentativas/mês)';
  const vulnerabilityFactor = baselineCritical > 0 ? 0.75 : 0.30;

  const aleBefore = Math.round(lossMagnitudeMax * vulnerabilityFactor);
  const aleAfter = Math.round(lossMagnitudeMin * (latestCritical > 0 ? 0.40 : 0.08));
  const mitigatedLossSavings = Math.max(0, aleBefore - aleAfter);

  return {
    lgpdFine: {
      annualRevenue,
      maxLegalFine,
      estimatedFineBefore,
      estimatedFineAfter,
      riskAvoided,
    },
    fairRisk: {
      threatEventFrequency,
      vulnerabilityFactor: Math.round(vulnerabilityFactor * 100),
      lossMagnitudeMin,
      lossMagnitudeMax,
      annualizedLossExpectancy: aleAfter,
      mitigatedLossSavings,
    },
  };
}

export function compareAudits(
  baseline: UnifiedAuditReport,
  latest: UnifiedAuditReport,
  annualRevenue = 12000000
): AuditComparisonResult {
  const scoreDiff = latest.overallScore - baseline.overallScore;
  const isImproved = scoreDiff > 0 || (latest.summary.criticalCount < baseline.summary.criticalCount);

  const baselineFindingsMap = new Map<string, SecurityFinding>();
  baseline.findings.forEach(f => baselineFindingsMap.set(f.id || f.title, f));

  const latestFindingsMap = new Map<string, SecurityFinding>();
  latest.findings.forEach(f => latestFindingsMap.set(f.id || f.title, f));

  // Mitigated: In baseline, but NOT in latest
  const mitigatedFindings: SecurityFinding[] = [];
  baseline.findings.forEach(f => {
    const key = f.id || f.title;
    if (!latestFindingsMap.has(key)) {
      mitigatedFindings.push(f);
    }
  });

  // Remaining: In baseline AND in latest
  const remainingFindings: SecurityFinding[] = [];
  latest.findings.forEach(f => {
    const key = f.id || f.title;
    if (baselineFindingsMap.has(key)) {
      remainingFindings.push(f);
    }
  });

  // New: In latest, but NOT in baseline
  const newFindings: SecurityFinding[] = [];
  latest.findings.forEach(f => {
    const key = f.id || f.title;
    if (!baselineFindingsMap.has(key)) {
      newFindings.push(f);
    }
  });

  const criticalReduced = Math.max(0, baseline.summary.criticalCount - latest.summary.criticalCount);
  const highReduced = Math.max(0, baseline.summary.highCount - latest.summary.highCount);

  const baselineCompliance = baseline.complianceScorecard?.complianceRate || 0;
  const latestCompliance = latest.complianceScorecard?.complianceRate || 0;
  const complianceDiff = latestCompliance - baselineCompliance;

  const { fairRisk, lgpdFine } = calculateLgpdAndFairRisk(
    baseline.summary.criticalCount,
    baseline.summary.highCount,
    latest.summary.criticalCount,
    latest.summary.highCount,
    annualRevenue
  );

  let executiveROIHeadline = 'Evolução de Segurança Estável';
  if (scoreDiff >= 20 || criticalReduced > 0) {
    executiveROIHeadline = `Excelente ROI: Redução de ${criticalReduced} falhas críticas e economia estimada em R$ ${fairRisk.mitigatedLossSavings.toLocaleString('pt-BR')} em perdas operacionais e multas regulatórias evitadas.`;
  } else if (scoreDiff < 0) {
    executiveROIHeadline = `Atenção: A postura de segurança regrediu em ${Math.abs(scoreDiff)} pontos. Novas exposições foram identificadas.`;
  }

  return {
    baselineReport: {
      id: baseline.id,
      timestamp: baseline.timestamp,
      overallScore: baseline.overallScore,
      grade: baseline.grade,
      riskLevel: baseline.riskLevel,
      criticalCount: baseline.summary.criticalCount,
      highCount: baseline.summary.highCount,
      totalFindings: baseline.findings.length,
      complianceRate: baselineCompliance,
    },
    latestReport: {
      id: latest.id,
      timestamp: latest.timestamp,
      overallScore: latest.overallScore,
      grade: latest.grade,
      riskLevel: latest.riskLevel,
      criticalCount: latest.summary.criticalCount,
      highCount: latest.summary.highCount,
      totalFindings: latest.findings.length,
      complianceRate: latestCompliance,
    },
    delta: {
      scoreDiff,
      isImproved,
      criticalReduced,
      highReduced,
      complianceDiff,
    },
    mitigatedFindings,
    remainingFindings,
    newFindings,
    fairRisk,
    lgpdFine,
    executiveROIHeadline,
  };
}
