import { AccessPointAudit, WifiAuditReport, ConnectedDevice, DeviceCategory } from '@/core/types/wifi';
import { ChecklistItem } from '@/core/types/security';
import { resolveMacVendor, resolveMacVendorAsync } from './oui-database';

function classifyCategory(
  vendor: string,
  hostname?: string,
  type?: string,
  openPorts: number[] = []
): DeviceCategory {
  if (type === 'GATEWAY') return 'GATEWAY';

  const lowerVendor = vendor.toLowerCase();
  const lowerHost = (hostname || '').toLowerCase();

  if (
    lowerVendor.includes('sagemcom') ||
    lowerVendor.includes('cisco') ||
    lowerVendor.includes('tp-link') ||
    lowerVendor.includes('ubiquiti') ||
    lowerVendor.includes('d-link') ||
    lowerVendor.includes('mitrastar') ||
    lowerVendor.includes('technicolor')
  ) {
    if (openPorts.includes(80) || openPorts.includes(443)) return 'GATEWAY';
    return 'NETWORK_DEVICE';
  }

  if (
    openPorts.includes(9100) ||
    lowerVendor.includes('epson') ||
    lowerVendor.includes('canon') ||
    lowerVendor.includes('brother') ||
    lowerVendor.includes('xerox') ||
    (lowerVendor.includes('hp') && lowerHost.includes('print'))
  ) {
    return 'PRINTER';
  }

  if (
    lowerVendor.includes('hikvision') ||
    lowerVendor.includes('dahua') ||
    lowerVendor.includes('espressif') ||
    lowerVendor.includes('tuya') ||
    lowerVendor.includes('sonoff') ||
    lowerVendor.includes('intelbras')
  ) {
    return 'IOT_CAMERA';
  }

  if (
    openPorts.includes(135) ||
    openPorts.includes(445) ||
    openPorts.includes(3389) ||
    lowerVendor.includes('dell') ||
    lowerVendor.includes('intel') ||
    lowerVendor.includes('lenovo') ||
    lowerVendor.includes('hp') ||
    lowerVendor.includes('clevo') ||
    lowerVendor.includes('giga-byte') ||
    lowerHost.includes('desktop') ||
    lowerHost.includes('laptop') ||
    lowerHost.includes('notebook') ||
    lowerHost.includes('pc') ||
    lowerHost.includes('macbook') ||
    lowerHost.includes('imac')
  ) {
    return 'WORKSTATION';
  }

  if (
    openPorts.includes(62078) ||
    lowerVendor.includes('apple') ||
    lowerVendor.includes('samsung') ||
    lowerVendor.includes('xiaomi') ||
    lowerVendor.includes('motorola') ||
    lowerVendor.includes('mac privado') ||
    lowerHost.includes('iphone') ||
    lowerHost.includes('ipad') ||
    lowerHost.includes('galaxy') ||
    lowerHost.includes('android')
  ) {
    return 'MOBILE';
  }

  return 'OTHER';
}

export async function enrichWifiAuditReportAsync(report: WifiAuditReport): Promise<WifiAuditReport> {
  if (!report.connectedDevices || report.connectedDevices.length === 0) return report;

  const updatedDevices = await Promise.all(
    report.connectedDevices.map(async (dev) => {
      let vendor = dev.vendor;
      if (!vendor || vendor === 'Dispositivo de Rede Genérico' || vendor === 'Fabricante Desconhecido') {
        vendor = await resolveMacVendorAsync(dev.mac);
      }
      const category =
        dev.category && dev.category !== 'OTHER'
          ? dev.category
          : classifyCategory(vendor || '', dev.hostname, dev.type, dev.openPorts || []);
      return { ...dev, vendor, category };
    })
  );

  return {
    ...report,
    connectedDevices: updatedDevices,
  };
}

