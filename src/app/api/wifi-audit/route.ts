import { NextRequest, NextResponse } from 'next/server';
import { parseWifiProbeResult } from '@/modules/wifi/parser';
import { generateWifiProbeBashScript, generateWifiProbePowerShellScript } from '@/modules/wifi/probe-generator';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const WIFI_DATA_DIR = path.join(process.cwd(), 'data', 'wifi');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || !body.accessPoints) {
      return NextResponse.json(
        { error: 'Arquivo JSON inválido. O formato gerado pelo agente Dev & Sec Wi-Fi Probe deve conter a lista "accessPoints".' },
        { status: 400 }
      );
    }

    const report = parseWifiProbeResult(body);

    // Save telemetry to data/wifi/
    try {
      await fs.mkdir(WIFI_DATA_DIR, { recursive: true });
      await fs.writeFile(
        path.join(WIFI_DATA_DIR, `${report.id}.json`),
        JSON.stringify(report, null, 2),
        'utf-8'
      );
    } catch {
      // ignore
    }

    return NextResponse.json(report);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao processar arquivo de auditoria Wi-Fi.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get('company') || 'Cliente Corporativo';
  const osType = (searchParams.get('os') || searchParams.get('type') || 'linux').toLowerCase();

  // Extract base URL for direct auto-telemetry transmission
  const origin = req.nextUrl.origin || 'http://localhost:3000';

  if (osType === 'windows' || osType === 'ps1') {
    const script = generateWifiProbePowerShellScript({
      clientCompany: company,
      serverUrl: origin,
      autoSend: true,
    });

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="devesec-wifi-probe.ps1"',
      },
    });
  }

  const script = generateWifiProbeBashScript({
    clientCompany: company,
    serverUrl: origin,
    autoSend: true,
  });

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'text/x-shellscript; charset=utf-8',
      'Content-Disposition': 'attachment; filename="devesec-wifi-probe.sh"',
    },
  });
}
