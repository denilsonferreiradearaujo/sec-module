import { NextRequest, NextResponse } from 'next/server';
import { getBaselineAndLatest } from '@/core/storage/audit-store';
import { compareAudits } from '@/core/scoring/comparator';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target') || '';

    if (!target) {
      return NextResponse.json({ error: 'Alvo não informado.' }, { status: 400 });
    }

    const data = await getBaselineAndLatest(target);
    if (!data) {
      return NextResponse.json(
        { error: `Nenhuma auditoria anterior encontrada para o alvo "${target}".` },
        { status: 404 }
      );
    }

    const { baseline, latest, totalScans } = data;
    const comparison = compareAudits(baseline, latest);

    return NextResponse.json({
      target,
      totalScans,
      baseline,
      latest,
      comparison,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao processar comparativo do alvo.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
