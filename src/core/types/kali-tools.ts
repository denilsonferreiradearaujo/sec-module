import { SeverityLevel, SecurityFinding } from './security';

export interface KaliToolOption {
  id: 'nmap' | 'nikto' | 'gobuster' | 'nuclei' | 'sqlmap';
  name: string;
  category: 'REDE' | 'SERVIDOR' | 'ARQUIVOS' | 'VULNERABILIDADES' | 'BANCO_DADOS';
  description: string;
  enabled: boolean;
  intensity?: 'safe' | 'balanced' | 'deep';
}

export interface KaliArsenalConfig {
  nmap: boolean;
  nikto: boolean;
  gobuster: boolean;
  nuclei: boolean;
  sqlmap: boolean;
  intensity: 'safe' | 'balanced' | 'deep';
  customParameters?: string;
}

export interface KaliArsenalResult {
  engineName: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  mode: 'CLI_NATIVE' | 'TYPESCRIPT_FALLBACK';
  rawOutput?: string;
  findings: SecurityFinding[];
  details?: Record<string, unknown>;
}

export interface KaliScanAggregation {
  enginesExecuted: string[];
  totalArsenalFindings: number;
  arsenalScoreImpact: number;
  results: Record<string, KaliArsenalResult>;
}
