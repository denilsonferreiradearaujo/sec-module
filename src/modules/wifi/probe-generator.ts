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

# 1. Verificar interface Wi-Fi ativa e coletar dados da placa / conexao
$interfaceInfo = netsh wlan show interfaces
$cardDescription = ""
$adapterMac = ""
$connSsid = ""
$connBssid = ""
$connRadio = ""
$connChannel = 0
$connSignal = 0
$connAuth = ""
$connCipher = ""
$connRx = 0
$connTx = 0

foreach ($line in ($interfaceInfo -split "\`r?\`n")) {
    $t = $line.Trim()
    if ($t -match "^(Descri|Description)[^:]*:\\s*(.+)$") {
        if ([string]::IsNullOrWhiteSpace($cardDescription)) { $cardDescription = $matches[2].Trim() }
    }
    elseif ($t -match "^(Endere|Physical address)[^:]*:\\s*(.+)$") {
        if ([string]::IsNullOrWhiteSpace($adapterMac)) { $adapterMac = $matches[2].Trim() }
    }
    elseif ($t -match "^SSID[^:]*:\\s*(.+)$") {
        if ([string]::IsNullOrWhiteSpace($connSsid)) { $connSsid = $matches[1].Trim() }
    }
    elseif ($t -match "^BSSID[^:]*:\\s*(.+)$") {
        if ([string]::IsNullOrWhiteSpace($connBssid)) { $connBssid = $matches[1].Trim() }
    }
    elseif ($t -match "^(Radio type|Tipo de r.dio)[^:]*:\\s*(.+)$") {
        if ([string]::IsNullOrWhiteSpace($connRadio)) { $connRadio = $matches[2].Trim() }
    }
    elseif ($t -match "^(Autenti|Authentication)[^:]*:\\s*(.+)$") {
        if ([string]::IsNullOrWhiteSpace($connAuth)) { $connAuth = $matches[2].Trim() }
    }
    elseif ($t -match "^(Codifica|Criptografia|Encryption|Cipher)[^:]*:\\s*(.+)$") {
        if ([string]::IsNullOrWhiteSpace($connCipher)) { $connCipher = $matches[2].Trim() }
    }
    elseif ($t -match "^(Canal|Channel)\\s*:\\s*(\\d+)") {
        if ($connChannel -eq 0) { $connChannel = [int]$matches[2] }
    }
    elseif ($t -match "^(Sinal|Signal)\\s*:\\s*(\\d+)%") {
        if ($connSignal -eq 0) { $connSignal = [int]$matches[2] }
    }
    elseif ($t -match "^(Taxa de recep|Receive rate).*\\s*:\\s*([\\d\\.]+)") {
        if ($connRx -eq 0) { $connRx = [double]$matches[2] }
    }
    elseif ($t -match "^(Taxa de transmiss|Transmit rate).*\\s*:\\s*([\\d\\.]+)") {
        if ($connTx -eq 0) { $connTx = [double]$matches[2] }
    }
}

