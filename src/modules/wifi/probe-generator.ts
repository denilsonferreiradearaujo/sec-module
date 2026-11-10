export interface WifiProbeScriptOptions {
  clientCompany?: string;
  serverUrl?: string; // e.g. "http://localhost:3000" or production URL
  autoSend?: boolean;
}

export function generateWifiProbePowerShellScript(options?: WifiProbeScriptOptions): string {
  const company = options?.clientCompany || 'Cliente Corporativo';
  const serverUrl = options?.serverUrl || 'http://localhost:3000';
  const autoSend = options?.autoSend ?? true;

  return `# ==============================================================================
# DEV & SEC — CYBER INTELLIGENCE & HARDENING
# SCRIPT DE AUDITORIA DE REDES SEM FIO (WINDOWS POWERSHELL NATIVO)
# Execucao Direta no Windows sem Dependencias Extras
# Cliente: ${company}
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "[+] Iniciando Auditoria Wi-Fi Dev & Sec no Windows..." -ForegroundColor Cyan
Write-Host "[+] Cliente: ${company}" -ForegroundColor Gray

# 1. Verificar interface Wi-Fi ativa
$interfaceInfo = netsh wlan show interfaces
if ($interfaceInfo -match "State\\s+:\\s+connected|disconnected") {
    Write-Host "[+] Placa Wi-Fi detectada com sucesso." -ForegroundColor Green
} else {
    Write-Host "[-] Nenhuma placa de rede sem fio ativa encontrada no Windows." -ForegroundColor Red
    exit 1
}

Write-Host "[+] Coletando informacoes de redes do ambiente via WLAN API..." -ForegroundColor Cyan
$rawNetworks = netsh wlan show networks mode=bssid

$aps = @()
$currentSsid = ""
$currentAuth = ""
$currentCipher = ""
$currentBssid = ""
$currentSignal = -70
$currentChannel = 1
$currentRadio = ""

foreach ($line in ($rawNetworks -split "\`r?\`n")) {
    $line = $line.Trim()

    if ($line -match "^SSID \\d+\\s+:\\s*(.*)$") {
        $currentSsid = $matches[1].Trim()
        if ([string]::IsNullOrWhiteSpace($currentSsid)) { $currentSsid = "<REDE_OCULTA>" }
    }
    elseif ($line -match "^Network type\\s+:\\s*(.*)$") {
        # Infrastructure
    }
    elseif ($line -match "^Authentication\\s+:\\s*(.*)$") {
        $currentAuth = $matches[1].Trim()
    }
    elseif ($line -match "^Encryption\\s+:\\s*(.*)$") {
        $currentCipher = $matches[1].Trim()
    }
    elseif ($line -match "^BSSID \\d+\\s+:\\s*(.*)$") {
        $currentBssid = $matches[1].Trim()
    }
    elseif ($line -match "^Signal\\s+:\\s*(\\d+)%") {
        $pct = [int]$matches[1]
        # Convert % to approx dBm
        $currentSignal = [int](($pct / 2) - 100)
    }
    elseif ($line -match "^Radio type\\s+:\\s*(.*)$") {
        $currentRadio = $matches[1].Trim()
    }
    elseif ($line -match "^Channel\\s+:\\s*(\\d+)") {
        $currentChannel = [int]$matches[1]

        # Classify encryption & risk
        $encryption = "WPA2-CCMP"
        $vuln = "SECURE"
        $notes = @()

        if ($currentAuth -match "Open" -or $currentCipher -match "None") {
            $encryption = "OPEN"
            $vuln = "CRITICAL"
            $notes += "Rede aberta sem qualquer criptografia. Trafego vulneravel a interceptacao e MITM."
        }
        elseif ($currentAuth -match "WEP" -or $currentCipher -match "WEP") {
            $encryption = "WEP"
            $vuln = "CRITICAL"
            $notes += "Criptografia WEP obsoleta e insegura."
        }
        elseif ($currentCipher -match "TKIP") {
            $encryption = "WPA-TKIP"
            $vuln = "HIGH"
            $notes += "Cifra WPA-TKIP vulneravel a ataques Beck-Tews."
        }
        elseif ($currentAuth -match "WPA3" -or $currentAuth -match "SAE") {
            $encryption = "WPA3-SAE"
            $vuln = "SECURE"
            $notes += "Padrao moderno WPA3 ativo."
        }
        elseif ($currentAuth -match "Enterprise" -or $currentAuth -match "802.1X") {
            $encryption = "ENTERPRISE"
            $vuln = "SECURE"
            $notes += "Rede corporativa com autenticacao 802.1X/RADIUS."
        }

        if (-not [string]::IsNullOrWhiteSpace($currentBssid)) {
            $aps += [PSCustomObject]@{
                bssid = $currentBssid
                ssid = $currentSsid
                channel = $currentChannel
                signalStrength = $currentSignal
                encryption = $encryption
                wpsEnabled = $false
                clientsCount = 1
                handshakeCaptured = $false
                vulnerabilityStatus = $vuln
                notes = $notes
            }
        }
    }
}

$outputObj = [PSCustomObject]@{
    clientCompany = "${company}"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    interfaceUsed = "Wi-Fi (Windows Native WLAN API)"
    captureDurationSeconds = 10
    accessPoints = $aps
}

$jsonOutput = $outputObj | ConvertTo-Json -Depth 5
$jsonOutput | Out-File -FilePath "devesec-wifi-result.json" -Encoding UTF8

Write-Host "[+] Diagnostico concluido com sucesso! ($($aps.Count) pontos de acesso identificados)" -ForegroundColor Green
Write-Host "[+] Arquivo 'devesec-wifi-result.json' salvo localmente." -ForegroundColor Gray

${autoSend ? `
# Envio automatico direto para a plataforma Dev & Sec
try {
    Write-Host "[+] Transmitindo telemetria da auditoria para a Dev & Sec Suite..." -ForegroundColor Cyan
    $headers = @{ "Content-Type" = "application/json" }
    $res = Invoke-RestMethod -Uri "${serverUrl}/api/wifi-audit" -Method Post -Body $jsonOutput -Headers $headers -TimeoutSec 10
    Write-Host "[OK] Laudo enviado com sucesso para a plataforma!" -ForegroundColor Green
    Write-Host "[OK] Score Wi-Fi Calculado: $($res.wifiScore)/100 (Nota $($res.wifiGrade))" -ForegroundColor Yellow
} catch {
    Write-Host "[!] Envio automatico falhou: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "[!] Faca o upload manual de 'devesec-wifi-result.json' no painel." -ForegroundColor Gray
}
` : ''}
`;
}

