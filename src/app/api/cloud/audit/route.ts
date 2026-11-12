import { NextRequest, NextResponse } from 'next/server';
import { auditCloudPosture } from '@/modules/cloud/scanner';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const company = (body.company || body.target || '').trim();

    if (!company) {
      return NextResponse.json({ error: 'Nome da empresa ou prefixo cloud não informado.' }, { status: 400 });
    }

    const report = await auditCloudPosture(company);
    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro na auditoria de nuvem CSPM';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
