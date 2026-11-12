'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  ShieldAlert,
  ShieldCheck,
  Users,
  Award,
  AlertCircle,
  AlertTriangle,
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
  ExternalLink,
  GraduationCap,
  Eye,
  MousePointerClick,
  KeyRound,
  Shield,
  X,
  Sparkles,
  RefreshCw,
  Radio,
  Globe,
  Server,
} from 'lucide-react';
import { PHISHING_TEMPLATES } from '@/modules/phishing/campaign-manager';
import { PhishingTemplate, PhishingDispatchMode } from '@/core/types/phishing';
import { StoredPhishingCampaign } from '@/core/storage/phishing-store';

export default function PhishingCampaignView() {
  const [selectedTemplate, setSelectedTemplate] = useState<PhishingTemplate>(PHISHING_TEMPLATES[0]);
  const [activeTab, setActiveTab] = useState<'create' | 'telemetry' | 'just_in_time'>('create');

  // Campaign Inputs
  const [organization, setOrganization] = useState('devesec');
  const [campaignTitle, setCampaignTitle] = useState('Teste para a Empresa devesec mês Novembro 2026');
  const [emailsText, setEmailsText] = useState(
    'contato@devesec.com'
  );

  // Real Dispatch & Telemetry Configuration
  const [dispatchMode, setDispatchMode] = useState<PhishingDispatchMode>('RESEND');
  const [resendConfigured, setResendConfigured] = useState<boolean>(false);
  const [senderEmail, setSenderEmail] = useState('seguranca@info.devesec.com');
  const [publicBaseUrl, setPublicBaseUrl] = useState('http://localhost:3000');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('465');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  const [activeCampaign, setActiveCampaign] = useState<StoredPhishingCampaign | null>(null);
  const [loadingLaunch, setLoadingLaunch] = useState(false);
  const [refreshingTelemetry, setRefreshingTelemetry] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // History & Search
  const [campaignHistory, setCampaignHistory] = useState<StoredPhishingCampaign[]>([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Educational Modal State
  const [showLearningModal, setShowLearningModal] = useState(false);

  // Fetch past campaigns
  const fetchHistory = useCallback(async (q?: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/phishing/campaigns?q=${encodeURIComponent(q || '')}`);
      if (res.ok) {
        const data = await res.json();
        setCampaignHistory(data.campaigns || []);
        const hasResend = Boolean(data.resendConfigured);
        setResendConfigured(hasResend);
        if (!hasResend) {
          setDispatchMode((prev) => (prev === 'RESEND' ? 'SIMULATED' : prev));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const refreshActiveCampaign = useCallback(async (campaignId: string) => {
    try {
      setRefreshingTelemetry(true);
      const res = await fetch(`/api/phishing/campaigns?id=${encodeURIComponent(campaignId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.campaign) {
          setActiveCampaign(data.campaign);
        }
      }
    } catch {
      // ignore
    } finally {
      setRefreshingTelemetry(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPublicBaseUrl(window.location.origin);
    }
    fetchHistory();
  }, [fetchHistory]);

  // Live auto-refresh polling every 5 seconds when viewing telemetry of a real campaign
  useEffect(() => {
    if (
      activeTab === 'telemetry' &&
      activeCampaign &&
      activeCampaign.dispatchMode &&
      activeCampaign.dispatchMode !== 'SIMULATED'
    ) {
      const interval = setInterval(() => {
        refreshActiveCampaign(activeCampaign.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab, activeCampaign, refreshActiveCampaign]);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingLaunch(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const emailList = emailsText
      .split(/[\n,;]+/)
      .map((e) => e.trim())
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
          dispatchMode,
          senderEmail: senderEmail.trim(),
          publicBaseUrl: publicBaseUrl.trim(),
          smtpConfig:
            dispatchMode === 'SMTP'
              ? {
                  host: smtpHost.trim(),
                  port: Number(smtpPort) || 465,
                  secure: Number(smtpPort) === 465,
                  user: smtpUser.trim(),
                  pass: smtpPass,
                }
              : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Falha ao disparar campanha.');
        return;
      }

      if (data.campaign) {
        setActiveCampaign(data.campaign);
        fetchHistory();

        if (dispatchMode !== 'SIMULATED' && data.deliverySummary) {
          const { delivered, failed, errors } = data.deliverySummary;
          if (delivered > 0) {
            setActiveTab('telemetry');
            setSuccessMsg(
              `Disparo Real concluído: ${delivered} e-mail(s) entregue(s) via ${dispatchMode} (${senderEmail}).` +
                (failed > 0 ? ` ${failed} falha(s): ${errors.join(' | ')}` : '')
            );
          } else {
            setErrorMsg(
              `Nenhum e-mail pôde ser entregue. Detalhe: ${errors?.join(' | ') || 'Verifique a configuração do domínio/API.'}`
            );
          }
        } else {
          setActiveTab('telemetry');
          setSuccessMsg(`Campanha simulada "${data.campaign.title}" registrada no histórico.`);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro de comunicação com o servidor.');
    } finally {
      setLoadingLaunch(false);
    }
  };

  const handleSelectHistoricalCampaign = (camp: StoredPhishingCampaign) => {
    setActiveCampaign(camp);
    setOrganization(camp.organization);
    setCampaignTitle(camp.title);
    const tmpl = PHISHING_TEMPLATES.find((t) => t.id === camp.templateId);
    if (tmpl) setSelectedTemplate(tmpl);
    setActiveTab('telemetry');
  };

  const handleDeleteHistoricalCampaign = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/phishing/campaigns?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setCampaignHistory((prev) => prev.filter((item) => item.id !== id));
        if (activeCampaign?.id === id) {
          setActiveCampaign(null);
        }
      }
    } catch {
      // ignore
    }
  };

  // Funnel calculations helper
  const stats = activeCampaign?.stats || {
    totalEmployeesTargeted: emailsText.split(/[\n,;]+/).filter((e) => e.includes('@')).length || 15,
    emailsDelivered: Math.round((emailsText.split(/[\n,;]+/).filter((e) => e.includes('@')).length || 15) * 0.98),
    emailsOpened: Math.round((emailsText.split(/[\n,;]+/).filter((e) => e.includes('@')).length || 15) * 0.85),
    linksClicked: Math.round((emailsText.split(/[\n,;]+/).filter((e) => e.includes('@')).length || 15) * 0.4),
    credentialsSubmitted: Math.round((emailsText.split(/[\n,;]+/).filter((e) => e.includes('@')).length || 15) * 0.2),
    reportedToSecurity: Math.round((emailsText.split(/[\n,;]+/).filter((e) => e.includes('@')).length || 15) * 0.25),
    vulnerabilityIndexPercent: 20,
    humanVulnerabilityRate: 20,
    awarenessGrade: 'B' as const,
  };

  const total = stats.totalEmployeesTargeted || 1;
  const openedPct = Math.round((stats.emailsOpened / total) * 100);
  const clickedPct = Math.round((stats.linksClicked / total) * 100);
  const submittedPct = Math.round((stats.credentialsSubmitted / total) * 100);
  const reportedPct = Math.round((stats.reportedToSecurity / total) * 100);
  const hvr = stats.humanVulnerabilityRate ?? stats.vulnerabilityIndexPercent;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
          <Mail className="w-3.5 h-3.5" />
          Simulador de Phishing Corporativo & Conscientização Humana
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Simulador de Phishing & <span className="text-amber-400">Human Risk</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
          Dispare testes de engenharia social com marcas brasileiras de alta credibilidade, acompanhe o funil de telemetria
          em tempo real e capacite colaboradores no momento exato do clique com a metodologia <strong>Just-in-Time Learning</strong>.
        </p>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'create'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            1. Configurar & Disparar
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'telemetry'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            2. Telemetria do Funil & HVR ({hvr}%)
          </button>

          <button
            onClick={() => setActiveTab('just_in_time')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all ${
              activeTab === 'just_in_time'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            3. Treinamento Just-in-Time (Momento Educativo)
          </button>
        </div>
      </div>

      {/* TAB 1: CREATE & LAUNCH CAMPAIGN */}
      {activeTab === 'create' && (
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
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500 leading-relaxed font-mono"
              />
            </div>
          </div>

          {/* Real Dispatch Engine & Telemetry URL Configuration */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4 text-xs font-mono">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <span className="text-slate-200 font-bold flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                Canal de Envio &amp; Telemetria Real
              </span>
              {resendConfigured ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Resend API Key Ativa (.env)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                  Resend API Key não detectada
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setDispatchMode('RESEND')}
                className={`p-3 rounded-lg border text-left transition-all space-y-1 ${
                  dispatchMode === 'RESEND'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400" />
                  Envio Real (Resend)
                </div>
                <p className="text-[10px] text-slate-400">
                  Subdomínio dedicado (@info.devesec.com) + Pixel + Clique Ao Vivo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDispatchMode('SMTP')}
                className={`p-3 rounded-lg border text-left transition-all space-y-1 ${
                  dispatchMode === 'SMTP'
                    ? 'bg-cyan-500/15 border-cyan-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  SMTP Customizado / Gmail
                </div>
                <p className="text-[10px] text-slate-400">
                  Envio direto via servidor SMTP próprio ou Gmail (Senha de App).
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDispatchMode('SIMULATED')}
                className={`p-3 rounded-lg border text-left transition-all space-y-1 ${
                  dispatchMode === 'SIMULATED'
                    ? 'bg-amber-500/15 border-amber-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Simulação Offline
                </div>
                <p className="text-[10px] text-slate-400">
                  Não dispara e-mails reais; gera estimativa estatística para demonstração.
                </p>
              </button>
            </div>

            {dispatchMode !== 'SIMULATED' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold block text-[11px]">
                    E-mail Remetente Autenticado (From):
                  </label>
                  <input
                    type="email"
                    required
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="seguranca@info.devesec.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white outline-none focus:border-emerald-500"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['rh@info.devesec.com', 'seguranca@info.devesec.com', 'financeiro@info.devesec.com'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSenderEmail(preset)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        {preset.split('@')[0]}@
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold flex items-center gap-1 text-[11px]">
                    <Globe className="w-3 h-3 text-cyan-400" />
                    URL Pública da Plataforma (Link de Clique/Pixel):
                  </label>
                  <input
                    type="url"
                    required
                    value={publicBaseUrl}
                    onChange={(e) => setPublicBaseUrl(e.target.value)}
                    placeholder="http://localhost:3000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 outline-none focus:border-cyan-500"
                  />
                  <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                    Para testar no seu PC use <code className="text-slate-300">http://localhost:3000</code>. Para cliques externos (celular/home office), informe a URL pública ou túnel HTTPS (ex.: Cloudflare Tunnel).
                  </p>
                </div>

                {dispatchMode === 'SMTP' && (
                  <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Servidor SMTP (Host)</label>
                      <input
                        type="text"
                        required
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp.gmail.com"
                        className="w-full px-2.5 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Porta</label>
                      <input
                        type="text"
                        required
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="465"
                        className="w-full px-2.5 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Usuário / E-mail</label>
                      <input
                        type="text"
                        required
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="usuario@gmail.com"
                        className="w-full px-2.5 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Senha / Senha de App</label>
                      <input
                        type="password"
                        required
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="16 caracteres"
                        className="w-full px-2.5 py-2 rounded bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Template Selector with Brands */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-slate-400 block">
                Selecione o Modelo com Marca Brasileira Homologada:
              </span>
              <span className="text-[11px] font-mono text-amber-400">
                {PHISHING_TEMPLATES.length} modelos de alta conversão
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PHISHING_TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-4 rounded-xl border cursor-pointer select-none transition-all space-y-2 ${
                    selectedTemplate.id === tmpl.id
                      ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                      {tmpl.brand || tmpl.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        tmpl.difficulty === 'DIFICIL'
                          ? 'text-rose-400'
                          : tmpl.difficulty === 'MEDIO'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {tmpl.difficulty}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white leading-snug line-clamp-2">{tmpl.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2">{tmpl.subject}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Template Live Preview Card */}
          <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono uppercase font-bold text-slate-400 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                Pré-visualização do E-mail Simulado
              </span>
              <button
                type="button"
                onClick={() => setShowLearningModal(true)}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Ver Tela Educativa do Colaborador &rarr;
              </button>
            </div>

            <div className="text-xs font-mono space-y-1.5 text-slate-300">
              <div>
                <span className="text-slate-500">De: </span>
                <span className="text-amber-300">
                  {dispatchMode !== 'SIMULATED' ? `${senderEmail} (${selectedTemplate.senderMask.split('<')[0].trim()})` : selectedTemplate.senderMask}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Assunto: </span>
                <span className="text-white font-bold">{selectedTemplate.subject}</span>
              </div>
              {selectedTemplate.fakeUrl && (
                <div>
                  <span className="text-slate-500">Rota de Telemetria Real: </span>
                  <span className="text-cyan-400 underline">
                    {dispatchMode !== 'SIMULATED' ? `${publicBaseUrl}/api/phishing/track?token=...` : selectedTemplate.fakeUrl}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded bg-slate-900/80 border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-sans">
              {selectedTemplate.bodyPreview}
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-mono text-slate-500 block mb-1">
                Indicadores Técnicos de Comprometimento (IoC):
              </span>
              <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
                {selectedTemplate.indicatorsOfCompromise.map((ioc, i) => (
                  <li key={i}>{ioc}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Launch Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 flex-wrap gap-3">
            <div className="text-xs text-slate-400 font-mono">
              {emailsText.split(/[\n,;]+/).filter((e) => e.includes('@')).length} destinatário(s) — Modo:{' '}
              <strong className={dispatchMode === 'SIMULATED' ? 'text-amber-400' : 'text-emerald-400'}>
                {dispatchMode === 'RESEND' ? 'Resend Real (@info.devesec.com)' : dispatchMode === 'SMTP' ? 'SMTP Real' : 'Simulação Offline'}
              </strong>
            </div>
            <button
              type="submit"
              disabled={loadingLaunch}
              className={`px-6 py-2.5 rounded-lg disabled:opacity-50 font-bold text-xs uppercase tracking-wider font-mono flex items-center gap-2 shadow-lg transition-all ${
                dispatchMode === 'SIMULATED'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
              }`}
            >
              {loadingLaunch ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {dispatchMode === 'SIMULATED' ? 'Registrando Teste...' : 'Enviando E-mails Reais...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {dispatchMode === 'SIMULATED' ? 'Registrar Simulação Offline' : 'Enviar E-mails Reais & Ativar Telemetria'}
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: LIVE TELEMETRY FUNNEL & HVR */}
      {activeTab === 'telemetry' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  {activeCampaign?.organization || organization}
                </span>
                {activeCampaign?.dispatchMode && activeCampaign.dispatchMode !== 'SIMULATED' ? (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    TELEMETRIA AO VIVO ({activeCampaign.dispatchMode})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-800 text-slate-400 border border-slate-700">
                    SIMULAÇÃO OFFLINE
                  </span>
                )}
                <span className="text-xs font-mono text-slate-400">
                  Campanha: {activeCampaign?.title || campaignTitle}
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mt-1">Funil de Telemetria de Engajamento Humano</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {activeCampaign && activeCampaign.dispatchMode !== 'SIMULATED' && (
                <button
                  type="button"
                  onClick={() => refreshActiveCampaign(activeCampaign.id)}
                  disabled={refreshingTelemetry}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-500/25 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshingTelemetry ? 'animate-spin' : ''}`} />
                  Atualizar Telemetria
                </button>
              )}
              <button
                onClick={() => setShowLearningModal(true)}
                className="px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold flex items-center gap-1.5 hover:bg-cyan-500/25 transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                Simular Experiência do Colaborador
              </button>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase">1. Disparados</span>
              <span className="text-lg font-bold text-white">{stats.totalEmployeesTargeted}</span>
              <span className="text-[10px] text-slate-400 block">100% dos alvos</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase">2. Entregues</span>
              <span className="text-lg font-bold text-cyan-400">{stats.emailsDelivered}</span>
              <span className="text-[10px] text-slate-400 block">
                {Math.round((stats.emailsDelivered / total) * 100)}% entregues
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase">3. Abertos</span>
              <span className="text-lg font-bold text-blue-400">{stats.emailsOpened}</span>
              <span className="text-[10px] text-slate-400 block">{openedPct}% abertos</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-slate-500 block text-[10px] uppercase">4. Clicaram</span>
              <span className="text-lg font-bold text-amber-400">{stats.linksClicked}</span>
              <span className="text-[10px] text-amber-400/80 block">{clickedPct}% taxa de clique</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-rose-500/30 space-y-1">
              <span className="text-rose-400 block text-[10px] uppercase font-bold">5. Credenciais</span>
              <span className="text-lg font-bold text-rose-400">{stats.credentialsSubmitted}</span>
              <span className="text-[10px] text-rose-400/80 block">
                {activeCampaign?.dispatchMode !== 'SIMULATED' ? 'Protegido (Just-in-Time)' : `${submittedPct}% vulneráveis`}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
              <span className="text-emerald-400 block text-[10px] uppercase font-bold">6. Reportaram</span>
              <span className="text-lg font-bold text-emerald-400">{stats.reportedToSecurity}</span>
              <span className="text-[10px] text-emerald-400/80 block">{reportedPct}% defensores</span>
            </div>
          </div>

          {/* Live Per-Recipient Telemetry Audit Table (when real recipients exist) */}
          {activeCampaign?.recipients && activeCampaign.recipients.length > 0 && (
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-mono uppercase font-bold text-emerald-400 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Rastreamento Individual em Tempo Real ({activeCampaign.recipients.length} destinatário(s))
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Atualização automática a cada 5s | Remetente: {activeCampaign.senderEmail}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="p-2.5">Destinatário</th>
                      <th className="p-2.5">Entrega</th>
                      <th className="p-2.5">Abriu E-mail (Pixel)</th>
                      <th className="p-2.5">Clicou no Link</th>
                      <th className="p-2.5">Reportou</th>
                      <th className="p-2.5">IP / Origem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {activeCampaign.recipients.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="p-2.5 font-bold text-white">{rec.email}</td>
                        <td className="p-2.5">
                          {rec.delivered ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ENVIADO
                            </span>
                          ) : (
                            <span
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              title={rec.deliveryError || 'Erro de entrega'}
                            >
                              FALHOU
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-300">
                          {rec.openedAt ? (
                            <span className="text-blue-400 font-bold">
                              ✅ {new Date(rec.openedAt).toLocaleTimeString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-slate-600">Aguardando...</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {rec.clickedAt ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🖱️ {new Date(rec.clickedAt).toLocaleTimeString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-2.5">
                          {rec.reportedAt ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              🛡️ {new Date(rec.reportedAt).toLocaleTimeString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-400">
                          {rec.lastIp ? (
                            <span title={rec.lastUserAgent}>{rec.lastIp}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Visual Conversion Funnel Bars */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <span className="text-xs font-mono uppercase font-bold text-slate-300 block">
              Progressão do Funil de Exposição (% do Total):
            </span>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">E-mails Entregues na Caixa de Entrada</span>
                  <span className="text-cyan-400 font-bold">{Math.round((stats.emailsDelivered / total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.round((stats.emailsDelivered / total) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">E-mails Abertos pelos Colaboradores</span>
                  <span className="text-blue-400 font-bold">{openedPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${openedPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-amber-300">Clicaram no Link Educativo Simulado</span>
                  <span className="text-amber-400 font-bold">{clickedPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${clickedPct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-emerald-400 font-bold">Acionaram o SOC / Reportaram ao Time de Segurança</span>
                  <span className="text-emerald-400 font-bold">{reportedPct}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${reportedPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HVR Scorecard Card */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl border-2 border-amber-500 bg-amber-500/10 flex flex-col items-center justify-center font-mono font-bold text-amber-400">
                <span className="text-2xl">{stats.awarenessGrade}</span>
                <span className="text-[9px] uppercase text-slate-400">Nota</span>
              </div>
              <div>
                <span className="text-xs font-mono text-slate-400 block">Taxa de Vulnerabilidade Humana (HVR):</span>
                <h4 className="text-2xl font-bold text-white font-mono">
                  {hvr}% <span className="text-xs font-normal text-slate-400">dos colaboradores vulneráveis</span>
                </h4>
                <p className="text-xs text-slate-400 max-w-md mt-0.5">
                  {hvr <= 5
                    ? 'Excelente resiliência corporativa. A grande maioria dos funcionários identificou a ameaça.'
                    : hvr <= 20
                    ? 'Risco moderado. Recomendada aplicação de treinamento de reforço para os setores vulneráveis.'
                    : 'Risco crítico de exposição a links suspeitos. A organização necessita de treinamento obrigatório imediato.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-500 text-white font-mono text-xs font-bold flex items-center gap-2 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Novo Disparo
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: JUST-IN-TIME LEARNING (MOMENTO EDUCATIVO) */}
      {activeTab === 'just_in_time' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              <h3 className="text-lg font-bold text-white">Treinamento Just-in-Time (Momento Educativo Imediato)</h3>
            </div>
            <span className="text-xs font-mono text-cyan-400">Feedback Imediato ao Clicar</span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Estudos de neurociência comportamental comprovam que o melhor momento para ensinar um colaborador sobre cibersegurança
            é <strong>no exato segundo em que ele comete o erro</strong>. Quando a vítima clica ou digita dados no link falso,
            a DEV & SEC exibe imediatamente uma página educativa que desconstrói a farsa de forma acolhedora e instrutiva.
          </p>

          {/* Educational Landing Mockup */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-5 shadow-2xl">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">
                  ⚠️ ATENÇÃO: Esta foi uma simulação de segurança autorizada pela sua empresa!
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Fique tranquilo: <strong>seus dados não foram vazados e seu computador está seguro</strong>. Esta ação foi coordenada
                  pelo time de Segurança da Informação da <strong>{organization}</strong> em parceria com a DEV & SEC para avaliar nossa
                  resiliência contra criminosos virtuais.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Os 4 Sinais Visuais que Denunciavam este Ataque ({selectedTemplate.title}):
              </h5>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                {(selectedTemplate.redFlags || [
                  { title: '1. Domínio Não Corporativo', explanation: 'O e-mail foi enviado de um endereço que não é o oficial da sua organização.' },
                  { title: '2. Urgência Excessiva', explanation: 'Mensagens com prazos de horas ou ameaça de bloqueio usam medo para impedir reflexão.' },
                  { title: '3. Link Não Homologado', explanation: 'A URL de destino difere do portal oficial do serviço ou intranet.' },
                  { title: '4. Pedido Incomum de Credenciais', explanation: 'Empresas legítimas não solicitam revalidação de senha por links repentinos.' },
                ]).map((flag, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-amber-400 font-bold block">{flag.title}</span>
                    <p className="text-slate-400 text-[11px] font-sans">{flag.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-xs font-mono text-slate-300">
                <span className="text-emerald-400 font-bold block">O que fazer da próxima vez?</span>
                Ao suspeitar de qualquer e-mail, não clique. Encaminhe diretamente para a equipe de segurança da empresa.
              </div>
              <span className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Treinamento Concluído com Sucesso
              </span>
            </div>
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
            Nenhuma campanha gravada ainda. Preencha o formulário e clique em &ldquo;Disparar Campanha&rdquo; para salvar o primeiro teste!
          </p>
        ) : (
          <div className="space-y-3 font-mono text-xs">
            {campaignHistory.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectHistoricalCampaign(c)}
                className="relative p-4 pr-12 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <button
                  type="button"
                  onClick={(e) => handleDeleteHistoricalCampaign(e, c.id)}
                  title="Excluir teste do histórico"
                  aria-label={`Excluir teste ${c.title}`}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

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
                    <span className="text-[10px] text-slate-500 block">Vulnerabilidade (HVR)</span>
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

      {/* POPUP / MODAL DE TREINAMENTO JUST-IN-TIME INTERATIVO */}
      {showLearningModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-950 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowLearningModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">
                  Simulação de Treinamento Just-in-Time
                </h4>
                <p className="text-xs text-slate-300">
                  Esta é a exata experiência visual que o colaborador vivencia ao clicar na simulação.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-mono uppercase font-bold text-slate-300">
                4 Sinais que Denunciavam o E-mail de {selectedTemplate.brand || selectedTemplate.category}:
              </h5>
              <div className="space-y-2 text-xs font-mono">
                {(selectedTemplate.redFlags || [
                  { title: '1. Domínio do Remetente', explanation: 'Não correspondia ao domínio corporativo homologado.' },
                  { title: '2. Senso de Urgência', explanation: 'Pressão excessiva para agir sem reflexão.' },
                  { title: '3. Link Falso', explanation: 'Endereço web externo não autorizado.' },
                  { title: '4. Coleta de Senha', explanation: 'Solicitação indevida de dados confidenciais.' },
                ]).map((rf, idx) => (
                  <div key={idx} className="p-3 rounded bg-slate-900 border border-slate-800">
                    <span className="text-amber-400 font-bold block">{rf.title}</span>
                    <span className="text-slate-400 text-[11px] font-sans">{rf.explanation}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLearningModal(false)}
                className="px-5 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold font-mono text-xs uppercase hover:bg-amber-400 transition-all"
              >
                Fechar Demonstração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
