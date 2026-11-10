'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Sparkles,
  RefreshCw,
  Search,
  Database,
  Calendar,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import { UnifiedAuditReport } from '@/core/types/security';
import { compareAudits } from '@/core/scoring/comparator';
import { AuditComparisonResult } from '@/core/types/comparator';
import { TargetAuditSummary } from '@/core/storage/audit-store';

interface AuditComparatorViewProps {
  initialBaseline?: UnifiedAuditReport;
  initialLatest?: UnifiedAuditReport;
}

export default function AuditComparatorView({ initialBaseline, initialLatest }: AuditComparatorViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [targetSuggestions, setTargetSuggestions] = useState<TargetAuditSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [totalScansFound, setTotalScansFound] = useState<number>(0);

  const [baselineJson, setBaselineJson] = useState('');
  const [latestJson, setLatestJson] = useState('');
  const [comparison, setComparison] = useState<AuditComparisonResult | null>(
    initialBaseline && initialLatest ? compareAudits(initialBaseline, initialLatest) : null
  );
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualModeOpen, setManualModeOpen] = useState(false);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search targets as user types
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/comparator/targets?q=${encodeURIComponent(searchTerm.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setTargetSuggestions(data.targets || []);
          if (searchTerm.trim().length > 0) {
            setShowDropdown(true);
          }
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchTerm]);

  // Initial load: show recent targets
  useEffect(() => {
    fetch('/api/comparator/targets')
      .then(r => r.json())
      .then(d => setTargetSuggestions(d.targets || []))
      .catch(() => {});
  }, []);

  const selectTargetForCompare = async (target: string) => {
    setSelectedTarget(target);
    setShowDropdown(false);
    setSearchTerm(target);
    setLoadingCompare(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch(`/api/comparator/compare?target=${encodeURIComponent(target)}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Erro ao buscar auditorias do alvo.');
      }

      const data = await res.json();
      setTotalScansFound(data.totalScans || 1);

      if (data.totalScans === 1) {
        setNotice(
          `Identificamos 1 auditoria para "${target}" gravada em ${new Date(data.baseline.timestamp).toLocaleString('pt-BR')} (Score ${data.baseline.overallScore}/100 - Nota ${data.baseline.grade}). Realize uma nova varredura no Scanner Central para medir a evolução!`
        );
      }

      setComparison(data.comparison);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao recuperar dados do alvo.';
      setError(msg);
      setComparison(null);
    } finally {
      setLoadingCompare(false);
    }
  };

  // Load a demo scenario to demonstrate ROI
  const loadDemoComparison = () => {
    const demoBaseline: UnifiedAuditReport = {
      id: 'scan-demo-baseline',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      target: 'portfolio.devesec.com',
      targetType: 'domain',
      overallScore: 38,
      grade: 'F',
      riskLevel: 'CRITICAL',
      summary: {
        criticalCount: 2,
        highCount: 3,
        mediumCount: 4,
        lowCount: 2,
        infoCount: 1,
        headline: 'Múltiplas vulnerabilidades críticas expondo servidores e bancos.',
      },
      complianceScorecard: {
        totalChecks: 10,
        passedChecks: 3,
        failedChecks: 6,
        warningChecks: 1,
        complianceRate: 30,
        items: [],
      },
      findings: [
        {
          id: 'FIND-1',
          title: 'Porta 3306 (MySQL) Exposta Publicamente na Internet',
          description: 'A porta de banco de dados MySQL está aberta ao mundo.',
          severity: 'CRITICAL',
          remediation: 'Bloquear via Security Group.',
          category: 'INFRASTRUCTURE',
        },
        {
          id: 'FIND-2',
          title: 'Arquivo .env Vazado com Chaves de Produção',
          description: 'Variáveis de ambiente acessíveis publicamente via HTTP 200.',
          severity: 'CRITICAL',
          remediation: 'Bloquear acesso a arquivos ocultos.',
          category: 'INFRASTRUCTURE',
        },
        {
          id: 'FIND-3',
          title: 'Cabeçalho HSTS Ausente',
          description: 'Permite ataques de downgrade para HTTP inseguro.',
          severity: 'HIGH',
          remediation: 'Configurar Strict-Transport-Security.',
          category: 'WEB_POSTURE',
        },
        {
          id: 'FIND-4',
          title: 'Proteção Anti-Clickjacking Ausente (X-Frame-Options)',
          description: 'Permite que o site seja encapsulado em iframes.',
          severity: 'MEDIUM',
          remediation: 'Adicionar X-Frame-Options: SAMEORIGIN.',
          category: 'WEB_POSTURE',
        },
      ],
      commercialPitch: {
        leadMagnetTitle: 'Pentest Web',
        recommendedService: 'Consultoria Dev & Sec',
        ctaMessage: 'Corrija imediatamente.',
      },
    };

    const demoLatest: UnifiedAuditReport = {
      id: 'scan-demo-latest',
      timestamp: new Date().toISOString(),
      target: 'portfolio.devesec.com',
      targetType: 'domain',
      overallScore: 96,
      grade: 'A',
      riskLevel: 'LOW',
      summary: {
        criticalCount: 0,
        highCount: 0,
        mediumCount: 1,
        lowCount: 1,
        infoCount: 2,
        headline: 'Postura de segurança blindada após consultoria da Dev & Sec.',
      },
      complianceScorecard: {
        totalChecks: 10,
        passedChecks: 9,
        failedChecks: 0,
        warningChecks: 1,
        complianceRate: 90,
        items: [],
      },
      findings: [
        {
          id: 'FIND-4',
          title: 'Proteção Anti-Clickjacking Ausente (X-Frame-Options)',
          description: 'Recomendação pendente de CSP frame-ancestors.',
          severity: 'LOW',
          remediation: 'Ajustar no CSP.',
          category: 'WEB_POSTURE',
        },
      ],
      commercialPitch: {
        leadMagnetTitle: 'Manutenção Contínua',
        recommendedService: 'Monitoramento EASM Dev & Sec',
        ctaMessage: 'Mantenha sua empresa protegida 24/7.',
      },
    };

    setSelectedTarget('portfolio.devesec.com');
    setTotalScansFound(2);
    setSearchTerm('portfolio.devesec.com');
    setNotice(null);
    setComparison(compareAudits(demoBaseline, demoLatest));
  };

  const handleManualCompare = () => {
    setError(null);
    try {
      if (!baselineJson.trim() || !latestJson.trim()) {
        setError('Por favor, cole o JSON do Laudo Inicial e do Laudo Pós-Correção.');
        return;
      }
      const bReport = JSON.parse(baselineJson) as UnifiedAuditReport;
      const lReport = JSON.parse(latestJson) as UnifiedAuditReport;
      setComparison(compareAudits(bReport, lReport));
    } catch {
      setError('Erro ao processar JSON. Certifique-se de colar relatórios válidos emitidos pela Dev & Sec.');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-surface-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Comprovador de ROI & Evolução Automática de Postura
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Comparador de Auditorias <span className="text-emerald-400">(Antes vs Depois)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Selecione qualquer alvo auditado no histórico da Dev & Sec. O sistema busca automaticamente o primeiro diagnóstico e o mais recente para calcular o salto de segurança!
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={loadDemoComparison}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-2 transition-all border border-slate-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Carregar Demonstração (portfolio.devesec.com)
          </button>
          {comparison && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all font-mono"
            >
              <Printer className="w-4 h-4" />
              Imprimir Laudo de Evolução (PDF)
            </button>
          )}
        </div>
      </div>

      {/* Real-time Target Search Bar (No manual typing required!) */}
      <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4 no-print relative">
        <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          Selecione o Alvo Auditado no Histórico (Autocompletar Inteligente):
        </label>

        <div className="relative">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-500 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Digite o domínio ou parte dele (ex: devesec, portfolio, google.com)..."
              className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs sm:text-sm outline-none focus:border-emerald-500"
            />
            {isSearching && (
              <div className="absolute right-4 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              </div>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && targetSuggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-2 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden max-h-72 overflow-y-auto font-mono text-xs divide-y divide-slate-800">
              {targetSuggestions.map((item) => (
                <div
                  key={item.normalizedTarget}
                  onClick={() => selectTargetForCompare(item.target)}
                  className="p-3.5 hover:bg-slate-900 cursor-pointer flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{item.target}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        {item.totalScans} {item.totalScans === 1 ? 'Varredura' : 'Varreduras Gravadas'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        1ª Consulta: {new Date(item.firstScanDate).toLocaleDateString('pt-BR')}
                      </span>
                      <span>•</span>
                      <span>Última: {new Date(item.latestScanDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Evolução</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {item.baselineScore} ➔ {item.latestScore} ({item.latestGrade})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Targets Pills */}
        {targetSuggestions.length > 0 && !comparison && (
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs font-mono">
            <span className="text-slate-500 text-[11px]">Alvos recentes no banco:</span>
            {targetSuggestions.slice(0, 4).map((s) => (
              <button
                key={s.normalizedTarget}
                type="button"
                onClick={() => selectTargetForCompare(s.target)}
                className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                {s.target} ({s.totalScans}x)
              </button>
            ))}
          </div>
        )}

        {/* Loading Spinner */}
        {loadingCompare && (
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Localizando primeiro e último laudo de {selectedTarget} e computando deltas...</span>
          </div>
        )}

        {/* Single Scan Notice */}
        {notice && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            ℹ️ {notice}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            ❌ {error}
          </div>
        )}
      </div>

      {/* Comparison Results Card */}
      {comparison && (
        <div className="space-y-6">
          {/* Executive Delta Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-surface to-surface-card border border-surface-border space-y-6 print-avoid-break">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase font-mono text-slate-400">Alvo em Análise:</span>
                <span className="text-base font-bold text-white font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                  {selectedTarget || 'Alvo Corporativo'}
                </span>
                {totalScansFound > 1 && (
                  <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                    Histórico com {totalScansFound} Auditorias
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-xl bg-slate-950/80 border border-slate-800">
              {/* Baseline */}
              <div className="text-center space-y-2">
                <span className="text-[11px] uppercase font-mono text-slate-400 font-bold block">
                  1ª Auditoria (Baseline)
                </span>
                <div className="w-24 h-24 rounded-full border-4 border-rose-500/60 bg-rose-500/10 flex flex-col items-center justify-center mx-auto text-rose-400">
                  <span className="text-3xl font-extrabold font-mono">{comparison.baselineReport.grade}</span>
                  <span className="text-xs font-mono">{comparison.baselineReport.overallScore}/100</span>
                </div>
                <p className="text-xs text-rose-300 font-mono font-bold">
                  {comparison.baselineReport.criticalCount} Críticos • {comparison.baselineReport.highCount} Altos
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Data: {new Date(comparison.baselineReport.timestamp).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Arrow Delta */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-mono font-bold text-sm">
                  <ArrowRight className="w-4 h-4" />
                  <span>
                    {comparison.delta.scoreDiff >= 0 ? `+${comparison.delta.scoreDiff}` : comparison.delta.scoreDiff} Pontos de Segurança
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400">
                  {comparison.delta.criticalReduced} falhas críticas eliminadas
                </p>
                <p className="text-[11px] text-emerald-400 font-mono">
                  Conformidade: {comparison.baselineReport.complianceRate}% ➔ {comparison.latestReport.complianceRate}% (+{comparison.delta.complianceDiff}%)
                </p>
              </div>

              {/* Latest */}
              <div className="text-center space-y-2">
                <span className="text-[11px] uppercase font-mono text-slate-400 font-bold block">
                  Última Auditoria Realizada
                </span>
                <div className="w-24 h-24 rounded-full border-4 border-emerald-500/60 bg-emerald-500/10 flex flex-col items-center justify-center mx-auto text-emerald-400">
                  <span className="text-3xl font-extrabold font-mono">{comparison.latestReport.grade}</span>
                  <span className="text-xs font-mono">{comparison.latestReport.overallScore}/100</span>
                </div>
                <p className="text-xs text-emerald-300 font-mono font-bold">
                  {comparison.latestReport.criticalCount} Críticos • {comparison.latestReport.highCount} Altos
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Data: {new Date(comparison.latestReport.timestamp).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* ROI Headline */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <span className="text-xs font-mono uppercase text-emerald-400 font-bold block mb-1">
                Parecer de Retorno sobre Investimento (ROI em Cibersegurança):
              </span>
              <p className="text-sm font-semibold text-white">
                {comparison.executiveROIHeadline}
              </p>
            </div>
          </div>

          {/* Mitigated Vulnerabilities List */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4 print-avoid-break">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Vulnerabilidades Mitigadas com Sucesso ({comparison.mitigatedFindings.length})
              </h3>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                100% RESOLVIDAS
              </span>
            </div>

            {comparison.mitigatedFindings.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Nenhuma vulnerabilidade anterior foi totalmente resolvida ou este é o laudo inicial.
              </p>
            ) : (
              <div className="space-y-3">
                {comparison.mitigatedFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          CORRIGIDO
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                          {finding.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white line-through opacity-80">{finding.title}</h4>
                      <p className="text-xs text-slate-400">{finding.description}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-1" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Mode Fallback (Expandable) */}
      <div className="rounded-xl border border-slate-800 bg-surface/50 overflow-hidden no-print">
        <div
          onClick={() => setManualModeOpen(!manualModeOpen)}
          className="p-4 flex items-center justify-between cursor-pointer select-none text-xs text-slate-400 hover:text-white"
        >
          <span>Ou colar relatórios manualmente via JSON</span>
          {manualModeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>

        {manualModeOpen && (
          <div className="p-6 pt-2 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            <textarea
              rows={5}
              value={baselineJson}
              onChange={(e) => setBaselineJson(e.target.value)}
              placeholder="Cole o JSON do laudo inicial..."
              className="p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
            />
            <textarea
              rows={5}
              value={latestJson}
              onChange={(e) => setLatestJson(e.target.value)}
              placeholder="Cole o JSON do laudo recente..."
              className="p-3 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white"
            />
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={handleManualCompare}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase font-mono"
              >
                Processar JSON Manual
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