if ([string]::IsNullOrWhiteSpace($cardDescription)) {
    if ($interfaceInfo -match "(State|Estado)\\s*:\\s*(connected|disconnected|Conectado|Desconectado)" -or $interfaceInfo -match "GUID\\s*:" -or $interfaceInfo -match "Wi-Fi") {
        $cardDescription = "Placa de Rede Sem Fio 802.11"
    } else {
        Write-Host "[-] Nenhuma placa de rede sem fio ativa encontrada no Windows." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[+] Placa Wi-Fi detectada: $cardDescription ($adapterMac)" -ForegroundColor Green
if (-not [string]::IsNullOrWhiteSpace($connSsid)) {
    Write-Host "[+] Conectado a rede: $connSsid (BSSID: $connBssid | Canal: $connChannel | Sinal: $connSignal%)" -ForegroundColor Cyan
}

# 2. Descobrir aparelhos conectados na rede local (Hostnames, Portas, Gateway)
Write-Host "[+] Mapeando aparelhos conectados na sub-rede local..." -ForegroundColor Cyan
$devices = @()
$seenIps = @{}

# Descobrir IP local do host na interface ativa da rota padrao (Wi-Fi)
$localHostIp = ""
try {
    $defRoute = Get-NetRoute -DestinationPrefix '0.0.0.0/0' | Select-Object -First 1
    if ($defRoute) {
        $localHostIp = (Get-NetIPAddress -InterfaceIndex $defRoute.InterfaceIndex -AddressFamily IPv4 | Select-Object -First 1).IPAddress
    }
} catch {}

# Adicionar o Host do Auditor se encontrado
if ($localHostIp -and -not [string]::IsNullOrWhiteSpace($adapterMac)) {
    $seenIps[$localHostIp] = $true
    $devices += [PSCustomObject]@{
        ip = $localHostIp
        mac = $adapterMac.ToLower()
        type = "DEVICE"
        hostname = $env:COMPUTERNAME
        category = "WORKSTATION"
        openPorts = @()
        isApIsolationVulnerable = $false
    }
}

# Descobrir vizinhos via ARP e resolver hostnames / portas
$rawArp = arp -a
foreach ($line in ($rawArp -split "\`r?\`n")) {
    $t = $line.Trim()
    if ($t -match "^(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})\\s+([0-9a-fA-F\\-]{17})\\s+(\\S+)") {
        $ip = $matches[1]
        $mac = $matches[2].Replace("-", ":").ToLower()
        if ($ip -notmatch "^(224\\.|239\\.|255\\.)" -and $ip -notmatch "\\.255$" -and -not $seenIps.ContainsKey($ip)) {
            $seenIps[$ip] = $true
            $devType = "DEVICE"
            $cat = "OTHER"
            if ($ip -match "\\.1$" -or ($connBssid -and $mac.StartsWith($connBssid.Substring(0, 8).ToLower()))) {
                $devType = "GATEWAY"
                $cat = "GATEWAY"
            }

            # Resolução de Hostname via DNS reverso
            $hostName = ""
            try {
                $dnsEntry = [System.Net.Dns]::GetHostEntry($ip)
                if ($dnsEntry -and $dnsEntry.HostName) { $hostName = $dnsEntry.HostName }
            } catch {}

            # Checagem não-invasiva de portas de gerenciamento (80, 443, 445, 22, 3389)
            $openPorts = @()
            $portsToCheck = @(80, 443, 445, 22, 3389)
            foreach ($p in $portsToCheck) {
                try {
                    $tcp = New-Object System.Net.Sockets.TcpClient
                    $ar = $tcp.BeginConnect($ip, $p, $null, $null)
                    $wait = $ar.AsyncWaitHandle.WaitOne(120, $false)
                    if ($wait -and $tcp.Connected) {
                        $openPorts += $p
                    }
                    $tcp.Close()
                } catch {}
            }

            $devices += [PSCustomObject]@{
                ip = $ip
                mac = $mac
                type = $devType
                hostname = $hostName
                category = $cat
                openPorts = $openPorts
                isApIsolationVulnerable = ($devType -ne "GATEWAY")
            }
        }
    }
}

# Avaliar Isolamento de Clientes (AP Isolation)
$clientDevicesCount = ($devices | Where-Object { $_.type -ne "GATEWAY" -and $_.ip -ne $localHostIp }).Count
$apIsolationEffective = ($clientDevicesCount -eq 0)

Write-Host "[+] Dispositivos ativos identificados na rede: $($devices.Count)" -ForegroundColor Gray
foreach ($d in $devices) {
    $infoExtra = ""
    if ($d.hostname) { $infoExtra += " ($($d.hostname))" }
    if ($d.openPorts.Count -gt 0) { $infoExtra += " [Portas: $($d.openPorts -join ',')]" }
    Write-Host "    - [$($d.type)] $($d.ip) - MAC: $($d.mac)$infoExtra" -ForegroundColor Gray
}

# 3. Coletar informacoes de redes do ambiente via WLAN API
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

    if ($line -match "^SSID \\d+\\s*:\\s*(.*)$") {
        $currentSsid = $matches[1].Trim()
        if ([string]::IsNullOrWhiteSpace($currentSsid)) { $currentSsid = "<REDE_OCULTA>" }
    }
    elseif ($line -match "^(Network type|Tipo de rede)\\s*:\\s*(.*)$") {
        # Infrastructure
    }
    elseif ($line -match "^(Authentication|Autentica|Autenticacion).*\\s*:\\s*(.*)$") {
        $currentAuth = $matches[2].Trim()
    }
    elseif ($line -match "^(Encryption|Criptografia|Codifica|Cifrado).*\\s*:\\s*(.*)$") {
        $currentCipher = $matches[2].Trim()
    }
    elseif ($line -match "^BSSID \\d+\\s*:\\s*(.*)$") {
        $currentBssid = $matches[1].Trim()
    }
    elseif ($line -match "^(Signal|Sinal|Senal).*\\s*:\\s*(\\d+)%") {
        $pct = [int]$matches[2]
        # Convert % to approx dBm
        $currentSignal = [int](($pct / 2) - 100)
    }
    elseif ($line -match "^(Radio type|Tipo de r.dio).*\\s*:\\s*(.*)$") {
        $currentRadio = $matches[2].Trim()
    }
    elseif ($line -match "^(Channel|Canal)\\s*:\\s*(\\d+)") {
        $currentChannel = [int]$matches[2]

        # Classify encryption & risk
        $encryption = "WPA2-CCMP"
        $vuln = "SECURE"
        $notes = @()

        if ($currentAuth -match "Open|Aberta" -or $currentCipher -match "None|Nenhuma") {
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
        elseif ($currentAuth -match "WPA3|SAE") {
            $encryption = "WPA3-SAE"
            $vuln = "SECURE"
            $notes += "Padrao moderno WPA3 ativo."
        }
        elseif ($currentAuth -match "Enterprise|802.1X") {
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

$connectedNetObj = $null
if (-not [string]::IsNullOrWhiteSpace($connSsid)) {
    $connectedNetObj = [PSCustomObject]@{
        ssid = $connSsid
        bssid = $connBssid
        signalStrength = $connSignal
        channel = $connChannel
        radioType = $connRadio
        authType = $connAuth
        cipher = $connCipher
        rxRateMbps = $connRx
        txRateMbps = $connTx
    }
}

$outputObj = [PSCustomObject]@{
    clientCompany = "${company}"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    primarySsid = $connSsid
    interfaceUsed = $cardDescription
    adapterMac = $adapterMac
    connectedNetwork = $connectedNetObj
    connectedDevices = $devices
    apIsolationTested = [bool](-not [string]::IsNullOrWhiteSpace($connSsid))
    apIsolationEffective = $apIsolationEffective
    captureDurationSeconds = 10
    accessPoints = $aps
}

$jsonOutput = $outputObj | ConvertTo-Json -Depth 5
$jsonOutput | Out-File -FilePath "devesec-wifi-result.json" -Encoding UTF8

Write-Host "[+] Diagnostico concluido com sucesso! ($($aps.Count) pontos de acesso identificados)" -ForegroundColor Green
Write-Host "[+] Arquivo 'devesec-wifi-result.json' salvo localmente." -ForegroundColor Gray

${autoSend ? `
# Envio automatico direto para a plataforma Dev & Sec com fallback
Write-Host "[+] Transmitindo telemetria da auditoria para a Dev & Sec Suite..." -ForegroundColor Cyan
$headers = @{ "Content-Type" = "application/json" }
$targetEndpoints = @(
    "${serverUrl}/api/wifi-audit",
    "http://localhost:3000/api/wifi-audit",
    "http://localhost:3001/api/wifi-audit"
) | Select-Object -Unique

$sent = $false
foreach ($endpoint in $targetEndpoints) {
    try {
        $res = Invoke-RestMethod -Uri $endpoint -Method Post -Body $jsonOutput -Headers $headers -TimeoutSec 5
        Write-Host "[OK] Laudo transmitido com sucesso para a plataforma ($endpoint)!" -ForegroundColor Green
        Write-Host "[OK] Score Wi-Fi Calculado: $($res.wifiScore)/100 (Nota $($res.wifiGrade))" -ForegroundColor Yellow
        $sent = $true
        break
    } catch {
        # tentar proximo endpoint
    }
}

if (-not $sent) {
    Write-Host "[!] Envio automatico falhou: Verifique se o servidor Dev & Sec esta em execucao." -ForegroundColor Yellow
    Write-Host "[!] Faca o upload manual do arquivo 'devesec-wifi-result.json' no painel." -ForegroundColor Gray
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
