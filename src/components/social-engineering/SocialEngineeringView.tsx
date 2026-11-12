'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  ShieldAlert,
  Shield,
  AlertTriangle,
  Users,
  Search,
  ExternalLink,
  Lock,
  Mail,
  Building2,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  KeyRound,
  Eye,
  Globe,
  Award,
} from 'lucide-react';
import { SocialEngineeringAuditResult, CLevelExposureProfile, DarkWebBreach } from '@/core/types/social-engineering';

export default function SocialEngineeringView() {
  const [target, setTarget] = useState('devesec.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SocialEngineeringAuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedExecs, setExpandedExecs] = useState<Record<string, boolean>>({});

  const handleAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!target.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/social-engineering/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim() }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao executar auditoria OSINT');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao consultar bases de inteligência');
    } finally {
      setLoading(false);
    }
  };

  const toggleExec = (id: string) => {
    setExpandedExecs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-rose-400 bg-rose-500/10 border-rose-500/40';
    if (score >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/40';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-400 text-xs font-mono">
          <UserCheck className="w-3.5 h-3.5" />
          OSINT & Dark Web Threat Intelligence
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Engenharia Social & <span className="text-violet-400">Exposição C-Level</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Monitore o rastro digital e credenciais corporativas vazadas na Dark Web. Avalie a vulnerabilidade dos executivos
          (C-Level) a golpes direcionados de <strong>Spear Phishing, Whaling</strong> e <strong>Business Email Compromise (BEC)</strong>.
        </p>

        {/* Input Form */}
        <form onSubmit={handleAudit} className="pt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Digite o domínio ou e-mail corporativo (ex: empresa.com.br)"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white outline-none focus:border-violet-500 pl-10"
            />
            <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 transition-all shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Varrendo Dark Web...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Auditar Exposição Executiva
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Dashboard */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* Real Registration Header Banner */}
          {result.companyLegalName && (
            <div className="p-4 rounded-xl bg-slate-950 border border-violet-500/40 flex items-center justify-between flex-wrap gap-3 font-mono text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Entidade / Titular Registrado:</span>
                <span className="text-sm font-bold text-white block">{result.companyLegalName}</span>
                {result.cnpjOrCpfMasked && (
                  <span className="text-slate-400 text-xs">
                    Documento Oficial: <strong className="text-violet-300">{result.cnpjOrCpfMasked}</strong>
                  </span>
                )}
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                ✓ Fonte Oficial: {result.registrationSource}
              </span>
            </div>
          )}

          {/* Executive Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
              <span className="text-xs text-slate-400 block uppercase">Índice Geral de Exposição Digital</span>
              <div className="flex items-center gap-3">
                <span className={`text-3xl font-extrabold px-3 py-1 rounded-xl border ${getScoreColor(result.overallExposureScore)}`}>
                  {result.overallExposureScore}/100
                </span>
                <span className="text-xs text-slate-400">
                  {result.overallExposureScore >= 70 ? 'Alto Risco de BEC' : 'Exposição Moderada'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
              <span className="text-xs text-slate-400 block uppercase">Fator de Risco Whaling (C-Level)</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/40">
                  {result.whalingRiskIndex}%
                </span>
                <span className="text-xs text-rose-400">Ataques direcionados à liderança</span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
              <span className="text-xs text-slate-400 block uppercase">Bases de Vazamento Indexadas</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/40">
                  {result.totalBreachesFound}
                </span>
                <span className="text-xs text-slate-400">Compilações Dark Web com domínios correlatos</span>
              </div>
            </div>
          </div>

          {/* Executive Summary Alert Banner */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-violet-500/30 text-xs text-slate-300 leading-relaxed font-sans space-y-1">
            <div className="font-mono text-violet-400 font-bold flex items-center gap-1.5 uppercase text-xs">
              <ShieldAlert className="w-4 h-4" />
              Parecer Técnico de Inteligência OSINT
            </div>
            <p>{result.executiveSummary}</p>
          </div>

          {/* C-Level Leadership Exposure Table */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                  Mapeamento de Exposição de Cargos Estratégicos (C-Level)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {result.cLevelProfiles.length} perfis analisados
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {result.cLevelProfiles.map((prof) => {
                const isExpanded = Boolean(expandedExecs[prof.id]);
                return (
                  <div
                    key={prof.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-violet-500/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{prof.name}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                            {prof.role}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/30 text-[9px]">
                            {prof.source}
                          </span>
                        </div>
                        <div className="text-slate-400 flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            {prof.email}
                          </span>
                          {prof.documentMasked && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              Doc: {prof.documentMasked}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase">Risco Whaling</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            prof.whalingRiskFactor === 'EXTREMO'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}>
                            {prof.whalingRiskFactor}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase">Score Exposição</span>
                          <span className={`font-extrabold px-2.5 py-1 rounded-lg border ${getScoreColor(prof.exposureScore)}`}>
                            {prof.exposureScore}/100
                          </span>
                        </div>

                        <button
                          onClick={() => toggleExec(prof.id)}
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-3 animate-fadeIn">
                        <div>
                          <span className="text-slate-400 font-bold block mb-1">
                            Vetores de Ataque Spear Phishing Previstos:
                          </span>
                          <ul className="list-disc list-inside text-rose-300 space-y-0.5 font-sans text-xs">
                            {prof.spearPhishingVectors.map((v, i) => (
                              <li key={i}>{v}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-900 text-slate-300 font-sans text-xs">
                          <span className="font-mono text-emerald-400 font-bold block mb-0.5">
                            Recomendação de Mitigação:
                          </span>
                          {prof.mitigationAdvice}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dark Web Breaches List */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                  Bases de Vazamentos Dark Web & Credenciais Correlatas
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Fontes Verificadas (HIBP & Clandestine Dumps)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {result.darkWebBreaches.map((breach) => (
                <div
                  key={breach.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{breach.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      {breach.severity}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                    {breach.description}
                  </p>

                  <div className="pt-1">
                    <span className="text-[10px] text-slate-500 block mb-1">Dados Comprometidos:</span>
                    <div className="flex flex-wrap gap-1">
                      {breach.dataClasses.map((dc, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[10px]">
                          {dc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
