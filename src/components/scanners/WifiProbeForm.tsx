'use client';

import React, { useState } from 'react';
import {
  Wifi,
  Download,
  Upload,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Printer,
  Check,
  Radio,
  Sparkles,
  Send,
} from 'lucide-react';
import { WifiAuditReport } from '@/core/types/wifi';

export default function WifiProbeForm() {
  const [clientCompany, setClientCompany] = useState('Cliente Corporativo');
  const [selectedOS, setSelectedOS] = useState<'windows' | 'linux'>('windows');
  const [report, setReport] = useState<WifiAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const downloadProbeScript = () => {
    const isWin = selectedOS === 'windows';
    const ext = isWin ? 'ps1' : 'sh';
    const osParam = isWin ? 'windows' : 'linux';
    const url = `/api/wifi-audit?company=${encodeURIComponent(clientCompany)}&os=${osParam}`;

    const link = document.createElement('a');
    link.href = url;
    link.download = `devesec-wifi-probe.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyExecutionCommand = () => {
    const cmd =
      selectedOS === 'windows'
        ? `powershell -ExecutionPolicy Bypass -File .\\devesec-wifi-probe.ps1`
        : `chmod +x devesec-wifi-probe.sh && sudo ./devesec-wifi-probe.sh`;

    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch('/api/wifi-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Falha ao processar arquivo de auditoria Wi-Fi.');
      }

      const auditReport: WifiAuditReport = await res.json();
      setReport(auditReport);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Arquivo inválido. Certifique-se de subir o "devesec-wifi-result.json".';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Wifi className="w-3.5 h-3.5" />
          Módulo de Auditoria Wi-Fi Multiplataforma (Windows PowerShell + Kali Linux)
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Auditoria de Segurança de <span className="text-cyan-400">Redes Locais & Wi-Fi</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Como redes Wi-Fi transmitem ondas de rádio (RF) que operam no local físico da empresa, nossa suíte disponibiliza o
          <strong> Dev & Sec Wi-Fi Probe</strong> compatível tanto com <strong>Windows nativo (sem instalar nada)</strong> quanto com <strong>Kali Linux (Wifite + Aircrack-ng)</strong>.
          O script coleta o inventário e pode transmitir a telemetria automaticamente para a plataforma!
        </p>
      </div>

      {!report ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Step 1: Download & Run Probe */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center">
                    1
                  </span>
                  <h3 className="text-base font-bold text-white">Escolha o Sistema do Auditor</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                  Telemetria Direta Ativa
                </span>
              </div>

              {/* OS Tabs */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedOS('windows')}
                  className={`py-2 px-3 rounded-lg font-bold transition-all ${
                    selectedOS === 'windows'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Windows (PowerShell)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOS('linux')}
                  className={`py-2 px-3 rounded-lg font-bold transition-all ${
                    selectedOS === 'linux'
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Kali Linux (Bash / Wifite)
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-slate-300 font-semibold block">Nome da Empresa do Cliente:</label>
                <input
                  type="text"
                  value={clientCompany}
                  onChange={(e) => setClientCompany(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs outline-none focus:border-cyan-500"
                />
              </div>

              {/* Execution Instructions */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-xs">
                <span className="text-slate-400 block text-[11px] font-bold">
                  {selectedOS === 'windows' ? 'Comando no PowerShell (Admin ou Usuário):' : 'Comando no Terminal Kali Linux:'}
                </span>
                <div className="flex items-center justify-between text-slate-300 bg-slate-900/90 p-2 rounded border border-slate-800">
                  <code className="text-cyan-400 text-[11px] truncate">
                    {selectedOS === 'windows'
                      ? 'powershell -ExecutionPolicy Bypass -File .\\devesec-wifi-probe.ps1'
                      : 'chmod +x devesec-wifi-probe.sh && sudo ./devesec-wifi-probe.sh'}
                  </code>
                  <button
                    onClick={copyExecutionCommand}
                    className="text-slate-400 hover:text-white ml-2 p-1 text-[11px] shrink-0 font-bold"
                    title="Copiar comando"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : 'Copiar'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {selectedOS === 'windows'
                    ? '✨ Utiliza a WLAN API nativa do Windows: não requer placas especiais nem drivers extras!'
                    : '⚡ Orquestra Wifite e Aircrack-ng com modo monitor e captura 802.11.'}
                </p>
              </div>
            </div>

            <button
              onClick={downloadProbeScript}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Download className="w-4 h-4" />
              Baixar Script ({selectedOS === 'windows' ? 'devesec-wifi-probe.ps1' : 'devesec-wifi-probe.sh'})
            </button>
          </div>

          {/* Step 2: Telemetry & Manual Upload */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-base font-bold text-white">Recepção de Dados (Telemetria ou Upload)</h3>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono">
                  <Send className="w-3.5 h-3.5" />
                  Envio Automático Habilitado:
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Ao rodar o script no notebook, ele enviará os resultados <strong>automaticamente via HTTP direto para esta plataforma</strong>.
                  Caso o notebook esteja desconectado da internet durante a varredura, faça o upload manual abaixo.
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 text-center space-y-2 bg-slate-950/40 transition-colors">
                <Upload className="w-7 h-7 text-cyan-400 mx-auto" />
                <div>
                  <label className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs cursor-pointer inline-flex items-center gap-2 transition-colors">
                    <span>Selecionar devesec-wifi-result.json</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Ou arraste o arquivo gerado</p>
                </div>
              </div>

              {error && <p className="text-rose-400 text-xs font-mono">❌ {error}</p>}
            </div>

            <div className="text-[11px] text-slate-500 font-mono text-center">
              Avaliação de conformidade sem fio CIS Wireless, WPA3, WPS e AP Isolation.
            </div>
          </div>
        </div>
      ) : (
        /* Report View */
        <div className="space-y-6">
          {/* Action bar */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-surface-border no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400">Cliente Auditado:</span>
              <span className="text-sm font-bold text-white font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                {report.clientCompany}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setReport(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
              >
                Nova Auditoria Wi-Fi
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
              >
                <Printer className="w-4 h-4" />
                Imprimir Laudo Wi-Fi (PDF)
              </button>
            </div>
          </div>

          {/* Hero Score */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-surface to-surface-card border border-surface-border grid grid-cols-1 md:grid-cols-12 gap-6 items-center print-avoid-break">
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-2">Score de Segurança Wi-Fi</span>
              <div className="w-24 h-24 rounded-full border-4 border-cyan-500 bg-cyan-500/10 flex flex-col items-center justify-center text-cyan-400">
                <span className="text-3xl font-extrabold font-mono">{report.wifiGrade}</span>
                <span className="text-xs font-mono">{report.wifiScore}/100</span>
              </div>
              <p className="text-xs text-slate-400 mt-3 font-mono">
                {report.totalAccessPoints} Pontos de Acesso Auditados
              </p>
            </div>

            <div className="md:col-span-8 space-y-4">
              <h3 className="text-xl font-bold text-white">
                Diagnóstico de Segurança de Redes Sem Fio
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Foram identificados <strong>{report.vulnerableAccessPoints} pontos de acesso vulneráveis</strong> com risco de interceptação ou quebra de credenciais.
              </p>

              {/* Checklist */}
              <div className="space-y-2">
                {report.checklist.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        {item.status === 'PASSED' ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400">
                            CONFORME
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400">
                            NÃO CONFORME
                          </span>
                        )}
                        <span className="font-bold text-white">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Access Points Table */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4 print-avoid-break">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-cyan-400 pb-2 border-b border-surface-border">
              Inventário de Pontos de Acesso & Criptografia (802.11)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="p-2.5">SSID (Nome da Rede)</th>
                    <th className="p-2.5">BSSID (MAC)</th>
                    <th className="p-2.5">Canal</th>
                    <th className="p-2.5">Criptografia</th>
                    <th className="p-2.5">WPS</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {report.accessPoints.map((ap, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-2.5 font-bold text-white">{ap.ssid}</td>
                      <td className="p-2.5 text-slate-400">{ap.bssid}</td>
                      <td className="p-2.5 text-slate-300">{ap.channel}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ap.encryption === 'OPEN' || ap.encryption === 'WEP'
                            ? 'bg-rose-500/20 text-rose-400'
                            : ap.encryption === 'WPA-TKIP'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {ap.encryption}
                        </span>
                      </td>
                      <td className="p-2.5">
                        {ap.wpsEnabled ? (
                          <span className="text-rose-400 font-bold">ATIVO</span>
                        ) : (
                          <span className="text-slate-500">Desabilitado</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        {ap.vulnerabilityStatus === 'CRITICAL' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400">
                            CRÍTICO
                          </span>
                        ) : ap.vulnerabilityStatus === 'HIGH' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400">
                            ALTO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                            SEGURO
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
