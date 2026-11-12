/**
 * Auth Email Service
 * Disparo de e-mails transacionais (2FA OTP e Redefinição de Senha)
 * com suporte nativo a Resend API e fallback para SMTP Nodemailer.
 */

import nodemailer from 'nodemailer';

export interface SendAuthEmailOptions {
  to: string;
  subject: string;
  code: string;
  userName?: string;
  type: '2FA' | 'RESET_PASSWORD';
  resetLink?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendAuthEmail(options: SendAuthEmailOptions): Promise<EmailSendResult> {
  const { to, subject, code, userName, type, resetLink } = options;
  const resendApiKey = process.env.RESEND_API_KEY;
  const senderEmail = process.env.AUTH_FROM_EMAIL || 'DEV & SEC Security <seguranca@info.devesec.com>';
  const recipientName = userName || to.split('@')[0];

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020617; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #0f172a; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0) 100%); border-bottom: 1px solid #1e293b;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">DEV &amp; SEC</span>
                    <span style="display: inline-block; font-size: 10px; font-family: monospace; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 4px; padding: 2px 6px; margin-left: 8px; vertical-align: middle;">SUITE 2.0</span>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8; font-family: monospace;">Cyber Intelligence &amp; Hardening SOC</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #ffffff;">
                ${type === '2FA' ? '🔐 Código de Autenticação em 2 Etapas (2FA)' : '🔑 Redefinição de Senha de Acesso'}
              </h2>
              
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Olá, <strong style="color: #ffffff;">${recipientName}</strong>. 
                ${type === '2FA' 
                  ? 'Recebemos uma tentativa de login na sua conta da plataforma DEV & SEC.' 
                  : 'Recebemos uma solicitação para redefinir a senha da sua conta corporativa.'}
              </p>

              <!-- OTP Box -->
              <div style="background-color: #020617; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; font-weight: 600; display: block; margin-bottom: 8px;">
                  Seu Código de Verificação
                </span>
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #10b981; font-family: monospace; display: block;">
                  ${code}
                </span>
                <span style="font-size: 12px; color: #64748b; display: block; margin-top: 8px;">
                  Válido pelos próximos <strong style="color: #cbd5e1;">2 minutos</strong> (120 segundos)
                </span>
              </div>

              ${resetLink ? `
              <div style="text-align: center; margin: 24px 0;">
                <a href="${resetLink}" style="background-color: #10b981; color: #020617; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block;">
                  Redefinir Senha Diretamente
                </a>
              </div>
              ` : ''}

              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.6; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px;">
                ⚠️ Se você não solicitou este código, ignore este e-mail imediatamente. Nunca compartilhe este código com ninguém. A equipe da DEV &amp; SEC nunca solicita senhas ou códigos OTP por telefone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #090d16; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569; font-family: monospace;">
                DEV &amp; SEC Intelligence Suite • Domínio Seguro info.devesec.com • DMARC/DKIM Ativo
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  // 1. Tentar via Resend API
  if (resendApiKey) {
    try {
      console.log(`[Auth Email] Disparando e-mail via Resend API para ${to}...`);
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [to],
          subject,
          html: htmlContent,
        }),
      });

      const resData = await res.json();
      if (res.ok && resData.id) {
        console.log(`[Auth Email] ✅ E-mail entregue com sucesso via Resend (ID: ${resData.id})`);
        return { success: true, messageId: resData.id };
      }

      console.warn(`[Auth Email] ⚠️ Falha na Resend API:`, resData);
    } catch (resendErr: any) {
      console.error(`[Auth Email] ❌ Erro de conexão Resend:`, resendErr?.message || resendErr);
    }
  }

  // 2. Fallback para SMTP Nodemailer caso configurado
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      console.log(`[Auth Email] Tentando fallback via SMTP ${process.env.SMTP_HOST}...`);
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: senderEmail,
        to,
        subject,
        html: htmlContent,
      });

      console.log(`[Auth Email] ✅ E-mail entregue com sucesso via SMTP (ID: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (smtpErr: any) {
      console.error(`[Auth Email] ❌ Falha no SMTP fallback:`, smtpErr?.message || smtpErr);
      return { success: false, error: smtpErr?.message || 'Falha no envio de e-mail por SMTP' };
    }
  }

  return {
    success: false,
    error: 'Nenhum provedor de e-mail ativo (Resend ou SMTP) configurado no sistema.',
  };
}
