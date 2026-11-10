import { NextRequest, NextResponse } from 'next/server';
import { TargetType, SecurityFinding } from '@/core/types/security';
import { KaliArsenalConfig, KaliArsenalResult, KaliScanAggregation } from '@/core/types/kali-tools';
import { scanWebPosture } from '@/modules/posture/scanner';
import { scanInfraRecon } from '@/modules/recon/scanner';
import { scanThreatIntel } from '@/modules/threat-intel/scanner';
import { scanOsint } from '@/modules/osint/scanner';
import { scanCvesForTechnologies } from '@/modules/cve/scanner';
import { calculateUnifiedScore } from '@/core/scoring/engine';
import { runNmapScan } from '@/modules/kali/nmap-runner';
import { runNiktoScan } from '@/modules/kali/nikto-runner';
import { runGobusterScan } from '@/modules/kali/gobuster-runner';
import { runNucleiScan } from '@/modules/kali/nuclei-runner';
import { runSqlmapScan } from '@/modules/kali/sqlmap-runner';
import { saveAuditReport } from '@/core/storage/audit-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTarget = (body.target || '').trim();

    if (!rawTarget) {
      return NextResponse.json({ error: 'Alvo de auditoria não informado.' }, { status: 400 });
    }

    // Determine target type
    let targetType: TargetType = 'domain';
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(rawTarget)) {
      targetType = 'ip';
    } else if (rawTarget.startsWith('@') || (!rawTarget.includes('.') && !rawTarget.includes('/'))) {
      targetType = 'username';
    } else if (rawTarget.startsWith('http://') || rawTarget.startsWith('https://')) {
      targetType = 'url';
    }

    const safeMode = Boolean(body.safeMode);
    const kaliConfig = (body.kaliArsenal || {}) as Partial<KaliArsenalConfig>;
    const allFindings: SecurityFinding[] = [];

    // Run core scans concurrently with Promise.allSettled
    const [postureRes, reconRes, threatRes, osintRes] = await Promise.allSettled([
      targetType !== 'username' ? scanWebPosture(rawTarget, { safeMode }) : Promise.resolve(null),
      targetType !== 'username' ? scanInfraRecon(rawTarget) : Promise.resolve(null),
      scanThreatIntel(rawTarget),
      scanOsint(rawTarget, targetType === 'username'),
    ]);

    const webPosture = postureRes.status === 'fulfilled' && postureRes.value ? postureRes.value.data : undefined;
    if (postureRes.status === 'fulfilled' && postureRes.value) {
      allFindings.push(...postureRes.value.findings);
    }

    const infraRecon = reconRes.status === 'fulfilled' && reconRes.value ? reconRes.value.data : undefined;
    if (reconRes.status === 'fulfilled' && reconRes.value) {
      allFindings.push(...reconRes.value.findings);
    }

    const threatIntel = threatRes.status === 'fulfilled' && threatRes.value ? threatRes.value.data : undefined;
    if (threatRes.status === 'fulfilled' && threatRes.value) {
      allFindings.push(...threatRes.value.findings);
    }

    const osint = osintRes.status === 'fulfilled' && osintRes.value ? osintRes.value.data : undefined;
    if (osintRes.status === 'fulfilled' && osintRes.value) {
      allFindings.push(...osintRes.value.findings);
    }

    // Detect CVEs based on discovered technologies & banners
    const detectedTechnologies: string[] = [];
    if (webPosture?.technologies) {
      detectedTechnologies.push(...webPosture.technologies);
    }
    if (infraRecon?.openPorts) {
      for (const p of infraRecon.openPorts) {
        if (p.banner && p.banner.trim().length > 3) {
          detectedTechnologies.push(p.banner.trim());
        }
      }
    }

    let cveData = undefined;
    if (detectedTechnologies.length > 0) {
      try {
        const cveRes = await scanCvesForTechnologies(detectedTechnologies);
        cveData = cveRes.data;
        allFindings.push(...cveRes.findings);
      } catch (err) {
        console.error('Erro na auditoria CVE/NIST:', err);
      }
    }

    // Orchestrate Kali Arsenal engines if requested
    let kaliAggregation: KaliScanAggregation | undefined = undefined;
    const arsenalPromises: Promise<{ id: string; result: KaliArsenalResult }>[] = [];

    if (kaliConfig.nmap && targetType !== 'username') {
      arsenalPromises.push(runNmapScan(rawTarget).then(r => ({ id: 'nmap', result: r })));
    }
    if (kaliConfig.nikto && targetType !== 'username') {
      arsenalPromises.push(runNiktoScan(rawTarget).then(r => ({ id: 'nikto', result: r })));
    }
    if (kaliConfig.gobuster && targetType !== 'username') {
      arsenalPromises.push(runGobusterScan(rawTarget).then(r => ({ id: 'gobuster', result: r })));
    }
    if (kaliConfig.nuclei && targetType !== 'username') {
      arsenalPromises.push(runNucleiScan(rawTarget).then(r => ({ id: 'nuclei', result: r })));
    }
    if (kaliConfig.sqlmap && targetType !== 'username') {
      arsenalPromises.push(runSqlmapScan(rawTarget).then(r => ({ id: 'sqlmap', result: r })));
    }

    if (arsenalPromises.length > 0) {
      const arsenalSettled = await Promise.allSettled(arsenalPromises);
      const results: Record<string, KaliArsenalResult> = {};
      const executed: string[] = [];
      let totalArsenalFindings = 0;

      for (const res of arsenalSettled) {
        if (res.status === 'fulfilled') {
          const { id, result } = res.value;
          results[id] = result;
          executed.push(result.engineName);
          allFindings.push(...result.findings);
          totalArsenalFindings += result.findings.length;
        }
      }

      kaliAggregation = {
        enginesExecuted: executed,
        totalArsenalFindings,
        arsenalScoreImpact: totalArsenalFindings * 10,
        results,
      };
    }

    // Synthesize report
    const report = calculateUnifiedScore({
      target: rawTarget,
      targetType,
      findings: allFindings,
      webPosture,
      infraRecon,
      threatIntel,
      osint,
      cveData,
    });

    if (kaliAggregation) {
      report.kaliArsenal = kaliAggregation;
    }

    // Persist scan history for automatic comparator matching
    await saveAuditReport(report);

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno na orquestração de auditoria';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
