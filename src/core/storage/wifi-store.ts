import fs from 'fs/promises';
import path from 'path';
import { WifiAuditReport } from '../types/wifi';

const WIFI_DIR = path.join(process.cwd(), 'data', 'wifi');

async function ensureDir() {
  try {
    await fs.mkdir(WIFI_DIR, { recursive: true });
  } catch {
    // exists
  }
}

function normalizeSsid(ssid?: string): string {
  if (!ssid) return 'rede-wifi';
  return ssid
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .slice(0, 30);
}

export interface WifiAuditSummary {
  id: string;
  ssid: string;
  clientCompany?: string;
  timestamp: string;
  wifiScore: number;
  wifiGrade: string;
  interfaceUsed: string;
  totalAccessPoints: number;
  totalConnectedDevices: number;
}

export async function saveWifiAuditReport(report: WifiAuditReport): Promise<void> {
  await ensureDir();
  try {
    const ssid = normalizeSsid(report.primarySsid || report.connectedNetwork?.ssid);
    const filename = `${ssid}__${Date.now()}__${report.id}.json`;
    await fs.writeFile(path.join(WIFI_DIR, filename), JSON.stringify(report, null, 2), 'utf-8');
  } catch (err) {
    console.error('Erro ao persistir auditoria Wi-Fi:', err);
  }
}

export async function listWifiAudits(): Promise<WifiAuditSummary[]> {
  await ensureDir();
  try {
    const files = await fs.readdir(WIFI_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    const summaries: WifiAuditSummary[] = [];
    for (const file of jsonFiles) {
      try {
        const content = await fs.readFile(path.join(WIFI_DIR, file), 'utf-8');
        const report = JSON.parse(content) as WifiAuditReport;
        summaries.push({
          id: report.id,
          ssid: report.primarySsid || report.connectedNetwork?.ssid || 'Rede Wi-Fi',
          clientCompany: report.clientCompany,
          timestamp: report.timestamp,
          wifiScore: report.wifiScore,
          wifiGrade: report.wifiGrade,
          interfaceUsed: report.interfaceUsed,
          totalAccessPoints: report.totalAccessPoints,
          totalConnectedDevices: report.totalConnectedDevices || report.connectedDevices?.length || 0,
        });
      } catch {
        // ignore corrupted
      }
    }

    // Sort by most recent first
    summaries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return summaries;
  } catch (err) {
    console.error('Erro ao listar auditorias Wi-Fi:', err);
    return [];
  }
}

export async function getWifiAuditById(id: string): Promise<WifiAuditReport | null> {
  await ensureDir();
  try {
    const files = await fs.readdir(WIFI_DIR);
    const targetFile = files.find(f => f.includes(id) && f.endsWith('.json'));
    if (!targetFile) return null;

    const content = await fs.readFile(path.join(WIFI_DIR, targetFile), 'utf-8');
    return JSON.parse(content) as WifiAuditReport;
  } catch {
    return null;
  }
}

export async function getLatestWifiAudit(): Promise<WifiAuditReport | null> {
  await ensureDir();
  try {
    const files = await fs.readdir(WIFI_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    if (jsonFiles.length === 0) return null;

    let latestReport: WifiAuditReport | null = null;
    let latestTime = 0;

    for (const file of jsonFiles) {
      try {
        const timeMatch = file.match(/__(\d+)__/);
        let time = 0;
        if (timeMatch) {
          time = parseInt(timeMatch[1], 10);
        } else {
          const stat = await fs.stat(path.join(WIFI_DIR, file));
          time = stat.mtimeMs;
        }

        if (time > latestTime) {
          const content = await fs.readFile(path.join(WIFI_DIR, file), 'utf-8');
          latestReport = JSON.parse(content) as WifiAuditReport;
          latestTime = time;
        }
      } catch {
        // ignore
      }
    }

    return latestReport;
  } catch {
    return null;
  }
}

export async function deleteWifiAudit(id: string): Promise<boolean> {
  await ensureDir();
  try {
    const files = await fs.readdir(WIFI_DIR);
    const targetFiles = files.filter(f => f.includes(id) && f.endsWith('.json'));
    for (const file of targetFiles) {
      await fs.unlink(path.join(WIFI_DIR, file));
    }
    return true;
  } catch (err) {
    console.error('Erro ao excluir auditoria Wi-Fi:', err);
    return false;
  }
}
