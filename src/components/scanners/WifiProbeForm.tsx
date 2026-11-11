'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  Download,
  Upload,
  Printer,
  Check,
  Radio,
  Send,
  Cpu,
  Router,
  Smartphone,
  Trash2,
  X,
  History,
  Activity,
  Layers,
  ArrowRight,
  RefreshCw,
  Server,
  Laptop,
  Camera,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { WifiAuditReport, ConnectedDevice, DeviceCategory } from '@/core/types/wifi';
import { WifiAuditSummary } from '@/core/storage/wifi-store';

export default function WifiProbeForm() {
  const [clientCompany, setClientCompany] = useState('Cliente Corporativo');
  const [selectedOS, setSelectedOS] = useState<'windows' | 'linux'>('windows');
  const [report, setReport] = useState<WifiAuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // History state
  const [history, setHistory] = useState<WifiAuditSummary[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Live polling state: tracks the last known audit ID so new probe executions trigger instant reload
  const lastKnownReportIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef<boolean>(false);

  // Load history list & populate known IDs
  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/wifi-audit?action=list');
      if (res.ok) {
        const data: WifiAuditSummary[] = await res.json();
        setHistory(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();

    // Initialize baseline latest report ID on mount
    fetch('/api/wifi-audit?action=latest')
      .then((r) => r.json())
      .then((latest: WifiAuditReport | null) => {
        lastKnownReportIdRef.current = latest?.id || 'none';
        isInitializedRef.current = true;
      })
      .catch(() => {
        isInitializedRef.current = true;
      });
  }, []);

  // Real-time Live Telemetry Polling (every 2 seconds when waiting for script execution)
  useEffect(() => {
    if (report) return; // don't poll while viewing a report

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/wifi-audit?action=latest');
        if (!res.ok) return;
        const latest: WifiAuditReport | null = await res.json();
        if (!latest || !latest.id) return;

        // If not initialized yet, record baseline
        if (!isInitializedRef.current) {
          lastKnownReportIdRef.current = latest.id;
          isInitializedRef.current = true;
          return;
        }

        // If a NEW report arrived that is different from what we previously knew:
        if (lastKnownReportIdRef.current && latest.id !== lastKnownReportIdRef.current) {
          lastKnownReportIdRef.current = latest.id;
          setReport(latest);
          loadHistory();
        }
      } catch {
        // network silent
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [report]);

  const handleBackToScan = () => {
    if (report?.id) {
      lastKnownReportIdRef.current = report.id;
    }
    setReport(null);
  };

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
        ? `cd "$env:USERPROFILE\\Downloads"; powershell -ExecutionPolicy Bypass -File .\\devesec-wifi-probe.ps1`
        : `cd ~/Downloads && chmod +x devesec-wifi-probe.sh && sudo ./devesec-wifi-probe.sh`;

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
      lastKnownReportIdRef.current = auditReport.id;
      setReport(auditReport);
      loadHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Arquivo inválido. Certifique-se de subir o "devesec-wifi-result.json".';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAudit = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wifi-audit?action=get&id=${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error('Não foi possível carregar a auditoria selecionada.');
      const data: WifiAuditReport = await res.json();
      lastKnownReportIdRef.current = data.id;
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao abrir auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAudit = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the report
    setDeletingId(id);
    try {
      const res = await fetch(`/api/wifi-audit?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setHistory((prev) => prev.filter((item) => item.id !== id));
        if (report?.id === id) {
          handleBackToScan();
        }
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
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
          Como redes Wi-Fi operam por radiofrequência (RF) no local físico, nossa suíte disponibiliza o
          <strong> Dev & Sec Wi-Fi Probe</strong> nativo para <strong>Windows (sem instalar nada)</strong> e <strong>Kali Linux (Wifite + Aircrack-ng)</strong>.
          O script detecta a placa Wi-Fi, diagnostica pontos de acesso no ambiente, mapeia aparelhos conectados e <strong>transmite tudo em tempo real para este painel</strong>.
        </p>
      </div>

      {!report ? (
        <div className="space-y-8">
          {/* Main Action Grid */}
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
                        ? 'cd "$env:USERPROFILE\\Downloads"; powershell -ExecutionPolicy Bypass -File .\\devesec-wifi-probe.ps1'
                        : 'cd ~/Downloads && chmod +x devesec-wifi-probe.sh && sudo ./devesec-wifi-probe.sh'}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center">
                      2
                    </span>
                    <h3 className="text-base font-bold text-white">Recepção de Telemetria Ao Vivo</h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Ao Vivo
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono">
                    <Send className="w-3.5 h-3.5 animate-pulse" />
                    Transmissão Automática Conectada:
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Assim que você rodar o comando no PowerShell do notebook, a telemetria será enviada via HTTP e
                    <strong> este painel atualizará na mesma hora</strong> exibindo o diagnóstico completo, placa detectada e aparelhos na rede.
                  </p>
                </div>

                <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-5 text-center space-y-2 bg-slate-950/40 transition-colors">
                  <Upload className="w-6 h-6 text-cyan-400 mx-auto" />
                  <div>
                    <label className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs cursor-pointer inline-flex items-center gap-2 transition-colors">
                      <span>Upload manual devesec-wifi-result.json</span>
                      <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Caso o notebook estivesse desconectado da internet</p>
                  </div>
                </div>

                {error && <p className="text-rose-400 text-xs font-mono">❌ {error}</p>}
              </div>

              <div className="text-[11px] text-slate-500 font-mono text-center">
                Avaliação de conformidade sem fio CIS Wireless, WPA3, WPS e AP Isolation.
              </div>
            </div>
          </div>

          {/* Step 3: Historical Audits Section with Delete 'X' */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                  Histórico de Redes Wi-Fi Auditadas (Salvas por SSID)
                </h3>
              </div>
              <button
                onClick={loadHistory}
                disabled={loadingHistory}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-xs font-mono flex items-center gap-1 transition-colors"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center text-slate-500 font-mono text-xs space-y-1">
                <p>Nenhuma auditoria Wi-Fi registrada no histórico até o momento.</p>
                <p className="text-[11px] text-slate-600">
                  Execute o script no PowerShell para coletar e salvar a primeira rede automaticamente.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectAudit(item.id)}
                    className="group relative p-4 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all space-y-2.5 shadow-sm"
                  >
                    {/* Delete "X" Button in upper-right corner */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteAudit(e, item.id)}
                      disabled={deletingId === item.id}
                      className="absolute top-2.5 right-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-1 rounded-lg transition-all"
                      title="Excluir auditoria do histórico"
                    >
                      {deletingId === item.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>

                    <div className="flex items-center gap-2 pr-6">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-white block truncate group-hover:text-cyan-300 transition-colors">
                          {item.ssid}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block truncate">
                          {item.clientCompany || 'Auditoria Wi-Fi'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                      <div>
                        <span className="block text-slate-500">Score</span>
                        <span className="font-bold text-white text-xs">
                          {item.wifiScore}/100 ({item.wifiGrade})
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-500">APs</span>
                        <span className="font-bold text-slate-200 text-xs">{item.totalAccessPoints}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500">Aparelhos</span>
                        <span className="font-bold text-slate-200 text-xs">{item.totalConnectedDevices}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <span>{new Date(item.timestamp).toLocaleString('pt-BR')}</span>
                      <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-0.5">
                        Ver laudo <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Report View */
        <div className="space-y-6">
          {/* Action bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-surface border border-surface-border no-print">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Rede Auditada:</span>
                <span className="text-sm font-bold text-cyan-400 font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                  {report.primarySsid || report.connectedNetwork?.ssid || 'Rede Wi-Fi'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">Cliente:</span>
                <span className="text-xs font-bold text-white font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {report.clientCompany}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackToScan}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all"
              >
                ← Voltar / Novo Scan
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

          {/* Diagnostic Metadata Badges: Hardware Card & Connected Network */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Wireless Card Hardware */}
            <div className="p-4 rounded-xl bg-surface border border-surface-border flex items-center gap-3.5">
              <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Placa Wi-Fi Detectada no Host
                </span>
                <span className="text-sm font-bold text-white block truncate">
                  {report.interfaceUsed || 'Intel Dual Band Wireless-AC 8265'}
                </span>
                {report.adapterMac && (
                  <span className="text-[11px] font-mono text-cyan-400">
                    MAC: {report.adapterMac}
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Connected Network */}
            <div className="p-4 rounded-xl bg-surface border border-surface-border flex items-center gap-3.5">
              <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Wifi className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Conexão Wi-Fi Ativa Durante o Teste
                </span>
                {report.connectedNetwork ? (
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-emerald-400">
                      {report.connectedNetwork.ssid}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      Canal {report.connectedNetwork.channel}
                    </span>
                    {report.connectedNetwork.radioType && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {report.connectedNetwork.radioType}
                      </span>
                    )}
                    {report.connectedNetwork.signalStrength > 0 && (
                      <span className="text-[10px] font-mono text-slate-400">
                        Sinal: {report.connectedNetwork.signalStrength}%
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Desconectado ou em modo monitor promíscuo</span>
                )}
              </div>
            </div>
          </div>

          {/* Hero Score */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-surface to-surface-card border border-surface-border grid grid-cols-1 md:grid-cols-12 gap-6 items-center print-avoid-break">
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-2">Score de Segurança Wi-Fi</span>
              <div className="w-24 h-24 rounded-full border-4 border-cyan-500 bg-cyan-500/10 flex flex-col items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
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

          {/* Connected Devices Table (Aparelhos Conectados na Rede) */}
          {report.connectedDevices && report.connectedDevices.length > 0 && (
            <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-5 print-avoid-break">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-emerald-400">
                    Inventário de Aparelhos Conectados na Rede Local ({report.connectedDevices.length})
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                  {report.apIsolationEffective ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      AP Isolation: Ativo (Conforme)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 font-bold">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      AP Isolation: Desativado (Risco Lateral)
                    </span>
                  )}
                  {report.exposedAdminPanelsCount && report.exposedAdminPanelsCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {report.exposedAdminPanelsCount} Painel(is) Web Exposto(s)
                    </span>
                  ) : null}
                </div>
              </div>

              {/* AP Isolation Notice Card */}
              {!report.apIsolationEffective && report.connectedDevices.length > 1 && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-slate-200 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-rose-400 block font-mono">
                      Alerta de Conformidade CIS Wireless / ISO 27001 (AP Isolation Desativado):
                    </span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Foram detectados múltiplos dispositivos comunicando-se diretamente entre si no Wi-Fi. Em redes corporativas ou de visitantes,
                      a ausência de <strong>Client Isolation</strong> permite que computadores infectados ou atacantes na mesma rede façam varreduras de portas, ataques de ARP Spoofing e disseminação lateral de malwares.
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-2.5">Dispositivo / Hostname</th>
                      <th className="p-2.5">Endereço IP</th>
                      <th className="p-2.5">Fabricante (OUI) & MAC</th>
                      <th className="p-2.5">Categoria</th>
                      <th className="p-2.5">Portas de Gerência</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {report.connectedDevices.map((dev, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            {dev.category === 'GATEWAY' || dev.type === 'GATEWAY' ? (
                              <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <Router className="w-3.5 h-3.5" />
                              </div>
                            ) : dev.category === 'WORKSTATION' ? (
                              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                <Laptop className="w-3.5 h-3.5" />
                              </div>
                            ) : dev.category === 'MOBILE' ? (
                              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Smartphone className="w-3.5 h-3.5" />
                              </div>
                            ) : dev.category === 'PRINTER' ? (
                              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Printer className="w-3.5 h-3.5" />
                              </div>
                            ) : dev.category === 'IOT_CAMERA' ? (
                              <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                <Camera className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                                <Activity className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div>
                              <span className="font-bold text-white block">
                                {dev.hostname || dev.ip}
                              </span>
                              {dev.hostname && (
                                <span className="text-[10px] text-slate-500 block">
                                  {dev.type === 'GATEWAY' ? 'Gateway do Roteador' : 'Dispositivo Local'}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 font-bold text-cyan-400">{dev.ip}</td>
                        <td className="p-2.5">
                          <span className="text-white block font-semibold truncate max-w-[180px]">
                            {dev.vendor || 'Fabricante Desconhecido'}
                          </span>
                          <span className="text-[10px] text-slate-500 block">{dev.mac}</span>
                        </td>
                        <td className="p-2.5">
                          {dev.type === 'GATEWAY' || dev.category === 'GATEWAY' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              Roteador / Gateway
                            </span>
                          ) : dev.category === 'WORKSTATION' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Estação / PC
                            </span>
                          ) : dev.category === 'MOBILE' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Dispositivo Móvel
                            </span>
                          ) : dev.category === 'PRINTER' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Impressora
                            </span>
                          ) : dev.category === 'IOT_CAMERA' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              Câmera IP / IoT
                            </span>
                          ) : dev.category === 'NETWORK_DEVICE' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                              Equipamento de Rede
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              Dispositivo Conectado
                            </span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {dev.openPorts && dev.openPorts.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {dev.openPorts.map((port) => (
                                <span
                                  key={port}
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                                    port === 80 || port === 443
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : port === 445 || port === 3389
                                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                  }`}
                                  title={`Porta ${port} aberta`}
                                >
                                  {port === 80
                                    ? '80 (HTTP)'
                                    : port === 443
                                    ? '443 (HTTPS)'
                                    : port === 445
                                    ? '445 (SMB)'
                                    : port === 22
                                    ? '22 (SSH)'
                                    : port === 3389
                                    ? '3389 (RDP)'
                                    : port}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Sem portas abertas</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right">
                          <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Online
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Access Points Table */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4 print-avoid-break">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-cyan-400 pb-2 border-b border-surface-border">
              Inventário de Pontos de Acesso & Criptografia no Alcance ({report.totalAccessPoints})
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
