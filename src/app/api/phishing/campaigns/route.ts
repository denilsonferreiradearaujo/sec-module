import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  listPhishingCampaigns,
  getPhishingCampaignById,
  savePhishingCampaign,
  deletePhishingCampaign,
  StoredPhishingCampaign,
} from '@/core/storage/phishing-store';
import {
  PHISHING_TEMPLATES,
  calculateCampaignAwareness,
  recalculateRealCampaignStats,
} from '@/modules/phishing/campaign-manager';
import { dispatchAwarenessEmail, SmtpConfig } from '@/modules/phishing/mailer';
import { PhishingDispatchMode, PhishingRecipientTelemetry } from '@/core/types/phishing';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const resendConfigured = Boolean(process.env.RESEND_API_KEY);

    if (id) {
      const campaign = await getPhishingCampaignById(id);
      if (!campaign) {
        return NextResponse.json({ error: 'Campanha não encontrada.' }, { status: 404 });
      }
      return NextResponse.json({ campaign, resendConfigured });
    }

    const q = searchParams.get('q') || '';
    const campaigns = await listPhishingCampaigns(q);
    return NextResponse.json({ campaigns, resendConfigured });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao listar histórico de campanhas.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const organization = (body.organization || 'Organização Padrão').trim();
    const title = (body.title || `Teste de Conscientização - ${organization}`).trim();
    const templateId = body.templateId || 'PHISH-RH-VACATIONS';
    const targetEmailsRaw = (body.targetEmails || []) as string[];
    const dispatchMode = (body.dispatchMode || 'SIMULATED') as PhishingDispatchMode;
    const senderEmail = (body.senderEmail || 'seguranca@info.devesec.com').trim();
    const publicBaseUrl = (body.publicBaseUrl || req.nextUrl.origin || 'http://localhost:3000')
      .trim()
      .replace(/\/$/, '');
    const smtpConfig = body.smtpConfig as SmtpConfig | undefined;

    const cleanEmails = Array.from(
      new Set(
        targetEmailsRaw
          .map((e) => e.trim().toLowerCase())
          .filter((e) => e.includes('@') && e.includes('.'))
      )
    );

    const template = PHISHING_TEMPLATES.find((t) => t.id === templateId) || PHISHING_TEMPLATES[0];
    const campaignId = `camp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // MODO REAL (RESEND OU SMTP)
    if (dispatchMode === 'RESEND' || dispatchMode === 'SMTP') {
      if (cleanEmails.length === 0) {
        return NextResponse.json(
          { error: 'Informe ao menos um e-mail válido para disparo real.' },
          { status: 400 }
        );
      }

      const recipients: PhishingRecipientTelemetry[] = [];

      for (const email of cleanEmails) {
        const token = crypto.randomBytes(16).toString('hex');
        const result = await dispatchAwarenessEmail({
          mode: dispatchMode,
          to: email,
          senderEmail,
          template,
          organization,
          trackingToken: token,
          publicBaseUrl,
          smtpConfig,
        });

        recipients.push({
          token,
          email,
          delivered: result.success,
          messageId: result.messageId,
          deliveryError: result.error,
          sentAt: result.success ? new Date().toISOString() : undefined,
        });
      }

      const deliveredCount = recipients.filter((r) => r.delivered).length;
      const failedCount = recipients.length - deliveredCount;
      const stats = recalculateRealCampaignStats(recipients, title);

      const campaign: StoredPhishingCampaign = {
        id: campaignId,
        title,
        organization,
        timestamp: new Date().toISOString(),
        templateId: template.id,
        templateTitle: template.title,
        targetEmails: cleanEmails,
        dispatchMode,
        senderEmail,
        publicBaseUrl,
        recipients,
        stats,
        status: deliveredCount > 0 ? 'IN_PROGRESS' : 'COMPLETED',
        notes: `Disparo real via ${dispatchMode} (${senderEmail}): ${deliveredCount} enviado(s), ${failedCount} falha(s). Aguardando telemetria ao vivo.`,
      };

      await savePhishingCampaign(campaign);

      return NextResponse.json({
        success: deliveredCount > 0,
        campaign,
        deliverySummary: {
          total: recipients.length,
          delivered: deliveredCount,
          failed: failedCount,
          errors: recipients
            .filter((r) => !r.delivered)
            .map((r) => `${r.email}: ${r.deliveryError || 'Erro desconhecido'}`),
        },
      });
    }

    // MODO SIMULADO OFFLINE (Estimativa Matemática)
    const totalTargeted = Math.max(1, cleanEmails.length || 10);
    let clickRate = 0.28;
    let submitRate = 0.12;
    let reportRate = 0.16;

    if (template.difficulty === 'DIFICIL') {
      clickRate = 0.45;
      submitRate = 0.22;
      reportRate = 0.08;
    } else if (template.difficulty === 'FACIL') {
      clickRate = 0.15;
      submitRate = 0.04;
      reportRate = 0.35;
    }

    const clickedCount = Math.round(totalTargeted * clickRate);
    const submittedCount = Math.round(totalTargeted * submitRate);
    const reportedCount = Math.round(totalTargeted * reportRate);

    const stats = calculateCampaignAwareness({
      totalTargeted,
      clickedCount,
      submittedCount,
      reportedCount,
    });

    const campaign: StoredPhishingCampaign = {
      id: campaignId,
      title,
      organization,
      timestamp: new Date().toISOString(),
      templateId: template.id,
      templateTitle: template.title,
      targetEmails: cleanEmails,
      dispatchMode: 'SIMULATED',
      stats,
      status: 'COMPLETED',
      notes: `Simulação estatística offline para ${totalTargeted} colaboradores (nenhum e-mail real disparado).`,
    };

    await savePhishingCampaign(campaign);

    return NextResponse.json({ success: true, campaign });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao salvar e processar campanha de conscientização.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da campanha não informado.' }, { status: 400 });
    }

    const ok = await deletePhishingCampaign(id);
    if (!ok) {
      return NextResponse.json({ error: 'Campanha não encontrada ou falha ao excluir.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao excluir campanha.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


