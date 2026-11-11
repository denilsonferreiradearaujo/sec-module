import { SeverityLevel, ChecklistItem } from './security';

export type DeviceCategory =
  | 'GATEWAY'
  | 'WORKSTATION'
  | 'MOBILE'
  | 'PRINTER'
  | 'IOT_CAMERA'
  | 'NETWORK_DEVICE'
  | 'OTHER';

export interface ConnectedDevice {
  ip: string;
  mac: string;
  type?: 'GATEWAY' | 'DEVICE' | 'BROADCAST' | 'MULTICAST';
  hostname?: string;
  vendor?: string;
  category?: DeviceCategory;
  openPorts?: number[];
  isApIsolationVulnerable?: boolean;
}

export interface ConnectedNetworkInfo {
  ssid: string;
  bssid: string;
  signalStrength: number;
  channel: number;
  radioType?: string;
  authType?: string;
  cipher?: string;
  rxRateMbps?: number;
  txRateMbps?: number;
  profileName?: string;
}

export interface AccessPointAudit {
  bssid: string;
  ssid: string;
  channel: number;
  signalStrength: number; // dBm (ex: -65)
  encryption: 'OPEN' | 'WEP' | 'WPA-TKIP' | 'WPA2-CCMP' | 'WPA3-SAE' | 'ENTERPRISE';
  wpsEnabled: boolean;
  wpsLocked?: boolean;
  wpsVersion?: string;
  clientsCount: number;
  apIsolationEnabled?: boolean;
  handshakeCaptured: boolean;
  vulnerabilityStatus: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'SECURE';
  notes: string[];
}

export interface WifiAuditReport {
  id: string;
  timestamp: string;
  clientCompany?: string;
  primarySsid?: string; // Main audited network SSID
  auditorName?: string;
  interfaceUsed: string; // e.g. "Intel(R) Dual Band Wireless-AC 8265"
  adapterMac?: string;
  connectedNetwork?: ConnectedNetworkInfo;
  connectedDevices?: ConnectedDevice[];
  totalConnectedDevices?: number;
  apIsolationTested?: boolean;
  apIsolationEffective?: boolean;
  exposedAdminPanelsCount?: number;
  captureDurationSeconds: number;
  totalAccessPoints: number;
  vulnerableAccessPoints: number;
  wifiScore: number; // 0 - 100
  wifiGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  accessPoints: AccessPointAudit[];
  checklist: ChecklistItem[];
  recommendations: string[];
}
