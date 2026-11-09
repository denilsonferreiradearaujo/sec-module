'use client';

import React, { useState } from 'react';
import { Search, Loader2, Shield, Globe, Terminal, CheckCircle2 } from 'lucide-react';
import { UnifiedAuditReport } from '@/core/types/security';

interface UnifiedScannerFormProps {
  onScanComplete: (report: UnifiedAuditReport) => void;
}

export default function UnifiedScannerForm({ onScanComplete }: UnifiedScannerFormProps) {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [safeMode, setSafeMode] = useState<boolean>(true);

  const presets = ['google.com', 'cloudflare.com'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim() || loading) return;

    setLoading(true);
    setError(null);
    setCurrentStep('Disparando Agentes de Auditoria em Paralelo...');

    try {
      const stepTimer1 = setTimeout(() => setCurrentStep('Agente 1: Analisando Postura Web, SSL & Headers...'), 600);
      const stepTimer2 = setTimeout(() => setCurrentStep('Agente 2: Resolvendo DNS, Portas e Geolocalização...'), 1400);
      const stepTimer3 = setTimeout(() => setCurrentStep('Agente 3: Consultando Threat Intel & Feeds de Malware...'), 2200);
      const stepTimer4 = setTimeout(() => setCurrentStep('Agente Sintetizador: Consolidando Score & Plano de Remediação...'), 3000);

      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim(), safeMode }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Falha ao executar auditoria');
      }

      const report: UnifiedAuditReport = await res.json();
      onScanComplete(report);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar auditoria.';
      setError(msg);
    } finally {
      setLoading(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-surface to-surface-card border border-surface-border shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Shield className="w-3.5 h-3.5" />
            Scanner Automatizado de Superfície de Ataque & Postura
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Audite a Segurança de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300">Qualquer Alvo</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Insira uma URL, domínio institucional, IP ou perfil corporativo. Nossos sub-agentes executam
            uma varredura 360° em tempo real entregando o diagnóstico e score executivo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-500 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Digite um domínio (ex: suaempresa.com.br), IP ou URL..."
              disabled={loading}
              className="w-full pl-12 pr-36 py-4 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-white placeholder-slate-500 font-mono text-sm sm:text-base outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !target.trim()}
              className="absolute right-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditando...
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  Auditar
                </>
              )}
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400 pt-1">
            <span className="font-mono text-[11px] text-slate-500">Exemplos rápidos:</span>
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTarget(preset)}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono border border-slate-800 transition-colors"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Safe Quarantine Mode Toggle */}
          <div className="pt-2">
            <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 select-none">
              <input
                type="checkbox"
                checked={safeMode}
                onChange={(e) => setSafeMode(e.target.checked)}
                className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                🛡️ Modo de Quarentena Isolado Ativo (Não envia requisições HTTP diretas ao alvo — seguro para URLs suspeitas de malware)
              </span>
            </label>
          </div>

          {/* Live Progress indicator */}
          {loading && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-emerald-400 text-xs font-mono space-y-2 animate-pulse">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span className="font-bold">{currentStep}</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full animate-indeterminate" />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono">
              ❌ {error}
            </div>
          )}
        </form>

        {/* Feature Badges */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-8 border-t border-slate-800/80 text-center">
          <div className="p-2 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-200">Postura Web & SSL</p>
            <p className="text-[11px] text-slate-500">HSTS, CSP, Cookies</p>
          </div>
          <div className="p-2 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-200">Portas & Superfície</p>
            <p className="text-[11px] text-slate-500">TCP Scan, DNS & DMARC</p>
          </div>
          <div className="p-2 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-amber-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-200">Threat Intelligence</p>
            <p className="text-[11px] text-slate-500">URLhaus & Phishing</p>
          </div>
          <div className="p-2 space-y-1">
            <CheckCircle2 className="w-4 h-4 text-violet-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-200">OSINT Corporativo</p>
            <p className="text-[11px] text-slate-500">WHOIS & Redes Sociais</p>
          </div>
        </div>
      </div>
    </div>
  );
}
