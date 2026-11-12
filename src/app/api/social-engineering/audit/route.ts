import { NextRequest, NextResponse } from 'next/server';
import { auditSocialEngineeringAndDarkWeb } from '@/modules/osint/breach-intelligence';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const target = (body.target || '').trim();

    if (!target) {
      return NextResponse.json({ error: 'Domínio ou e-mail alvo não fornecido.' }, { status: 400 });
    }

    const result = await auditSocialEngineeringAndDarkWeb(target);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro ao consultar inteligência de vazamentos';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
