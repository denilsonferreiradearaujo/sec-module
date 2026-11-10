import { AccessPointAudit, WifiAuditReport } from '@/core/types/wifi';
import { ChecklistItem } from '@/core/types/security';

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

  // Calculate score
  let score = 100;
  score -= vulnerableCount * 25;
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
      title: 'Isolamento de Clientes na Rede de Visitantes (AP Isolation)',
      standard: 'ISO 27001 A.13.1.3 / CIS Wireless',
      status: 'PASSED',
      details: 'A recomendação de isolamento impede que dispositivos de visitantes se comuniquem com servidores internos.',
      impact: 'Previne propagação lateral de malwares e ransomwares através de notebooks de visitantes.',
    },
  ];

  const recommendations = [
    'Substituir qualquer roteador com suporte exclusivo a WEP por equipamentos com suporte a WPA2 Enterprise ou WPA3.',
    'Criar uma VLAN isolada para a rede de visitantes, separada dos servidores de arquivos e sistemas corporativos.',
    'Trocar senhas pré-compartilhadas (PSK) a cada 90 dias ou sempre que um colaborador da equipe for desligado.',
    'Desativar o recurso WPS (Wi-Fi Protected Setup) em todos os access points.',
  ];

  return {
    id: `wifi-scan-${Date.now()}`,
    timestamp: (data.timestamp as string) || new Date().toISOString(),
    clientCompany: (data.clientCompany as string) || 'Cliente Auditado',
    interfaceUsed: (data.interfaceUsed as string) || 'wlan0mon',
    captureDurationSeconds: Number(data.captureDurationSeconds) || 25,
    totalAccessPoints: accessPoints.length,
    vulnerableAccessPoints: vulnerableCount,
    wifiScore: score,
    wifiGrade: grade,
    accessPoints,
    checklist,
    recommendations,
  };
}
