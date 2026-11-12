import { NextRequest, NextResponse } from 'next/server';
import { findUserByPhoneOrEmail, verifyOtpToken, updateUserPassword } from '@/core/storage/user-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, code, newPassword } = body;

    if (!identifier || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Identificador, código de verificação e nova senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'A nova senha deve ter no mínimo 8 caracteres.' },
        { status: 400 }
      );
    }

    const user = await findUserByPhoneOrEmail(identifier);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não localizado no sistema.' },
        { status: 404 }
      );
    }

    const tokenIdentifier = user.phone && !identifier.includes('@') ? user.phone : user.email;
    const isValid = await verifyOtpToken(tokenIdentifier, code, 'RESET_PASSWORD');

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Código de verificação inválido ou expirado (limite de 120 segundos). Solicite um novo código.' },
        { status: 401 }
      );
    }

    const updated = await updateUserPassword(user.id, newPassword);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Falha ao atualizar a senha no banco de dados.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sua senha foi redefinida com sucesso! Você já pode fazer login com as novas credenciais.',
    });
  } catch (err: any) {
    console.error('[ResetPassword] Erro:', err);
    return NextResponse.json(
      { success: false, error: 'Ocorreu um erro interno ao redefinir a senha.' },
      { status: 500 }
    );
  }
}
