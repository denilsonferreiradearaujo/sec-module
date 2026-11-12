'use client';

import React, { useState } from 'react';
import {
  Cloud,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Database,
  Key,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CloudAuditReport, CloudStorageBucket, CisCloudCheck } from '@/core/types/cloud-security';

export default function CloudAuditView() {
  const [company, setCompany] = useState('devesec');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CloudAuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checklistFilter, setChecklistFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'WARNING'>('ALL');

  const handleAudit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!company.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/cloud/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: company.trim() }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Falha ao auditar ambiente em nuvem');
      }

      const data = await res.json();
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro na requisição CSPM');
    } finally {
      setLoading(false);
    }
  };

  const filteredCis = (report?.cisChecklist || []).filter((item) => {
    if (checklistFilter === 'ALL') return true;
    return item.status === checklistFilter;
  });

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
          <Cloud className="w-3.5 h-3.5" />
          Auditoria de Nuvem & Postura CSPM (Cloud Security Posture Management)
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Auditoria Cloud & <span className="text-cyan-400">Buckets S3 / Blobs</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Verifique a exposição de baldes de armazenamento AWS S3 e Azure Blob Storage contra acessos anônimos e avalie a
          conformidade da infraestrutura nos padrões <strong>CIS Cloud Foundations Benchmark</strong> (AWS, Azure e GCP).
        </p>

        {/* Search Input */}
        <form onSubmit={handleAudit} className="pt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nome ou prefixo da empresa (ex: devesec, techcorp)"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white outline-none focus:border-cyan-500 pl-10"
            />
            <Cloud className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Varrendo Nuvem...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Auditar Postura Cloud
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

      {/* Audit Report View */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
              <span className="text-xs text-slate-400 block uppercase">Score de Conformidade CIS Cloud</span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-3xl font-extrabold px-3 py-1 rounded-xl border ${
                    report.overallComplianceScore >= 80
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40'
                      : report.overallComplianceScore >= 60
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/40'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/40'
                  }`}
                >
                  {report.overallComplianceScore}/100
                </span>
                <span className="text-xs text-slate-400">
                  {report.overallComplianceScore >= 80 ? 'Postura Robusta' : 'Vulnerabilidades em Nuvem'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
              <span className="text-xs text-slate-400 block uppercase">Buckets S3 / Blobs Expostos</span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-3xl font-extrabold px-3 py-1 rounded-xl border ${
                    report.exposedBucketsCount > 0
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/40'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40'
                  }`}
                >
                  {report.exposedBucketsCount}
                </span>
                <span className="text-xs text-slate-400">
                  {report.exposedBucketsCount > 0 ? 'Vazamento Público Iminente' : 'Nenhum bucket público'}
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2">
              <span className="text-xs text-slate-400 block uppercase">Padrões de Nomes Testados</span>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/40">
                  {report.totalBucketsTested}
                </span>
                <span className="text-xs text-slate-400">Endereços AWS S3 checados</span>
              </div>
            </div>
          </div>

          {/* Headline Notice */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-xs text-slate-300 leading-relaxed font-sans space-y-1">
            <div className="font-mono text-cyan-400 font-bold flex items-center gap-1.5 uppercase text-xs">
              <Sparkles className="w-4 h-4" />
              Diagnóstico de Segurança em Nuvem
            </div>
            <p>{report.summaryHeadline}</p>
          </div>

          {/* S3 Storage Probing Grid */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                  Varredura de Superfície de Armazenamento (Buckets AWS S3)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Padrões comuns corporativos testados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {report.buckets.map((b, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    b.status === 'PUBLIC_EXPOSED'
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-300'
                      : b.status === 'RESTRICTED_ACCESS'
                      ? 'bg-slate-950/60 border-slate-800 text-slate-300'
                      : 'bg-slate-950/40 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate max-w-[240px] block">
                      {b.bucketName}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.status === 'PUBLIC_EXPOSED'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : b.status === 'RESTRICTED_ACCESS'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {b.status === 'PUBLIC_EXPOSED'
                        ? 'PÚBLICO EXPOSTO'
                        : b.status === 'RESTRICTED_ACCESS'
                        ? 'PROTEGIDO (403)'
                        : 'INEXISTENTE (404)'}
                    </span>
                  </div>

                  <p className="text-[11px] font-sans text-slate-400 leading-relaxed">
                    {b.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
                    <span className="text-slate-500">{b.provider}</span>
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      Testar URL <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CIS Cloud Foundations Checklist */}
          <div className="p-6 rounded-2xl bg-surface border border-surface-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase font-mono tracking-wider text-white">
                  Checklist CIS Cloud Foundations Benchmark
                </h3>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                {(['ALL', 'PASSED', 'FAILED', 'WARNING'] as const).map((flt) => (
                  <button
                    key={flt}
                    onClick={() => setChecklistFilter(flt)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      checklistFilter === flt
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-bold'
                        : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                    }`}
                  >
                    {flt === 'ALL'
                      ? 'Todos'
                      : flt === 'PASSED'
                      ? 'Aprovados'
                      : flt === 'FAILED'
                      ? 'Falhas'
                      : 'Avisos'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {filteredCis.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {item.status === 'PASSED' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : item.status === 'FAILED' ? (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="font-bold text-white text-xs">{item.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">{item.benchmark}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'PASSED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : item.status === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] font-sans text-slate-300 leading-relaxed">
                    {item.details}
                  </p>

                  <div className="p-2.5 rounded bg-slate-900 text-slate-400 font-sans text-[11px]">
                    <span className="font-mono text-cyan-400 font-bold block mb-0.5">
                      Diretriz de Mitigação:
                    </span>
                    {item.remediation}
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
