import { NextRequest, NextResponse } from 'next/server';
import { listPhishingCampaigns, savePhishingCampaign, StoredPhishingCampaign } from '@/core/storage/phishing-store';
import { PHISHING_TEMPLATES, calculateCampaignAwareness } from '@/modules/phishing/campaign-manager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';
    const campaigns = await listPhishingCampaigns(q);
    return NextResponse.json({ campaigns });
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
    const templateId = body.templateId || 'PHISH-PWD-RESET';
    const targetEmailsRaw = (body.targetEmails || []) as string[];

    const cleanEmails = targetEmailsRaw
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes('@') && e.includes('.'));

    const totalTargeted = Math.max(1, cleanEmails.length || 10);
    const template = PHISHING_TEMPLATES.find(t => t.id === templateId) || PHISHING_TEMPLATES[0];

    // Compute metrics based on difficulty and email count
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
      id: `camp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      organization,
      timestamp: new Date().toISOString(),
      templateId: template.id,
      templateTitle: template.title,
      targetEmails: cleanEmails,
      stats,
      status: 'COMPLETED',
      notes: `Campanha disparada para ${totalTargeted} colaboradores. ${submittedCount} credenciais teriam sido comprometidas antes do treinamento.`,
    };

    await savePhishingCampaign(campaign);

    return NextResponse.json({ success: true, campaign });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao salvar e processar campanha de conscientização.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
