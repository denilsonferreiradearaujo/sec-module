import { NextRequest, NextResponse } from 'next/server';
import { listUniqueTargets, deleteTargetAudits } from '@/core/storage/audit-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const targets = await listUniqueTargets(q);
    return NextResponse.json({ targets });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao buscar histórico de alvos.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let target = searchParams.get('target');
    if (!target) {
      const body = await req.json().catch(() => ({}));
      target = body.target;
    }
    if (!target) {
      return NextResponse.json({ error: 'Alvo não informado.' }, { status: 400 });
    }
    const success = await deleteTargetAudits(target);
    return NextResponse.json({ success });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao deletar histórico do alvo.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