export function parseWifiProbeResult(rawJson: unknown): WifiAuditReport {
  const data = rawJson as Record<string, unknown>;
  const rawAps = (data.accessPoints || []) as AccessPointAudit[];

  const accessPoints: AccessPointAudit[] = rawAps.map((ap, idx) => ({
    bssid: ap.bssid || `00:11:22:33:44:${idx.toString(16).padStart(2, '0')}`,
    ssid: ap.ssid || '<REDE_OCULTA>',
    channel: Number(ap.channel) || 1,
    signalStrength: Number(ap.signalStrength) || -70,
    encryption: ap.encryption || 'WPA2-CCMP',
    wpsEnabled: Boolean(ap.wpsEnabled),
    clientsCount: Number(ap.clientsCount) || 0,
    handshakeCaptured: Boolean(ap.handshakeCaptured),
    vulnerabilityStatus: ap.vulnerabilityStatus || (ap.encryption === 'OPEN' || ap.encryption === 'WEP' ? 'CRITICAL' : 'SECURE'),
    notes: Array.isArray(ap.notes) ? ap.notes : [],
  }));

  let vulnerableCount = 0;
  for (const ap of accessPoints) {
    if (ap.vulnerabilityStatus === 'CRITICAL' || ap.vulnerabilityStatus === 'HIGH') {
      vulnerableCount++;
    }
  }

  // Parse connected devices & enrich with vendor lookup & category
  const rawDevices = Array.isArray(data.connectedDevices) ? data.connectedDevices : [];
  const connectedDevices: ConnectedDevice[] = rawDevices.map((d: Record<string, unknown>) => {
    const mac = String(d.mac || '');
    const vendor = (d.vendor as string) || resolveMacVendor(mac);
    const hostname = d.hostname ? String(d.hostname) : undefined;
    const type = (d.type as 'GATEWAY' | 'DEVICE' | 'BROADCAST' | 'MULTICAST') || 'DEVICE';
    const openPorts = Array.isArray(d.openPorts) ? (d.openPorts as number[]) : [];
    const providedCategory = d.category as DeviceCategory | undefined;
    const category =
      providedCategory && providedCategory !== 'OTHER'
        ? providedCategory
        : classifyCategory(vendor, hostname, type, openPorts);

    return {
      ip: String(d.ip || ''),
      mac,
      type,
      hostname,
      vendor,
      category,
      openPorts,
      isApIsolationVulnerable: Boolean(d.isApIsolationVulnerable ?? (type !== 'GATEWAY')),
    };
  });

  // Check AP Isolation effectiveness
  const isTested = Boolean(data.apIsolationTested ?? true);
  const clientDevices = connectedDevices.filter(d => d.type !== 'GATEWAY');
  const isEffective = Boolean(data.apIsolationEffective ?? (clientDevices.length <= 1));

  // Count exposed admin panels (e.g. gateway with port 80/443 open)
  const exposedAdminPanelsCount = connectedDevices.filter(d =>
    d.openPorts && (d.openPorts.includes(80) || d.openPorts.includes(443))
  ).length;

  // Calculate score (penalize vulnerable APs and missing AP isolation if other clients visible)
  let score = 100;
  score -= vulnerableCount * 25;
  if (!isEffective && clientDevices.length > 1) {
    score -= 15; // Penalty for lack of client isolation
  }
  score = Math.max(0, Math.min(100, score));

  let grade: WifiAuditReport['wifiGrade'] = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 50) grade = 'C';
  else grade = 'F';

  // Build checklist items
  const checklist: ChecklistItem[] = [
    {
      id: 'CHK-WIFI-ENCRYPT',
      category: 'Criptografia Sem Fio',
      title: 'Ausência de Redes Abertas ou Cifras Obsoletas (WEP/TKIP)',
      standard: 'CIS Wireless 1.1 / WPA3 Alliance',
      status: vulnerableCount === 0 ? 'PASSED' : 'FAILED',
      details: vulnerableCount === 0
        ? 'Todas as redes locais auditadas utilizam cifras modernas (WPA2-AES ou WPA3).'
        : `${vulnerableCount} redes detectadas operando em modo aberto ou com criptografia legada.`,
      impact: 'Redes abertas ou com WEP/TKIP permitem interceptação direta de senhas e tráfego corporativo.',
      recommendation: vulnerableCount === 0 ? undefined : 'Migre imediatamente para WPA2-AES (CCMP) ou WPA3 e desabilite suporte a WEP.',
    },
    {
      id: 'CHK-WIFI-WPS',
      category: 'Proteção de Roteador',
      title: 'Desativação do Protocolo WPS (Wi-Fi Protected Setup)',
      standard: 'NIST SP 800-153 / Reaver Pixie Dust',
      status: accessPoints.some(ap => ap.wpsEnabled) ? 'FAILED' : 'PASSED',
      details: accessPoints.some(ap => ap.wpsEnabled)
        ? 'Roteadores identificados com WPS ativado. Risco de quebra de PIN via força bruta (Pixie Dust).'
        : 'WPS desabilitado em todos os pontos de acesso corporativos.',
      impact: 'O WPS permite que invasores obtenham a senha do Wi-Fi em poucos segundos explorando falha no PIN de 8 dígitos.',
      recommendation: 'Desabilite a função WPS nas configurações de administração dos roteadores/APs.',
    },
    {
      id: 'CHK-WIFI-ISOLATION',
      category: 'Segmentação de Rede',
      title: 'Isolamento de Clientes na Rede Wi-Fi (AP Client Isolation)',
      standard: 'ISO 27001 A.13.1.3 / CIS Wireless 2.4',
      status: isEffective ? 'PASSED' : 'FAILED',
      details: isEffective
        ? 'Isolamento de clientes ativo ou sem tráfego lateral detectado entre estações.'
        : `${clientDevices.length} dispositivos comunicando-se livremente no mesmo segmento Wi-Fi sem isolamento de AP.`,
      impact: 'A ausência de AP Isolation permite que notebooks de visitantes infectados ou atacantes interceptem tráfego (ARP Spoofing) e ataquem outras máquinas na mesma rede.',
      recommendation: isEffective
        ? undefined
        : 'Habilite a função "AP Isolation" ou "Client Isolation" no roteador/AP ou segregue visitantes em uma VLAN isolada.',
    },
  ];

  if (exposedAdminPanelsCount > 0) {
    checklist.push({
      id: 'CHK-WIFI-ADMIN-EXPOSED',
      category: 'Gerenciamento de Rede',
      title: 'Proteção do Painel Administrativo do Roteador',
      standard: 'CIS Controls 4.1 / NIST SP 800-153',
      status: 'FAILED',
      details: `${exposedAdminPanelsCount} equipamento(s) com porta web administrativa (80/443) exposta diretamente aos usuários do Wi-Fi.`,
      impact: 'Permite tentativas de login na administração do roteador ou exploração de falhas de firmware por qualquer cliente conectado.',
      recommendation: 'Restrinja o acesso à interface de gerenciamento apenas à porta LAN física cabeada ou a uma VLAN restrita de TI.',
    });
  }

  const recommendations = [
    'Substituir qualquer roteador com suporte exclusivo a WEP por equipamentos com suporte a WPA2 Enterprise ou WPA3.',
    'Criar uma VLAN isolada para a rede de visitantes, separada dos servidores de arquivos e sistemas corporativos.',
    'Trocar senhas pré-compartilhadas (PSK) a cada 90 dias ou sempre que um colaborador da equipe for desligado.',
    'Desativar o recurso WPS (Wi-Fi Protected Setup) em todos os access points.',
    'Ativar "AP Isolation" nas redes Wi-Fi públicas ou de visitantes para impedir movimentação lateral de malwares.',
  ];

  // Parse connected network info
  const rawConnNet = data.connectedNetwork as Record<string, unknown> | undefined;
  const connectedNetwork = rawConnNet
    ? {
        ssid: String(rawConnNet.ssid || ''),
        bssid: String(rawConnNet.bssid || ''),
        signalStrength: Number(rawConnNet.signalStrength) || 0,
        channel: Number(rawConnNet.channel) || 0,
        radioType: rawConnNet.radioType ? String(rawConnNet.radioType) : undefined,
        authType: rawConnNet.authType ? String(rawConnNet.authType) : undefined,
        cipher: rawConnNet.cipher ? String(rawConnNet.cipher) : undefined,
        rxRateMbps: rawConnNet.rxRateMbps ? Number(rawConnNet.rxRateMbps) : undefined,
        txRateMbps: rawConnNet.txRateMbps ? Number(rawConnNet.txRateMbps) : undefined,
        profileName: rawConnNet.profileName ? String(rawConnNet.profileName) : undefined,
      }
    : undefined;

  const primarySsid =
    (data.primarySsid as string) ||
    connectedNetwork?.ssid ||
    accessPoints[0]?.ssid ||
    'Rede Wi-Fi';

  return {
    id: `wifi-scan-${Date.now()}`,
    timestamp: (data.timestamp as string) || new Date().toISOString(),
    clientCompany: (data.clientCompany as string) || 'Cliente Auditado',
    primarySsid,
    interfaceUsed: (data.interfaceUsed as string) || 'Wi-Fi 802.11',
    adapterMac: data.adapterMac ? String(data.adapterMac) : undefined,
    connectedNetwork,
    connectedDevices,
    totalConnectedDevices: connectedDevices.length,
    apIsolationTested: isTested,
    apIsolationEffective: isEffective,
    exposedAdminPanelsCount,
    captureDurationSeconds: Number(data.captureDurationSeconds) || 10,
    totalAccessPoints: accessPoints.length,
    vulnerableAccessPoints: vulnerableCount,
    wifiScore: score,
    wifiGrade: grade,
    accessPoints,
    checklist,
    recommendations,
  };
}
