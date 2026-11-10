import { NextRequest, NextResponse } from 'next/server';
import { listUniqueTargets } from '@/core/storage/audit-store';

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
