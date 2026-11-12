import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword, createSessionToken, createOtpToken } from '@/core/storage/user-store';
import { sendEvolutionWhatsApp } from '@/modules/auth/evolution-api';
import { sendAuthEmail } from '@/modules/auth/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash, user.salt);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas. Verifique seu e-mail e senha.' },
        { status: 401 }
      );
    }

    // Se 2FA estiver ativado para o usuário
    if (user.twoFactorEnabled) {
      const code = await createOtpToken(
        user.twoFactorMethod === 'whatsapp' && user.phone ? user.phone : user.email,
        '2FA',
        120
      );

      if (user.twoFactorMethod === 'whatsapp' && user.phone) {
        await sendEvolutionWhatsApp(
          user.phone,
          `🔐 *DEV & SEC - Autenticação em 2 Etapas*\n\nOlá, *${user.name}*!\n\nSeu código de acesso é:\n\n*${code}*\n\nEste código expira em *120 segundos*. Nunca compartilhe este código.`
        );
      } else {
        await sendAuthEmail({
          to: user.email,
          subject: '🔐 Código de Autenticação em 2 Etapas (2FA) - DEV & SEC',
          code,
          userName: user.name,
          type: '2FA',
        });
      }

      return NextResponse.json({
        success: true,
        requires2FA: true,
        method: user.twoFactorMethod,
        identifierMasked:
          user.twoFactorMethod === 'whatsapp' && user.phone
            ? `${user.phone.slice(0, 4)}****${user.phone.slice(-4)}`
            : `${user.email.slice(0, 3)}***@${user.email.split('@')[1]}`,
      });
    }

    // Login direto sem 2FA
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

    // Grava cookie seguro HTTP-Only
    response.cookies.set('devesec_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    });

    return response;
  } catch (err: any) {
    console.error('[Auth Login] Erro inesperado:', err);
    return NextResponse.json(
      { success: false, error: 'Ocorreu um erro interno ao processar o login.' },
      { status: 500 }
    );
  }
}
