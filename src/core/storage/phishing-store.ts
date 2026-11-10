import fs from 'fs/promises';
import path from 'path';
import { PhishingCampaignStats } from '../types/phishing';

const DATA_DIR = path.join(process.cwd(), 'data', 'phishing');

export interface StoredPhishingCampaign {
  id: string;
  title: string; // e.g. "Teste para a Empresa devesec mês Novembro 2026"
  organization: string; // e.g. "devesec"
  timestamp: string;
  templateId: string;
  templateTitle: string;
  targetEmails: string[];
  stats: PhishingCampaignStats;
  status: 'DISPATCHED' | 'COMPLETED' | 'IN_PROGRESS';
  notes?: string;
}

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function savePhishingCampaign(campaign: StoredPhishingCampaign): Promise<void> {
  await ensureDir();
  const filename = `${campaign.id}.json`;
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(campaign, null, 2), 'utf-8');
}

export async function listPhishingCampaigns(query?: string): Promise<StoredPhishingCampaign[]> {
  await ensureDir();
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    const campaigns: StoredPhishingCampaign[] = [];

    for (const f of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, f), 'utf-8');
        campaigns.push(JSON.parse(content));
      } catch {
        // ignore
      }
    }

    // Sort newest first
    campaigns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const q = (query || '').toLowerCase().trim();
    if (!q) return campaigns;

    return campaigns.filter(c =>
      c.organization.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.templateTitle.toLowerCase().includes(q)
    );
  } catch {
    return [];
  }
}
