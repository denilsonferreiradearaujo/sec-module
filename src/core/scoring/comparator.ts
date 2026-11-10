import { UnifiedAuditReport, SecurityFinding } from '../types/security';
import { AuditComparisonResult } from '../types/comparator';

export function compareAudits(
  baseline: UnifiedAuditReport,
  latest: UnifiedAuditReport
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

  let executiveROIHeadline = 'Evolução de Segurança Estável';
  if (scoreDiff >= 20 || criticalReduced > 0) {
    executiveROIHeadline = `Excelente ROI: Redução de ${criticalReduced} falhas críticas e evolução de postura de ${baseline.grade} (${baseline.overallScore} pts) para ${latest.grade} (${latest.overallScore} pts).`;
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
    executiveROIHeadline,
  };
}
