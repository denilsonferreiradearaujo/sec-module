import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, verifyOtpToken, createSessionToken } from '@/core/storage/user-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'E-mail e código de verificação são obrigatórios.' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const identifier = user.twoFactorMethod === 'whatsapp' && user.phone ? user.phone : user.email;
    const isValid = await verifyOtpToken(identifier, code, '2FA');

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Código de verificação inválido ou expirado (limite de 120s).' },
        { status: 401 }
      );
    }

    const sessionToken = createSessionToken(user, 7);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set('devesec_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('[2FA Verify] Erro:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao validar código 2FA.' },
      { status: 500 }
    );
  }
}
