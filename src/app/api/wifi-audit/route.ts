import { NextRequest, NextResponse } from 'next/server';
import { parseWifiProbeResult } from '@/modules/wifi/parser';
import { generateWifiProbeBashScript, generateWifiProbePowerShellScript } from '@/modules/wifi/probe-generator';
import {
  saveWifiAuditReport,
  listWifiAudits,
  getWifiAuditById,
  getLatestWifiAudit,
  deleteWifiAudit,
} from '@/core/storage/wifi-store';

export const dynamic = 'force-dynamic';

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

    // Save telemetry to data/wifi/ indexed by SSID
    await saveWifiAuditReport(report);

    return NextResponse.json(report);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao processar arquivo de auditoria Wi-Fi.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  // 1. Historical list
  if (action === 'list') {
    const list = await listWifiAudits();
    return NextResponse.json(list);
  }

  // 2. Latest audit report (used for live auto-refresh)
  if (action === 'latest') {
    const latest = await getLatestWifiAudit();
    return NextResponse.json(latest || null);
  }

  // 3. Specific report by id
  if (action === 'get') {
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID da auditoria não informado.' }, { status: 400 });
    }
    const report = await getWifiAuditById(id);
    if (!report) {
      return NextResponse.json({ error: 'Auditoria não encontrada.' }, { status: 404 });
    }
    return NextResponse.json(report);
  }

  // 4. Download probe script
  const company = searchParams.get('company') || 'Cliente Corporativo';
  const osType = (searchParams.get('os') || searchParams.get('type') || 'windows').toLowerCase();

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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do laudo não informado.' }, { status: 400 });
    }

    const ok = await deleteWifiAudit(id);
    if (!ok) {
      return NextResponse.json({ error: 'Falha ao excluir o laudo Wi-Fi.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Falha ao excluir o laudo.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
