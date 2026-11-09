import { NextRequest, NextResponse } from 'next/server';
import { auditAndroidManifest } from '@/modules/mobile/scanner';
import { calculateUnifiedScore } from '@/core/scoring/engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const manifestXml = (body.manifest || '').trim();

    if (!manifestXml) {
      return NextResponse.json({ error: 'Conteúdo do AndroidManifest.xml não fornecido.' }, { status: 400 });
    }

    const { data: mobileData, findings } = auditAndroidManifest(manifestXml);

    const report = calculateUnifiedScore({
      target: mobileData.packageName || 'App-Target',
      targetType: 'apk',
      findings,
      mobileAudit: mobileData,
    });

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao processar auditoria de app';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
