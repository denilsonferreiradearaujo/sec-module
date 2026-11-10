import { SeverityLevel, ChecklistItem } from './security';

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
  auditorName?: string;
  interfaceUsed: string;
  captureDurationSeconds: number;
  totalAccessPoints: number;
  vulnerableAccessPoints: number;
  wifiScore: number; // 0 - 100
  wifiGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  accessPoints: AccessPointAudit[];
  checklist: ChecklistItem[];
  recommendations: string[];
}
