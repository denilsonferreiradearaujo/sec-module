import fs from 'fs/promises';
import path from 'path';
import { UnifiedAuditReport } from '../types/security';

const DATA_DIR = path.join(process.cwd(), 'data', 'audits');

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // directory already exists or error
  }
}

function normalizeTarget(target: string): string {
  return target
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/[^a-z0-9.-]/g, '_');
}

export async function saveAuditReport(report: UnifiedAuditReport): Promise<void> {
  try {
    await ensureDir();
    const norm = normalizeTarget(report.target);
    const filename = `${norm}__${Date.now()}__${report.id}.json`;
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
  } catch (err) {
    console.error('Falha ao persistir relatório de auditoria:', err);
  }
}

export interface TargetAuditSummary {
  target: string;
  normalizedTarget: string;
  totalScans: number;
  firstScanDate: string;
  latestScanDate: string;
  baselineScore: number;
  latestScore: number;
  latestGrade: string;
}

export async function listUniqueTargets(query?: string): Promise<TargetAuditSummary[]> {
  await ensureDir();
  try {
    const files = await fs.readdir(DATA_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const targetMap = new Map<string, UnifiedAuditReport[]>();

    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
        const report = JSON.parse(content) as UnifiedAuditReport;
        const norm = normalizeTarget(report.target);
        if (!targetMap.has(norm)) {
          targetMap.set(norm, []);
        }
        targetMap.get(norm)!.push(report);
      } catch {
        // ignore corrupted file
      }
    }

    const summaries: TargetAuditSummary[] = [];
    const q = (query || '').toLowerCase().trim();

    for (const [norm, reports] of targetMap.entries()) {
      // Sort chronologically (oldest first)
      reports.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const first = reports[0];
      const latest = reports[reports.length - 1];

      const matches = !q || first.target.toLowerCase().includes(q) || norm.includes(q);

      if (matches) {
        summaries.push({
          target: latest.target,
          normalizedTarget: norm,
          totalScans: reports.length,
          firstScanDate: first.timestamp,
          latestScanDate: latest.timestamp,
          baselineScore: first.overallScore,
          latestScore: latest.overallScore,
          latestGrade: latest.grade,
        });
      }
    }

    // Sort by most recently scanned
    summaries.sort((a, b) => new Date(b.latestScanDate).getTime() - new Date(a.latestScanDate).getTime());
    return summaries;
  } catch (err) {
    console.error('Erro ao listar alvos de auditoria:', err);
    return [];
  }
}

export async function getBaselineAndLatest(target: string): Promise<{ baseline: UnifiedAuditReport; latest: UnifiedAuditReport; totalScans: number } | null> {
  await ensureDir();
  const norm = normalizeTarget(target);
  try {
    const files = await fs.readdir(DATA_DIR);
    const targetFiles = files.filter(f => f.startsWith(`${norm}__`) && f.endsWith('.json'));

    if (targetFiles.length === 0) return null;

    const reports: UnifiedAuditReport[] = [];
    for (const file of targetFiles) {
      try {
        const content = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
        reports.push(JSON.parse(content) as UnifiedAuditReport);
      } catch {
        // ignore
      }
    }

    if (reports.length === 0) return null;

    // Sort chronologically (oldest first)
    reports.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      baseline: reports[0],
      latest: reports[reports.length - 1],
      totalScans: reports.length,
    };
  } catch (err) {
    console.error('Erro ao recuperar laudos para o alvo:', err);
    return null;
  }
}
