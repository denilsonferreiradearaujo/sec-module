import { NextRequest, NextResponse } from 'next/server';
import {
  findCampaignByRecipientToken,
  savePhishingCampaign,
} from '@/core/storage/phishing-store';
import { recalculateRealCampaignStats } from '@/modules/phishing/campaign-manager';

export const dynamic = 'force-dynamic';

// 1x1 Transparent GIF
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = (searchParams.get('token') || '').trim();
  const event = (searchParams.get('event') || 'click').toLowerCase();

  let redirectCampaignId = '';
  let redirectTemplateId = '';

  if (token) {
    try {
      const match = await findCampaignByRecipientToken(token);
      if (match && match.campaign.recipients) {
        const { campaign, recipientIndex } = match;
        const recipients = campaign.recipients!;
        const recipient = recipients[recipientIndex];
        const now = new Date().toISOString();
        const clientIp =
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
          req.headers.get('x-real-ip') ||
          '127.0.0.1';
        const userAgent = req.headers.get('user-agent') || 'Desconhecido';

        if (!recipient.openedAt) {
          recipient.openedAt = now;
        }
        if (event === 'click' && !recipient.clickedAt) {
          recipient.clickedAt = now;
        }
        if (event === 'report' && !recipient.reportedAt) {
          recipient.reportedAt = now;
        }

        recipient.lastIp = clientIp;
        recipient.lastUserAgent = userAgent;

        campaign.stats = recalculateRealCampaignStats(recipients, campaign.title);
        campaign.status = 'IN_PROGRESS';

        await savePhishingCampaign(campaign);

        redirectCampaignId = campaign.id;
        redirectTemplateId = campaign.templateId;
      }
    } catch {
      // ignore telemetry write errors so educational redirect still succeeds
    }
  }

  if (event === 'open') {
    return new NextResponse(TRANSPARENT_GIF, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  }

  const targetUrl = new URL('/phishing/treinamento', req.url);
  if (redirectCampaignId) targetUrl.searchParams.set('camp', redirectCampaignId);
  if (redirectTemplateId) targetUrl.searchParams.set('tmpl', redirectTemplateId);
  targetUrl.searchParams.set('status', event === 'report' ? 'reported' : 'clicked');

  return NextResponse.redirect(targetUrl, { status: 302 });
}
