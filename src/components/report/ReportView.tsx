'use client';

import React, { useState } from 'react';
import {
  UnifiedAuditReport,
  SeverityLevel,
  SecurityFinding,
  WhiteLabelConfig,
} from '@/core/types/security';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  Server,
  Globe,
  Radio,
  FileText,
  Printer,
  ExternalLink,
  MessageCircle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Bug,
  KeyRound,
  ListChecks,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Cpu,
  Sparkles,
} from 'lucide-react';
import WhiteLabelModal from './WhiteLabelModal';

interface ReportViewProps {
  report: UnifiedAuditReport;
  onNewScan?: () => void;
}

export default function ReportView({ report, onNewScan }: ReportViewProps) {
  const [activeTab, setActiveTab] = useState<'findings' | 'checklist' | 'posture' | 'infra' | 'threat' | 'osint' | 'mobile' | 'cve' | 'secrets' | 'kali'>(
    report.secretsAudit ? 'secrets' : 'findings'
  );
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'ALL'>('ALL');
  const [checklistFilter, setChecklistFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'WARNING'>('ALL');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});
  const [whiteLabelModalOpen, setWhiteLabelModalOpen] = useState(false);
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabelConfig | undefined>(report.whiteLabel);

  const toggleFinding = (id: string) => {
    setExpandedFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFindings = report.findings.filter((f) => {
    if (selectedSeverity === 'ALL') return true;
    return f.severity === selectedSeverity;
  });

  const filteredChecklistItems = (report.complianceScorecard?.items || []).filter((item) => {
    if (checklistFilter === 'ALL') return true;
    return item.status === checklistFilter;
  });

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-emerald-500/20';
      case 'B':
        return 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10 shadow-cyan-500/20';
      case 'C':
        return 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-amber-500/20';
      case 'D':
      case 'F':
        return 'text-rose-400 border-rose-500/50 bg-rose-500/10 shadow-rose-500/20';
      default:
        return 'text-slate-400 border-slate-700 bg-slate-800';
    }
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">CRÍTICO</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">ALTO</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/40">MÉDIO</span>;
      case 'LOW':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/40">BAIXO</span>;
      case 'INFO':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/20 text-slate-400 border border-slate-500/40">INFO</span>;
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Olá Dev & Sec! Realizei a auditoria do alvo "${report.target}" através da plataforma e obtive a nota ${report.grade} (${report.overallScore}/100) com ${report.summary.criticalCount} vulnerabilidades críticas e ${report.summary.highCount} altas. Gostaria de solicitar uma consultoria para correção e mitigação.`
  );

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* WhiteLabel Customizer Modal */}
      {whiteLabelModalOpen && (
        <WhiteLabelModal
          currentConfig={whiteLabel}
          onSave={(cfg) => setWhiteLabel(cfg)}
          onClose={() => setWhiteLabelModalOpen(false)}
        />
      )}

      {/* ========================================================
          PRINT-ONLY OFFICIAL EXECUTIVE COVER & HEADER
         ======================================================== */}
      <div className="hidden print:block mb-6 pb-6 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {whiteLabel?.clientLogoUrl && (
              <div className="h-14 max-w-[140px] flex items-center justify-center p-1 border border-slate-300 rounded bg-white">
                <img src={whiteLabel.clientLogoUrl} alt="Logo Cliente" className="max-h-full max-w-full object-contain" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-3xl tracking-tight text-slate-950 font-mono">DEV & SEC</span>
                <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                  RELATÓRIO TÉCNICO OFICIAL
                </span>
              </div>
              <p className="text-sm text-slate-600 font-medium mt-0.5">
                Laudo Executivo de Postura Cibernética, EASM e Inteligência de Ameaças
              </p>
              {whiteLabel?.clientName && (
                <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
                  AUDITORIA PREPARADA PARA: <span className="text-emerald-700 uppercase">{whiteLabel.clientName}</span>
                </p>
              )}
            </div>
          </div>
          <div className="text-right text-xs font-mono text-slate-700 space-y-1">
            <p><span className="text-slate-500">ALVO AUDITADO:</span> <strong>{report.target}</strong></p>
            <p><span className="text-slate-500">DATA DA EMISSÃO:</span> {new Date(report.timestamp).toLocaleString('pt-BR')}</p>
            <p><span className="text-slate-500">REGISTRO DE LAUDO:</span> {report.id}</p>
          </div>
        </div>
      </div>

      {/* Top Action Bar (Screen Only) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-surface-border no-print">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase font-mono tracking-wider text-slate-400">Alvo Auditado:</span>
          <span className="text-base font-bold text-white font-mono bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
            {report.target}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            {new Date(report.timestamp).toLocaleString('pt-BR')}
          </span>
          {whiteLabel?.clientName && (
            <span className="text-xs text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
              Cliente: {whiteLabel.clientName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setWhiteLabelModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-medium font-mono flex items-center justify-center gap-1.5 transition-all border border-emerald-500/30 hover:border-emerald-500/60"
            title="Adicionar logotipo do cliente e parecer técnico no PDF"
          >
            <Building2 className="w-3.5 h-3.5" />
            Personalizar Laudo (White-Label)
          </button>
          {onNewScan && (
            <button
              onClick={onNewScan}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all font-mono"
            >
              Nova Auditoria
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 font-mono"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório Completo (PDF)
          </button>
        </div>
      </div>

      {/* Hero Score Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface to-surface-card border border-surface-border p-6 sm:p-8 print-avoid-break">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Grade & Score Gauge */}
          <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <p className="text-xs uppercase font-mono text-slate-400 tracking-wider mb-3">Score de Postura Global</p>
            <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center shadow-xl ${getGradeColor(report.grade)}`}>
              <span className="text-4xl font-extrabold font-mono tracking-tighter">{report.grade}</span>
              <span className="text-xs font-mono font-medium opacity-80">{report.overallScore}/100</span>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-slate-400">Classificação de Risco:</span>
              {getSeverityBadge(report.riskLevel)}
            </div>
            {report.complianceScorecard && (
              <div
                onClick={() => setActiveTab('checklist')}
                className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono cursor-pointer hover:bg-emerald-500/20 transition-all no-print flex items-center gap-1.5"
                title="Ver checklist completo de conformidade"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Conformidade: <strong>{report.complianceScorecard.complianceRate}%</strong> ({report.complianceScorecard.passedChecks}/{report.complianceScorecard.totalChecks} OK)</span>
              </div>
            )}
          </div>

          {/* Executive Summary & Metrics */}
          <div className="md:col-span-8 space-y-5">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Diagnóstico de Segurança Executivo
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-snug">
                {report.summary.headline}
              </h2>
            </div>

            {/* Severity Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div
                onClick={() => setSelectedSeverity('CRITICAL')}
                className={`p-3 rounded-xl border transition-all ${
                  selectedSeverity === 'CRITICAL' ? 'bg-rose-500/20 border-rose-500' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                } cursor-pointer no-print`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-rose-400 font-medium">Críticos</span>
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-1 font-mono">{report.summary.criticalCount}</p>
              </div>

              {/* Print Static Counters */}
              <div className="hidden print:block p-3 rounded-xl border bg-rose-50 border-rose-200">
                <span className="text-[11px] font-mono text-rose-700 font-bold block">Críticos</span>
                <p className="text-xl font-bold text-rose-900 mt-1 font-mono">{report.summary.criticalCount}</p>
              </div>

              <div
                onClick={() => setSelectedSeverity('HIGH')}
                className={`p-3 rounded-xl border transition-all ${
                  selectedSeverity === 'HIGH' ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                } cursor-pointer no-print`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-amber-400 font-medium">Altos</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-1 font-mono">{report.summary.highCount}</p>
              </div>

              <div className="hidden print:block p-3 rounded-xl border bg-amber-50 border-amber-200">
                <span className="text-[11px] font-mono text-amber-700 font-bold block">Altos</span>
                <p className="text-xl font-bold text-amber-900 mt-1 font-mono">{report.summary.highCount}</p>
              </div>

              <div
                onClick={() => setSelectedSeverity('MEDIUM')}
                className={`p-3 rounded-xl border transition-all ${
                  selectedSeverity === 'MEDIUM' ? 'bg-yellow-500/20 border-yellow-500' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                } cursor-pointer no-print`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-yellow-400 font-medium">Médios</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-1 font-mono">{report.summary.mediumCount}</p>
              </div>

              <div className="hidden print:block p-3 rounded-xl border bg-yellow-50 border-yellow-200">
                <span className="text-[11px] font-mono text-yellow-700 font-bold block">Médios</span>
                <p className="text-xl font-bold text-yellow-900 mt-1 font-mono">{report.summary.mediumCount}</p>
              </div>

              <div
                onClick={() => setSelectedSeverity('LOW')}
                className={`p-3 rounded-xl border transition-all ${
                  selectedSeverity === 'LOW' ? 'bg-blue-500/20 border-blue-500' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                } cursor-pointer no-print`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-blue-400 font-medium">Baixos</span>
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-1 font-mono">{report.summary.lowCount}</p>
              </div>

              <div className="hidden print:block p-3 rounded-xl border bg-blue-50 border-blue-200">
                <span className="text-[11px] font-mono text-blue-700 font-bold block">Baixos</span>
                <p className="text-xl font-bold text-blue-900 mt-1 font-mono">{report.summary.lowCount}</p>
              </div>

              <div
                onClick={() => setSelectedSeverity('ALL')}
                className={`p-3 rounded-xl border transition-all col-span-2 sm:col-span-1 ${
                  selectedSeverity === 'ALL' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                } cursor-pointer no-print`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-emerald-400 font-medium">Total</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-1 font-mono">{report.findings.length}</p>
              </div>

              <div className="hidden print:block p-3 rounded-xl border bg-slate-100 border-slate-300">
                <span className="text-[11px] font-mono text-slate-700 font-bold block">Total</span>
                <p className="text-xl font-bold text-slate-900 mt-1 font-mono">{report.findings.length}</p>
              </div>
            </div>

            {/* Commercial Pitch CTA */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  Recomendação Técnica Dev & Sec: {report.commercialPitch.recommendedService}
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  {report.commercialPitch.ctaMessage}
                </p>
              </div>
              <a
                href={`https://wa.me/5511999999999?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 no-print"
              >
                <MessageCircle className="w-4 h-4" />
                Solicitar Correção
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Screen Only) - Wrapped gracefully so all tabs are visible without scrollbars */}
      <div className="flex flex-wrap items-center gap-2 border-b border-surface-border pb-3 no-print">
        <button
          onClick={() => setActiveTab('findings')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'findings' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Vulnerabilidades & Correções ({report.findings.length})
        </button>

        {report.complianceScorecard && (
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'checklist' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListChecks className="w-4 h-4 text-emerald-400" />
            Checklist de Conformidade ({report.complianceScorecard.complianceRate}% OK)
          </button>
        )}

        {report.webPosture && (
          <button
            onClick={() => setActiveTab('posture')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'posture' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Postura Web & Headers ({report.webPosture.moduleScore}/100)
          </button>
        )}

        {report.infraRecon && (
          <button
            onClick={() => setActiveTab('infra')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'infra' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            Infraestrutura & Portas ({report.infraRecon.openPorts.filter(p => p.state === 'OPEN').length} abertas)
          </button>
        )}

        {report.threatIntel && (
          <button
            onClick={() => setActiveTab('threat')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'threat' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            Threat Intelligence
          </button>
        )}

        {report.osint && (
          <button
            onClick={() => setActiveTab('osint')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'osint' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            Proteção de Marca & OSINT ({report.osint.socialProfiles.filter(p => p.exists).length} encontrados)
          </button>
        )}

        {report.mobileAudit && (
          <button
            onClick={() => setActiveTab('mobile')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'mobile' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Auditoria Mobile ({report.mobileAudit.moduleScore}/100)
          </button>
        )}

        {report.cveData && (
          <button
            onClick={() => setActiveTab('cve')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'cve' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Bug className="w-4 h-4 text-rose-400" />
            CVEs & NIST ({report.cveData.totalCves})
          </button>
        )}

        {report.secretsAudit && (
          <button
            onClick={() => setActiveTab('secrets')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'secrets' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            Vazamento de Segredos ({report.secretsAudit.totalLeaks})
          </button>
        )}

        {report.kaliArsenal && (
          <button
            onClick={() => setActiveTab('kali')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'kali' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            Arsenal Kali ({report.kaliArsenal.enginesExecuted.length})
          </button>
        )}
      </div>

      {/* ========================================================
          SECTION 1: FINDINGS & REMEDIATION (SCREEN + FULL PRINT)
         ======================================================== */}
      <div className={`space-y-4 ${activeTab === 'findings' ? 'block' : 'hidden print:block print:mt-8'}`}>
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <h3 className="text-base font-bold uppercase font-mono tracking-wider text-emerald-400">
            1. Achados de Segurança & Plano de Remediação Técnico ({report.findings.length})
          </h3>
          {selectedSeverity !== 'ALL' && (
            <button
              onClick={() => setSelectedSeverity('ALL')}
              className="text-xs text-emerald-400 hover:underline no-print"
            >
              Limpar filtro ({selectedSeverity})
            </button>
          )}
        </div>

        {/* SCREEN FINDINGS (Supports interactive filters) */}
        <div className="space-y-4 no-print">
          {filteredFindings.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-surface border border-surface-border">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">Nenhuma vulnerabilidade com essa severidade encontrada!</p>
              <p className="text-xs text-slate-500 mt-1">Sua configuração atende aos critérios essenciais.</p>
            </div>
          ) : (
            filteredFindings.map((finding) => (
              <div
                key={finding.id}
                className="rounded-xl bg-surface border border-surface-border overflow-hidden transition-all hover:border-slate-700"
              >
                <div
                  onClick={() => toggleFinding(finding.id)}
                  className="p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSeverityBadge(finding.severity)}
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {finding.category}
                      </span>
                      {finding.cveOrStandard && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30">
                          {finding.cveOrStandard}
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white">{finding.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{finding.description}</p>
                  </div>
                  <button className="text-slate-400 hover:text-white p-1">
                    {expandedFindings[finding.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {expandedFindings[finding.id] && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
                        Plano de Remediação Técnico (Passo a Passo):
                      </span>
                      <p className="text-xs font-mono text-slate-200 bg-slate-900/90 p-3 rounded-lg border border-slate-800 leading-relaxed">
                        {finding.remediation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* PRINT-ONLY FULL FINDINGS LIST (Always shows ALL findings with full remediations expanded) */}
        <div className="hidden print:block space-y-4">
          {report.findings.map((finding) => (
            <div
              key={`print-${finding.id}`}
              className="p-4 rounded-xl border border-slate-300 bg-slate-50 print-avoid-break space-y-2"
            >
              <div className="flex items-center gap-2 flex-wrap">
                {getSeverityBadge(finding.severity)}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                  {finding.category}
                </span>
                {finding.cveOrStandard && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-100 text-violet-800 border border-violet-300">
                    {finding.cveOrStandard}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-slate-950">{finding.title}</h4>
              <p className="text-xs text-slate-700 leading-relaxed">{finding.description}</p>
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block mb-0.5">
                  Correção Técnica Recomendada:
                </span>
                <p className="text-xs font-mono text-slate-900 bg-slate-100 p-2 rounded border border-slate-200">
                  {finding.remediation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================
          SECTION: COMPLIANCE CHECKLIST & VERIFICATION MATRIX (SCREEN + PRINT)
         ======================================================== */}
      {report.complianceScorecard && (
        <div className={`space-y-6 ${activeTab === 'checklist' ? 'block' : 'hidden print:block print:mt-8 print-avoid-break'}`}>
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
              <div>
                <span className="text-[11px] font-mono uppercase text-emerald-400 font-bold tracking-wider">
                  Matriz de Auditoria e Índices de Verificação 360°
                </span>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <ListChecks className="w-5 h-5 text-emerald-400" />
                  Checklist Geral de Conformidade ({report.complianceScorecard.totalChecks} Controles Auditados)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Mapeamento completo dos critérios de segurança auditados pela Dev & Sec, demonstrando todos os itens em conformidade e as lacunas que necessitam de intervenção.
                </p>
              </div>

              {/* Compliance rate badge */}
              <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-3 rounded-xl">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
                  {report.complianceScorecard.complianceRate}%
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Índice Global</span>
                  <span className="text-xs font-bold text-white">Taxa de Conformidade</span>
                </div>
              </div>
            </div>

            {/* Quick Status Filter Bar (Screen Only) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 no-print">
              <button
                onClick={() => setChecklistFilter('ALL')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  checklistFilter === 'ALL' ? 'bg-slate-800 border-slate-600' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Total de Controles</span>
                <span className="text-lg font-bold text-white font-mono">{report.complianceScorecard.totalChecks}</span>
              </button>

              <button
                onClick={() => setChecklistFilter('PASSED')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  checklistFilter === 'PASSED' ? 'bg-emerald-500/20 border-emerald-500' : 'bg-slate-950/50 border-slate-800 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">Conforme / Aprovado</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-lg font-bold text-emerald-300 font-mono">{report.complianceScorecard.passedChecks}</span>
              </button>

              <button
                onClick={() => setChecklistFilter('FAILED')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  checklistFilter === 'FAILED' ? 'bg-rose-500/20 border-rose-500' : 'bg-slate-950/50 border-slate-800 hover:border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">Não Conforme / Risco</span>
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className="text-lg font-bold text-rose-300 font-mono">{report.complianceScorecard.failedChecks}</span>
              </button>

              <button
                onClick={() => setChecklistFilter('WARNING')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  checklistFilter === 'WARNING' ? 'bg-amber-500/20 border-amber-500' : 'bg-slate-950/50 border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">Requer Atenção</span>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span className="text-lg font-bold text-amber-300 font-mono">{report.complianceScorecard.warningChecks}</span>
              </button>
            </div>

            {/* Checklist Items List (Screen View) */}
            <div className="space-y-3 no-print">
              {filteredChecklistItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-all ${
                    item.status === 'PASSED'
                      ? 'bg-slate-950/40 border-slate-800 hover:border-emerald-500/30'
                      : item.status === 'FAILED'
                      ? 'bg-rose-950/10 border-rose-500/30 hover:border-rose-500/50'
                      : 'bg-amber-950/10 border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.status === 'PASSED' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> CONFORME
                        </span>
                      )}
                      {item.status === 'FAILED' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> NÃO CONFORME
                        </span>
                      )}
                      {item.status === 'WARNING' && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> ATENÇÃO
                        </span>
                      )}
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {item.standard}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.details}</p>

                  {item.recommendation && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-emerald-300 flex items-start gap-2">
                      <span className="font-bold text-emerald-400 whitespace-nowrap">Ação de Ajuste:</span>
                      <span>{item.recommendation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* PRINT-ONLY OFFICIAL CHECKLIST TABLE */}
            <div className="hidden print:block space-y-3">
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 border-b border-slate-300 font-mono text-[11px] text-slate-700">
                  <tr>
                    <th className="p-2.5 border-r border-slate-300">Critério de Verificação</th>
                    <th className="p-2.5 border-r border-slate-300">Pilar / Norma</th>
                    <th className="p-2.5 border-r border-slate-300 text-center">Status</th>
                    <th className="p-2.5">Evidência Técnica Auditada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {report.complianceScorecard.items.map((item) => (
                    <tr key={item.id} className="print-avoid-break">
                      <td className="p-2.5 border-r border-slate-200 font-bold text-slate-900">
                        {item.title}
                      </td>
                      <td className="p-2.5 border-r border-slate-200 font-mono text-[10px] text-slate-600">
                        <div>{item.category}</div>
                        <div className="text-slate-400">{item.standard}</div>
                      </td>
                      <td className="p-2.5 border-r border-slate-200 text-center">
                        {item.status === 'PASSED' ? (
                          <span className="font-bold text-emerald-700 text-[10px] bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded">
                            CONFORME
                          </span>
                        ) : item.status === 'FAILED' ? (
                          <span className="font-bold text-rose-700 text-[10px] bg-rose-50 border border-rose-300 px-1.5 py-0.5 rounded">
                            NÃO CONFORME
                          </span>
                        ) : (
                          <span className="font-bold text-amber-700 text-[10px] bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded">
                            ATENÇÃO
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-700 text-[11px]">
                        <div>{item.details}</div>
                        {item.recommendation && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            Recomendação: {item.recommendation}
                          </div>
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

      {/* ========================================================
          SECTION 2: WEB POSTURE & HEADERS (SCREEN + PRINT)
         ======================================================== */}
      {report.webPosture && (
        <div className={`space-y-6 ${activeTab === 'posture' ? 'block' : 'hidden print:block print:mt-8 print-avoid-break'}`}>
          <div className="p-6 rounded-xl bg-surface border border-surface-border">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-emerald-400 mb-4 pb-2 border-b border-surface-border">
              2. Postura Web & Cabeçalhos HTTP de Proteção ({report.webPosture.moduleScore}/100)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">Strict-Transport-Security (HSTS)</span>
                  {report.webPosture.headers.hsts.present ? (
                    <span className="text-xs font-bold text-emerald-400">ATIVO</span>
                  ) : (
                    <span className="text-xs font-bold text-rose-400">AUSENTE</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Força o navegador a utilizar somente conexões criptografadas.</p>
                {report.webPosture.headers.hsts.raw && (
                  <p className="text-[10px] font-mono text-slate-500 break-all bg-slate-900 p-1.5 rounded">
                    {report.webPosture.headers.hsts.raw}
                  </p>
                )}
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">Content-Security-Policy (CSP)</span>
                  {report.webPosture.headers.csp.present ? (
                    <span className="text-xs font-bold text-emerald-400">ATIVO</span>
                  ) : (
                    <span className="text-xs font-bold text-rose-400">AUSENTE</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Previne injeção e execução de scripts maliciosos (XSS).</p>
                {report.webPosture.headers.csp.raw && (
                  <p className="text-[10px] font-mono text-slate-500 break-all bg-slate-900 p-1.5 rounded">
                    {report.webPosture.headers.csp.raw.substring(0, 150)}...
                  </p>
                )}
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">X-Frame-Options</span>
                  {report.webPosture.headers.xFrameOptions.present ? (
                    <span className="text-xs font-bold text-emerald-400">ATIVO</span>
                  ) : (
                    <span className="text-xs font-bold text-rose-400">AUSENTE</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Impede que o site seja encapsulado em iframes (Clickjacking).</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">X-Content-Type-Options</span>
                  {report.webPosture.headers.xContentTypeOptions.present ? (
                    <span className="text-xs font-bold text-emerald-400">ATIVO</span>
                  ) : (
                    <span className="text-xs font-bold text-rose-400">AUSENTE</span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Evita que navegadores interpretem tipos MIME incorretamente.</p>
              </div>
            </div>

            {/* Technologies detected */}
            {report.webPosture.technologies.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <span className="text-xs font-mono uppercase text-slate-400 font-semibold block mb-2">
                  Tecnologias e Servidores Identificados:
                </span>
                <div className="flex flex-wrap gap-2">
                  {report.webPosture.technologies.map((t, idx) => (
                    <span key={idx} className="text-xs font-mono px-3 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 3: INFRASTRUCTURE & PORTS (SCREEN + PRINT)
         ======================================================== */}
      {report.infraRecon && (
        <div className={`space-y-6 ${activeTab === 'infra' ? 'block' : 'hidden print:block print:mt-8 print-avoid-break'}`}>
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-cyan-400 pb-2 border-b border-surface-border">
              3. Infraestrutura, Superfície de Rede e Portas Abertas
            </h3>

            {/* Geolocation Card */}
            {report.infraRecon.geolocation && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase font-bold text-slate-300">Localização do Servidor & Nuvem:</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                  <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block">País / Cidade</span>
                    <span className="text-white font-bold">{report.infraRecon.geolocation.city}, {report.infraRecon.geolocation.country}</span>
                  </div>
                  <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block">Provedor / ISP</span>
                    <span className="text-white font-bold">{report.infraRecon.geolocation.isp}</span>
                  </div>
                  <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block">ASN</span>
                    <span className="text-white font-bold">{report.infraRecon.geolocation.asn}</span>
                  </div>
                  <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block">IP Principal</span>
                    <span className="text-emerald-400 font-bold">{report.infraRecon.resolvedIps[0] || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Open Ports */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-slate-300">Varredura de Portas TCP:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {report.infraRecon.openPorts.map((p) => (
                  <div
                    key={p.port}
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      p.state === 'OPEN'
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold font-mono block">Porta {p.port}</span>
                      <span className="text-[11px] text-slate-400">{p.service}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        p.state === 'OPEN' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {p.state}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subdomains */}
            {report.infraRecon.subdomains.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <span className="text-xs font-mono uppercase font-bold text-slate-300">
                  Subdomínios Públicos Identificados (Certificate Transparency):
                </span>
                <div className="flex flex-wrap gap-2">
                  {report.infraRecon.subdomains.map((sub, idx) => (
                    <span key={idx} className="text-xs font-mono px-3 py-1 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 4: THREAT INTELLIGENCE (SCREEN + PRINT)
         ======================================================== */}
      {report.threatIntel && (
        <div className={`space-y-6 ${activeTab === 'threat' ? 'block' : 'hidden print:block print:mt-8 print-avoid-break'}`}>
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-amber-400 pb-2 border-b border-surface-border">
              4. Consórcio de Inteligência de Ameaças & Antivírus (90+ Motores Integrados)
            </h3>

            {/* Wildcard / Dynamic DNS Alert Banner */}
            {report.threatIntel.phishingHeuristics.isWildcardOrDynamicDns && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  ALERTA DE INFRAESTRUTURA EVASIVA: DNS DINÂMICO ({report.threatIntel.phishingHeuristics.wildcardService?.toUpperCase()})
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O alvo utiliza um resolvedor DNS efêmero apontando diretamente para o IP{' '}
                  <code className="text-rose-300 font-mono font-bold">
                    {report.threatIntel.phishingHeuristics.embeddedIp || 'embutido'}
                  </code>
                  . Essa técnica é massivamente utilizada em campanhas de malware para contornar listas de reputação.
                </p>
              </div>
            )}

            {/* Multi-Engine Stats */}
            <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block font-mono">Detecções de Ameaça / Malware:</span>
                <span className="text-xl font-bold font-mono text-rose-400">
                  {report.threatIntel.virusTotal?.maliciousVotes || 0} / {report.threatIntel.virusTotal?.totalEngines || 93} motores de segurança
                </span>
              </div>
              {(report.threatIntel.virusTotal?.maliciousVotes || 0) > 0 ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  SINALIZADO COMO AMEAÇA
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  REPUTAÇÃO POSITIVA
                </span>
              )}
            </div>

            {/* Blacklists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.threatIntel.blacklists.map((bl, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white block">{bl.name}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        bl.listed ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {bl.listed ? 'POSITIVO' : 'LIMPO'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {bl.details || (bl.listed ? 'Listado em feeds de abuso.' : 'Nenhum registro adverso encontrado.')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 5: BRAND PROTECTION & OSINT (SCREEN + PRINT)
         ======================================================== */}
      {report.osint && (
        <div className={`space-y-6 ${activeTab === 'osint' ? 'block' : 'hidden print:block print:mt-8 print-avoid-break'}`}>
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-emerald-400 pb-2 border-b border-surface-border">
              5. Proteção de Marca & Ocupação de Nome (Brand Impersonation Recon)
            </h3>

            {/* WHOIS Card */}
            {report.osint.whois && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase font-bold text-slate-300">Informações de Registro WHOIS / RDAP:</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block">Registrar</span>
                    <span className="text-white font-bold">{report.osint.whois.registrar || 'Desconhecido'}</span>
                  </div>
                  <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block">Data de Criação</span>
                    <span className="text-white font-bold">
                      {report.osint.whois.creationDate ? new Date(report.osint.whois.creationDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-500 block">Data de Expiração</span>
                    <span className="text-white font-bold">
                      {report.osint.whois.expirationDate ? new Date(report.osint.whois.expirationDate).toLocaleDateString('pt-BR') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Social Footprint */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-slate-300">
                Ocupação de Nomes em Plataformas Públicas (Sherlock Recon):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {report.osint.socialProfiles.map((p) => {
                  if (p.exists) {
                    return (
                      <a
                        key={p.platform}
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-lg border text-xs font-mono flex items-center justify-between bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold hover:bg-emerald-500/20 hover:border-emerald-400 hover:scale-[1.02] transition-all group shadow-sm cursor-pointer"
                        title={`Acessar perfil em ${p.platform}: ${p.url}`}
                      >
                        <span className="flex items-center gap-1 group-hover:underline">
                          {p.platform}
                          <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          Encontrado
                        </span>
                      </a>
                    );
                  }

                  return (
                    <div
                      key={p.platform}
                      className="p-3 rounded-lg border text-xs font-mono flex items-center justify-between bg-slate-950/30 border-slate-800 text-slate-500 opacity-60"
                      title={`${p.platform}: Nome disponível / não registrado`}
                    >
                      <span>{p.platform}</span>
                      <span className="text-[10px]">Livre</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 6: MOBILE AUDIT (SCREEN + PRINT)
         ======================================================== */}
      {report.mobileAudit && (
        <div className={`space-y-6 ${activeTab === 'mobile' ? 'block' : 'hidden print:block print:mt-8 print-avoid-break'}`}>
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
            <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-violet-400 pb-2 border-b border-surface-border">
              6. Auditoria de Aplicativos Móveis (OWASP Mobile Top 10)
            </h3>

            {/* Dangerous Flags */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-slate-300">Flags de Compilação & Sandbox:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {report.mobileAudit.dangerousFlags.map((flag, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      flag.status === 'VULNERABLE'
                        ? 'bg-rose-500/10 border-rose-500/40'
                        : 'bg-emerald-500/10 border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-white">{flag.flag}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          flag.status === 'VULNERABLE' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {flag.status === 'VULNERABLE' ? 'VULNERÁVEL' : 'SEGURO'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{flag.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase font-bold text-slate-300">
                Permissões Críticas Solicitadas ({report.mobileAudit.permissions.filter(p => p.isDangerous).length}):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.mobileAudit.permissions.map((perm, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-start justify-between gap-3 ${
                      perm.isDangerous ? 'bg-amber-500/10 border-amber-500/40' : 'bg-slate-950/40 border-slate-800'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold font-mono text-white block">{perm.name.split('.').pop()}</span>
                      <span className="text-[11px] text-slate-400">{perm.description}</span>
                    </div>
                    {perm.isDangerous && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 whitespace-nowrap">
                        PERIGOSA
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 7: CVES & KNOWN VULNERABILITIES (SCREEN + PRINT)
         ======================================================== */}
      {report.cveData && (
        <div className={`space-y-6 ${activeTab === 'cve' ? 'block' : 'hidden print:block print:mt-8 print-avoid-break'}`}>
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-border">
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-rose-400">
                7. Base Nacional de Vulnerabilidades & CVEs (NIST / NVD)
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Tecnologias Auditadas: {report.cveData.queriedTechnologies.join(', ') || 'N/A'}
              </span>
            </div>

            {report.cveData.cves.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Nenhuma CVE crítica mapeada diretamente para as tecnologias detectadas</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Os componentes identificados não possuem registros de exploração pública imediata na base NIST para as assinaturas analisadas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {report.cveData.cves.map((cve, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400 text-sm">{cve.id}</span>
                        {getSeverityBadge(cve.cvssSeverity)}
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          CVSS Score: {cve.cvssScore.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Publicação: {cve.publishedDate}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed">
                      {cve.description}
                    </p>

                    {cve.references && cve.references.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs">
                        <span className="text-slate-400 font-mono">Referência Técnica:</span>
                        {cve.references.map((ref, rIdx) => (
                          <a
                            key={rIdx}
                            href={ref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            Boletim Oficial <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 8: SECRETS & CREDENTIAL LEAKS (SCREEN + PRINT)
         ======================================================== */}
      {report.secretsAudit && (
        <div className={`space-y-6 ${activeTab === 'secrets' ? 'block' : 'hidden print:block print:mt-8 print-avoid-break'}`}>
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-border">
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-amber-400">
                8. Auditoria de Segredos & Credenciais Expostas (DevSecOps)
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Total de Vazamentos: {report.secretsAudit.totalLeaks}
              </span>
            </div>

            {report.secretsAudit.leaks.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">Nenhum segredo ou chave privada vazada</h4>
                <p className="text-xs text-slate-300 mt-1">
                  O conteúdo analisado não apresentou padrões de tokens AWS, chaves de API, senhas em texto puro ou certificados expostos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {report.secretsAudit.leaks.map((leak, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950/60 border border-amber-500/30 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-sm">{leak.ruleName}</span>
                        {getSeverityBadge(leak.severity)}
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          Linha {leak.line}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        Motor: {leak.detector}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-rose-300 flex items-center justify-between">
                      <span>Padrão Detectado (Mascarado): <strong>{leak.matchMasked}</strong></span>
                      <span className="text-[10px] text-slate-500">REVOGAÇÃO IMEDIATA RECOMENDADA</span>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-slate-200">
                      <span className="font-bold text-emerald-400 block mb-1">Ação Corretiva Recomendada:</span>
                      {leak.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION 9: KALI ARSENAL ADVANCED ENGINES (SCREEN + PRINT)
         ======================================================== */}
      {report.kaliArsenal && (
        <div className={`space-y-6 ${activeTab === 'kali' ? 'block' : 'hidden print:block print:mt-8 print-avoid-break'}`}>
          <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-border">
              <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-cyan-400 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                9. Orquestração do Arsenal Kali Linux & Motores Especializados
              </h3>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                {report.kaliArsenal.enginesExecuted.length} Motores Executados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(report.kaliArsenal.results).map(([key, res]) => (
                <div key={key} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-white">{res.engineName}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                      res.mode === 'CLI_NATIVE' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {res.mode === 'CLI_NATIVE' ? 'NATIVO CLI' : 'FALLBACK TS'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Duração da varredura: {res.durationMs}ms • Achados identificados: {res.findings.length}
                  </p>
                  {res.findings.length > 0 && (
                    <div className="pt-2 border-t border-slate-900 space-y-1">
                      {res.findings.map(f => (
                        <div key={f.id} className="text-[11px] text-slate-300 flex items-center gap-1.5 font-mono">
                          <span className="text-rose-400 font-bold">•</span>
                          <span className="truncate">{f.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PRINT-ONLY OFFICIAL SIGN-OFF & CONTACT FOOTER
         ======================================================== */}
      <div className="hidden print:block mt-12 pt-6 border-t-2 border-slate-300 print-avoid-break">
        {whiteLabel?.executiveOpinion && (
          <div className="mb-6 p-4 rounded-lg bg-slate-100 border border-slate-300 text-xs">
            <span className="font-bold text-slate-900 uppercase font-mono block mb-1">
              PARECER TÉCNICO EXECUTIVO DO AUDITOR:
            </span>
            <p className="text-slate-800 leading-relaxed font-sans">{whiteLabel.executiveOpinion}</p>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-slate-600">
          <div>
            <p className="font-bold text-slate-900 text-sm">DEV & SEC — TECNOLOGIA QUE CONSTRÓI. SEGURANÇA QUE PROTEGE.</p>
            <p className="text-slate-600 mt-0.5">
              Auditor Responsável: <strong>{whiteLabel?.consultantName || 'Equipe de Inteligência Cibernética'}</strong>
              {whiteLabel?.consultantTitle ? ` (${whiteLabel.consultantTitle})` : ''}
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              Portal Oficial: https://devesec.com • Atendimento Direto: WhatsApp Oficial Dev & Sec
            </p>
          </div>
          <div className="text-right border border-slate-400 rounded-lg p-3 font-mono text-[11px] bg-slate-50">
            <p className="font-bold text-emerald-800">LAUDO CONCLUÍDO</p>
            <p className="text-slate-600">CLASSIFICAÇÃO: CONFIDENCIAL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