export function generateWifiProbeBashScript(options?: WifiProbeScriptOptions): string {
  const company = options?.clientCompany || 'Cliente Corporativo';
  const serverUrl = options?.serverUrl || 'http://localhost:3000';
  const autoSend = options?.autoSend ?? true;

  return `#!/usr/bin/env bash
# ==============================================================================
# DEV & SEC — CYBER INTELLIGENCE & HARDENING
# SCRIPT DE AUDITORIA DE REDES SEM FIO (KALI LINUX / WIFITE + AIRCRACK-NG)
# Cliente: ${company}
# ==============================================================================

set -e

OUTPUT_FILE="devesec-wifi-result.json"
echo "[+] Iniciando Auditoria Wi-Fi Dev & Sec..."
echo "[+] Verificando ferramentas instaladas (aircrack-ng, wifite, iw)..."

if ! command -v airodump-ng &> /dev/null; then
    echo "[-] Aircrack-ng suite nao encontrada. Instale com: sudo apt update && sudo apt install -y aircrack-ng wifite"
    exit 1
fi

WIFI_IFACE=$(iw dev | awk '$1=="Interface"{print $2}' | head -n 1)

if [ -z "$WIFI_IFACE" ]; then
    echo "[-] Nenhuma placa de rede sem fio (Wi-Fi) detectada no sistema."
    exit 1
fi

echo "[+] Interface Wi-Fi detectada: $WIFI_IFACE"
echo "[+] Ativando modo monitor..."
sudo airmon-ng check kill > /dev/null 2>&1 || true
sudo airmon-ng start "$WIFI_IFACE" > /dev/null 2>&1 || true

MON_IFACE=$(iw dev | awk '$1=="Interface"{print $2}' | grep -E 'mon' | head -n 1)
if [ -z "$MON_IFACE" ]; then
    MON_IFACE="$WIFI_IFACE"
fi

echo "[+] Coletando informacoes de redes por 25 segundos..."
TEMP_CSV="/tmp/devesec_dump"
sudo timeout 25 airodump-ng --output-format csv -w "$TEMP_CSV" "$MON_IFACE" > /dev/null 2>&1 || true

echo "[+] Desativando modo monitor..."
sudo airmon-ng stop "$MON_IFACE" > /dev/null 2>&1 || true
sudo systemctl restart NetworkManager > /dev/null 2>&1 || true

echo "[+] Processando resultados para formato Dev & Sec JSON..."

python3 - << 'EOF'
import csv
import json
import glob
import os
from datetime import datetime

csv_files = glob.glob("/tmp/devesec_dump-*.csv")
if not csv_files:
    print("[-] Nenhum arquivo de captura gerado.")
    exit(0)

latest_csv = max(csv_files, key=os.path.getctime)
aps = []

with open(latest_csv, 'r', errors='ignore') as f:
    lines = f.readlines()

for line in lines:
    line = line.strip()
    if not line or "BSSID" in line:
        continue
    if "Station MAC" in line:
        break
    
    parts = [p.strip() for p in line.split(',')]
    if len(parts) >= 14:
        bssid = parts[0]
        channel = int(parts[3]) if parts[3].isdigit() else 1
        privacy = parts[5].strip()
        cipher = parts[6].strip()
        auth = parts[7].strip()
        power = int(parts[8]) if parts[8].replace('-', '').isdigit() else -80
        ssid = parts[13].strip() or "<REDE_OCULTA>"

        encryption = "WPA2-CCMP"
        vuln = "SECURE"
        notes = []

        if "OPN" in privacy or "OPEN" in privacy:
            encryption = "OPEN"
            vuln = "CRITICAL"
            notes.append("Rede aberta sem qualquer criptografia. Trafego vulneravel a sniffer e MITM.")
        elif "WEP" in privacy:
            encryption = "WEP"
            vuln = "CRITICAL"
            notes.append("Criptografia WEP obsoleta e quebrada instantaneamente via IVs.")
        elif "TKIP" in cipher:
            encryption = "WPA-TKIP"
            vuln = "HIGH"
            notes.append("Cifra WPA-TKIP vulneravel a ataques Beck-Tews.")
        elif "WPA3" in privacy or "SAE" in auth:
            encryption = "WPA3-SAE"
            vuln = "SECURE"
            notes.append("Padrao moderno WPA3 com criptografia individual robusta.")
        elif "MGT" in auth:
            encryption = "ENTERPRISE"
            vuln = "SECURE"
            notes.append("Rede corporativa com autenticacao 802.1X/RADIUS.")

        aps.append({
            "bssid": bssid,
            "ssid": ssid,
            "channel": channel,
            "signalStrength": power,
            "encryption": encryption,
            "wpsEnabled": "WPS" in privacy,
            "clientsCount": 1,
            "handshakeCaptured": False,
            "vulnerabilityStatus": vuln,
            "notes": notes
        })

output_data = {
    "clientCompany": "${company}",
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "interfaceUsed": os.environ.get("WIFI_IFACE", "wlan0"),
    "captureDurationSeconds": 25,
    "accessPoints": aps
}

with open("devesec-wifi-result.json", "w") as out:
    json.dump(output_data, out, indent=2)

print(f"[+] Arquivo 'devesec-wifi-result.json' gerado ({len(aps)} redes identificadas)!")
EOF

${autoSend ? `
# Envio automatico direto para a plataforma Dev & Sec
if command -v curl &> /dev/null; then
    echo "[+] Transmitindo telemetria da auditoria para a Dev & Sec Suite..."
    curl -s -X POST -H "Content-Type: application/json" -d @devesec-wifi-result.json "${serverUrl}/api/wifi-audit" > /dev/null && echo "[OK] Laudo enviado com sucesso para a plataforma!" || echo "[!] Falha no envio automatico. Faca upload manual."
fi
` : ''}
`;
}
