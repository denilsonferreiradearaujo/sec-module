import { NextRequest, NextResponse } from 'next/server';
import { findUserByPhoneOrEmail, createOtpToken } from '@/core/storage/user-store';
import { sendEvolutionWhatsApp } from '@/modules/auth/evolution-api';
import { sendAuthEmail } from '@/modules/auth/email-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, method = 'whatsapp' } = body;

    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Informe seu e-mail ou número de WhatsApp cadastrado.' },
        { status: 400 }
      );
    }

    const cleanInput = identifier.trim();
    const user = await findUserByPhoneOrEmail(cleanInput);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: `Nenhum usuário cadastrado foi localizado para o ${
            method === 'whatsapp' ? 'WhatsApp' : 'e-mail'
          } "${cleanInput}". Verifique o DDD e os números digitados.`,
        },
        { status: 404 }
      );
    }

    if (method === 'whatsapp') {
      const targetPhone = user.phone || cleanInput.replace(/\D/g, '');
      if (!targetPhone) {
        return NextResponse.json(
          { success: false, error: 'Este usuário não possui um número de WhatsApp cadastrado no sistema.' },
          { status: 400 }
        );
      }

      const code = await createOtpToken(targetPhone, 'RESET_PASSWORD', 120);
      const messageText = `🔑 *DEV & SEC - Redefinição de Senha*\n\nOlá, *${user.name}*!\n\nSeu código de segurança para redefinir sua senha é:\n\n*${code}*\n\nEste código expira em *120 segundos*. Nunca compartilhe este código com ninguém.`;

      console.log(`[ForgotPassword] Disparando OTP via WhatsApp para ${targetPhone}...`);
      const waResult = await sendEvolutionWhatsApp(targetPhone, messageText);

      if (!waResult.success) {
        console.error('[ForgotPassword] ❌ Falha Evolution API:', waResult.error);
        return NextResponse.json(
          {
            success: false,
            error: `Falha ao entregar mensagem no WhatsApp via Evolution API: ${waResult.error || 'Erro desconhecido'}`,
          },
          { status: 502 }
        );
      }

      const maskedPhone =
        targetPhone.length > 7
          ? `${targetPhone.slice(0, 4)}****${targetPhone.slice(-4)}`
          : targetPhone;

      return NextResponse.json({
        success: true,
        message: `Código de verificação de 6 dígitos enviado para seu WhatsApp (${maskedPhone}).`,
        method: 'whatsapp',
        identifier: targetPhone,
      });
    }

    // Fluxo E-mail
    const code = await createOtpToken(user.email, 'RESET_PASSWORD', 120);
    const origin = req.nextUrl.origin || 'http://localhost:3000';
    const resetLink = `${origin}/esqueci-senha?code=${code}&identifier=${encodeURIComponent(user.email)}`;

    console.log(`[ForgotPassword] Disparando e-mail de recuperação para ${user.email}...`);
    const emailResult = await sendAuthEmail({
      to: user.email,
      subject: '🔑 Redefinição de Senha - DEV & SEC Suite 2.0',
      code,
      userName: user.name,
      type: 'RESET_PASSWORD',
      resetLink,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: emailResult.error || 'Falha no disparo do e-mail de recuperação.' },
        { status: 502 }
      );
    }

    const maskedEmail = `${user.email.slice(0, 3)}***@${user.email.split('@')[1]}`;

    return NextResponse.json({
      success: true,
      message: `Código de recuperação enviado com sucesso para ${maskedEmail}.`,
      method: 'email',
      identifier: user.email,
    });
  } catch (err: any) {
    console.error('[ForgotPassword] Erro inesperado:', err);
    return NextResponse.json(
      { success: false, error: 'Ocorreu um erro interno ao processar a solicitação.' },
      { status: 500 }
    );
  }
}
