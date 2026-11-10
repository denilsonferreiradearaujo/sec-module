'use client';

import React, { useState, useEffect } from 'react';
import {
  Mail,
  ShieldAlert,
  Users,
  Award,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Send,
  Building2,
  Search,
  Clock,
  History,
  Check,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { PHISHING_TEMPLATES } from '@/modules/phishing/campaign-manager';
import { PhishingTemplate } from '@/core/types/phishing';
import { StoredPhishingCampaign } from '@/core/storage/phishing-store';

export default function PhishingCampaignView() {
  const [selectedTemplate, setSelectedTemplate] = useState<PhishingTemplate>(PHISHING_TEMPLATES[0]);

  // Campaign Inputs
  const [organization, setOrganization] = useState('devesec');
  const [campaignTitle, setCampaignTitle] = useState('Teste para a Empresa devesec mês Novembro 2026');
  const [emailsText, setEmailsText] = useState(
    'financeiro@devesec.com\nrh@devesec.com\ndiretoria@devesec.com\noperacional@devesec.com\ncontato@devesec.com'
  );

  const [activeCampaign, setActiveCampaign] = useState<StoredPhishingCampaign | null>(null);
  const [loadingLaunch, setLoadingLaunch] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // History & Search
  const [campaignHistory, setCampaignHistory] = useState<StoredPhishingCampaign[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch past campaigns
  const fetchHistory = async (q?: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/phishing/campaigns?q=${encodeURIComponent(q || '')}`);
      if (res.ok) {
        const data = await res.json();
        setCampaignHistory(data.campaigns || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLaunch(true);
    setSuccessMsg(null);

    const emailList = emailsText
      .split(/[\n,;]+/)
      .map(e => e.trim())
      .filter(Boolean);

    try {
      const res = await fetch('/api/phishing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization: organization.trim(),
          title: campaignTitle.trim(),
          templateId: selectedTemplate.id,
          targetEmails: emailList,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setActiveCampaign(data.campaign);
        setSuccessMsg(`Campanha "${data.campaign.title}" registrada e processada com sucesso no histórico da ${organization}!`);
        fetchHistory();
      }
    } catch {
      // ignore
    } finally {
      setLoadingLaunch(false);
    }
  };

  const handleSelectHistoricalCampaign = (camp: StoredPhishingCampaign) => {
    setActiveCampaign(camp);
    setOrganization(camp.organization);
    setCampaignTitle(camp.title);
    const tmpl = PHISHING_TEMPLATES.find(t => t.id === camp.templateId);
    if (tmpl) setSelectedTemplate(tmpl);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
          <Mail className="w-3.5 h-3.5" />
          Simulador de Engenharia Social & Gestão de Campanhas por Organização
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Conscientização & <span className="text-amber-400">Treinamento Humano</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Cadastre alvos corporativos por empresa/organização, dispare campanhas simuladas com templates realistas,
          armazene o histórico completo de testes e avalie a redução do índice de risco humano ao longo do tempo.
        </p>
      </div>

      {/* Main Campaign Configuration Form */}
      <form onSubmit={handleLaunchCampaign} className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            Configuração da Campanha Educativa
          </h3>
          <span className="text-xs font-mono text-slate-400">Padrão CIS Control 14 (Security Awareness)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">Organização / Empresa Alvo:</label>
            <input
              type="text"
              required
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              placeholder="Ex: devesec / TechCorp"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold block">Título do Teste de Treinamento:</label>
            <input
              type="text"
              required
              value={campaignTitle}
              onChange={(e) => setCampaignTitle(e.target.value)}
              placeholder="Ex: Teste para a Empresa devesec mês Novembro 2026"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="text-slate-300 font-bold block">
              E-mails dos Colaboradores Alvo (um por linha ou separados por vírgula):
            </label>
            <textarea
              rows={4}
              required
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
              placeholder="colaborador1@empresa.com.br&#10;financeiro@empresa.com.br"
              className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Template Selector */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-mono uppercase font-bold text-slate-400 block">
            Selecione o Modelo de Engenharia Social:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PHISHING_TEMPLATES.map((tmpl) => (
              <div
                key={tmpl.id}
                onClick={() => setSelectedTemplate(tmpl)}
                className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
                  selectedTemplate.id === tmpl.id
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-md'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {tmpl.category}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${
                    tmpl.difficulty === 'DIFICIL' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {tmpl.difficulty}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">{tmpl.title}</h4>
              </div>
            ))}
          </div>
        </div>

        {/* Launch Button */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
          <div className="text-xs text-slate-400 font-mono">
            {emailsText.split(/[\n,;]+/).filter(e => e.includes('@')).length} colaboradores mapeados para este teste.
          </div>
          <button
            type="submit"
            disabled={loadingLaunch}
            className="px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            {loadingLaunch ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Registrando Teste...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Disparar Campanha & Gravar Histórico
              </>
            )}
          </button>
        </div>

        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </form>

      {/* Active Campaign Result Dashboard */}
      {activeCampaign && (
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-surface to-surface-card border border-surface-border space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border flex-wrap gap-2">
            <div>
              <span className="text-xs uppercase font-mono text-amber-400 font-bold block">
                Painel do Teste Gravado:
              </span>
              <h3 className="text-lg font-bold text-white">{activeCampaign.title}</h3>
              <p className="text-xs text-slate-400 font-mono">
                Organização: <strong>{activeCampaign.organization}</strong> • Data: {new Date(activeCampaign.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold">
              {activeCampaign.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[11px]">Total de E-mails</span>
              <span className="text-xl font-bold text-white">{activeCampaign.stats.totalEmployeesTargeted}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[11px]">Clicaram no Link</span>
              <span className="text-xl font-bold text-amber-400">{activeCampaign.stats.linksClicked}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[11px]">Digitaram Credenciais</span>
              <span className="text-xl font-bold text-rose-400">{activeCampaign.stats.credentialsSubmitted}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[11px]">Notificaram TI</span>
              <span className="text-xl font-bold text-emerald-400">{activeCampaign.stats.reportedToSecurity}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full border-2 border-amber-500 bg-amber-500/10 flex items-center justify-center font-mono font-bold text-amber-400 text-lg">
                {activeCampaign.stats.awarenessGrade}
              </div>
              <div>
                <span className="text-xs text-slate-400 font-mono block">Índice de Vulnerabilidade Humana</span>
                <span className="text-sm font-bold text-white">
                  {activeCampaign.stats.vulnerabilityIndexPercent}% de taxa de comprometimento
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-md font-sans">
              {activeCampaign.notes}
            </p>
          </div>
        </div>
      )}

      {/* Historical Campaigns Search by Organization */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              Histórico de Testes Realizados ({campaignHistory.length})
            </h3>
          </div>
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => {
                setHistorySearchQuery(e.target.value);
                fetchHistory(e.target.value);
              }}
              placeholder="Pesquisar por organização ou título..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white outline-none focus:border-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        {campaignHistory.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono py-4 text-center">
            Nenhuma campanha gravada ainda. Preencha o formulário acima e clique em &ldquo;Disparar Campanha&rdquo; para salvar o primeiro teste!
          </p>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {campaignHistory.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectHistoricalCampaign(c)}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase">
                      {c.organization}
                    </span>
                    <span className="font-bold text-white group-hover:text-amber-400 transition-colors">
                      {c.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Modelo: {c.templateTitle} • {c.stats.totalEmployeesTargeted} colaboradores • Data: {new Date(c.timestamp).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Vulnerabilidade</span>
                    <span className="font-bold text-rose-400">{c.stats.vulnerabilityIndexPercent}%</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-amber-400">
                    {c.stats.awarenessGrade}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
