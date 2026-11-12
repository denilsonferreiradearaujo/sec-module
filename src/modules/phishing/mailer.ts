import nodemailer from 'nodemailer';
import { PhishingTemplate, PhishingDispatchMode } from '@/core/types/phishing';

export interface SmtpConfig {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  pass: string;
}

export interface DispatchEmailOptions {
  mode: PhishingDispatchMode;
  to: string;
  senderEmail: string;
  template: PhishingTemplate;
  organization: string;
  trackingToken: string;
  publicBaseUrl: string;
  smtpConfig?: SmtpConfig;
}

export interface DispatchEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDisplayNameFromMask(senderMask: string, fallback = 'Notificações Corporativas'): string {
  const idx = senderMask.indexOf('<');
  if (idx > 0) {
    return senderMask.slice(0, idx).trim();
  }
  return fallback;
}

function getActionLabel(template: PhishingTemplate): string {
  switch (template.category) {
    case 'RH_BENEFICIOS':
      return 'Validar Escala de Férias Agora';
    case 'REDEFINICAO_SENHA':
      return 'Revalidar Sessão Corporativa';
    case 'BOLETO_COBRANCA':
      return 'Visualizar 2ª Via Atualizada';
    case 'GOV_REGULARIZACAO':
      return 'Acessar Regularização Cadastral';
    case 'FINANCEIRO_PIX':
      return 'Visualizar Comprovante PIX';
    case 'TI_ALERTA_SEGURANCA':
      return 'Verificar e Revogar Acesso Suspeito';
    default:
      return 'Acessar Portal de Verificação';
  }
}

function getBrandAccentColor(template: PhishingTemplate): string {
  switch (template.category) {
    case 'RH_BENEFICIOS':
      return '#0f766e';
    case 'REDEFINICAO_SENHA':
      return '#0078d4';
    case 'BOLETO_COBRANCA':
      return '#b45309';
    case 'GOV_REGULARIZACAO':
      return '#1351b4';
    case 'FINANCEIRO_PIX':
      return '#059669';
    case 'TI_ALERTA_SEGURANCA':
      return '#dc2626';
    default:
      return '#d97706';
  }
}

export function buildAwarenessEmailHtml(params: {
  template: PhishingTemplate;
  organization: string;
  trackingToken: string;
  publicBaseUrl: string;
}): string {
  const { template, organization, trackingToken, publicBaseUrl } = params;
  const cleanBase = publicBaseUrl.replace(/\/$/, '');
  const clickUrl = `${cleanBase}/api/phishing/track?token=${encodeURIComponent(trackingToken)}&event=click`;
  const openPixelUrl = `${cleanBase}/api/phishing/track?token=${encodeURIComponent(trackingToken)}&event=open`;
  const reportUrl = `${cleanBase}/api/phishing/track?token=${encodeURIComponent(trackingToken)}&event=report`;

  const accentColor = getBrandAccentColor(template);
  const actionLabel = getActionLabel(template);
  const brandTitle = escapeHtml(template.brand || 'Portal Corporativo');
  const subjectText = escapeHtml(template.subject);
  const bodyText = escapeHtml(template.bodyPreview);
  const orgText = escapeHtml(organization);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subjectText}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #cbd5e1;box-shadow:0 4px 14px rgba(15,23,42,0.06);">
          <tr>
            <td style="background-color:${accentColor};padding:20px 28px;color:#ffffff;">
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;opacity:0.9;margin-bottom:4px;">
                Comunicação Interna — ${orgText}
              </div>
              <div style="font-size:20px;font-weight:bold;">
                ${brandTitle}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h2 style="margin:0 0 14px 0;font-size:17px;color:#0f172a;line-height:1.4;">
                ${subjectText}
              </h2>
              <p style="margin:0 0 22px 0;font-size:14px;line-height:1.65;color:#334155;">
                ${bodyText}
              </p>

              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0;">
                <tr>
                  <td align="center" style="border-radius:6px;background-color:${accentColor};">
                    <a href="${clickUrl}" target="_blank" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">
                      ${escapeHtml(actionLabel)}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0 0;font-size:12px;color:#64748b;line-height:1.5;">
                Caso o botão não funcione, utilize o link direto de verificação:<br />
                <a href="${clickUrl}" style="color:${accentColor};word-break:break-all;">${escapeHtml(template.fakeUrl || clickUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f8fafc;padding:16px 28px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;line-height:1.5;">
              <div style="margin-bottom:8px;">
                Enviado para <strong>${orgText}</strong>. Desconfiou desta mensagem?
                <a href="${reportUrl}" style="color:#0284c7;font-weight:bold;text-decoration:underline;">
                  Reportar E-mail Suspeito ao Time de Segurança
                </a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  <img src="${openPixelUrl}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0;" />
</body>
</html>`;
}

export async function dispatchAwarenessEmail(options: DispatchEmailOptions): Promise<DispatchEmailResult> {
  const { mode, to, senderEmail, template, organization, trackingToken, publicBaseUrl, smtpConfig } = options;

  const displayName = getDisplayNameFromMask(template.senderMask);
  const fromHeader = `${displayName} <${senderEmail}>`;
  const html = buildAwarenessEmailHtml({
    template,
    organization,
    trackingToken,
    publicBaseUrl,
  });

  if (mode === 'RESEND') {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'RESEND_API_KEY não configurada no arquivo .env / .env.local.',
      };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromHeader,
          to: [to],
          subject: template.subject,
          html,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return {
          success: false,
          error: data?.message || `Erro HTTP ${res.status} na API do Resend`,
        };
      }

      return {
        success: true,
        messageId: data?.id,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Falha de conexão com api.resend.com',
      };
    }
  }

  if (mode === 'SMTP') {
    if (!smtpConfig?.host || !smtpConfig?.user || !smtpConfig?.pass) {
      return {
        success: false,
        error: 'Configuração SMTP incompleta (host, usuário e senha são obrigatórios).',
      };
    }

    try {
      const port = Number(smtpConfig.port) || 465;
      const transporter = nodemailer.createTransport({
        host: smtpConfig.host,
        port,
        secure: smtpConfig.secure ?? port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass,
        },
      });

      const info = await transporter.sendMail({
        from: fromHeader,
        to,
        subject: template.subject,
        html,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Falha no envio via SMTP',
      };
    }
  }

  return {
    success: false,
    error: 'Modo de disparo inválido para envio real.',
  };
}
