import { NextRequest, NextResponse } from 'next/server';
import { TargetType, SecurityFinding } from '@/core/types/security';
import { scanWebPosture } from '@/modules/posture/scanner';
import { scanInfraRecon } from '@/modules/recon/scanner';
import { scanThreatIntel } from '@/modules/threat-intel/scanner';
import { scanOsint } from '@/modules/osint/scanner';
import { scanCvesForTechnologies } from '@/modules/cve/scanner';
import { calculateUnifiedScore } from '@/core/scoring/engine';

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
    const allFindings: SecurityFinding[] = [];

    // Run scans concurrently with Promise.allSettled
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

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro interno na orquestração de auditoria';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
