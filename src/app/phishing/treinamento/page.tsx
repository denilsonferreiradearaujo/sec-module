import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  MailWarning,
  Lock,
} from 'lucide-react';
import { PHISHING_TEMPLATES } from '@/modules/phishing/campaign-manager';
import { getPhishingCampaignById } from '@/core/storage/phishing-store';

export const dynamic = 'force-dynamic';

interface TrainingPageProps {
  searchParams: {
    camp?: string;
    tmpl?: string;
    status?: string;
  };
}

export default async function PhishingTrainingPage({ searchParams }: TrainingPageProps) {
  const campId = searchParams.camp || '';
  const tmplParam = searchParams.tmpl || '';
  const status = searchParams.status === 'reported' ? 'reported' : 'clicked';

  const campaign = campId ? await getPhishingCampaignById(campId) : null;
  const templateId = tmplParam || campaign?.templateId || PHISHING_TEMPLATES[0].id;
  const template = PHISHING_TEMPLATES.find((t) => t.id === templateId) || PHISHING_TEMPLATES[0];
  const orgName = campaign?.organization || 'sua Organização';

  const isReported = status === 'reported';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-3xl space-y-6">
        {/* Top Banner */}
        <div
          className={`p-6 sm:p-8 rounded-2xl border shadow-2xl space-y-4 ${
            isReported
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-amber-950/25 border-amber-500/40'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                isReported
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
              }`}
            >
              {isReported ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              {isReported
                ? 'TREINAMENTO DE SEGURANÇA — COMPORTAMENTO EXEMPLAR'
                : 'TESTE DE CONSCIENTIZAÇÃO AUTORIZADO — JUST-IN-TIME LEARNING'}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Organização: <strong className="text-white">{orgName}</strong>
            </span>
          </div>

          {isReported ? (
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Parabéns! Você identificou e reportou uma simulação de Phishing.
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Sua postura preventiva ao desconfiar da mensagem e acionar o canal de segurança protegeu a rede
                corporativa de <strong className="text-emerald-400">{orgName}</strong> contra ataques reais de engenharia social.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Calma! Este foi um <span className="text-amber-400">Teste Simulado de Phishing</span>.
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Nenhuma senha ou dado pessoal foi coletado. Esta simulação faz parte do programa de conscientização em
                segurança cibernética de <strong className="text-white">{orgName}</strong> para capacitar a equipe a
                reconhecer sinais de fraude antes que ocorra um ataque real.
              </p>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3 text-xs text-slate-300 font-mono">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>Privacidade Garantida:</strong> Esta página educativa não coleta credenciais nem instala arquivos no seu dispositivo.
            </span>
          </div>
        </div>

        {/* Simulated Email Analysis */}
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <MailWarning className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white uppercase font-mono tracking-wide">
              Raio-X do E-mail Recebido ({template.brand || template.category})
            </h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
            <div>
              <span className="text-slate-500">Assunto da Isca: </span>
              <span className="text-white font-bold">{template.subject}</span>
            </div>
            <div>
              <span className="text-slate-500">Objetivo do Golpe Simulado: </span>
              <span className="text-slate-300">{template.learningObjective}</span>
            </div>
          </div>

          {/* Red Flags Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              Sinais de Alerta (Red Flags) que você deve observar no dia a dia:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(template.redFlags && template.redFlags.length > 0
                ? template.redFlags
                : template.indicatorsOfCompromise.map((ioc, i) => ({
                    title: `Indicador ${i + 1}`,
                    explanation: ioc,
                  }))
              ).map((rf, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5"
                >
                  <span className="text-xs font-bold text-amber-300 block font-mono">
                    {rf.title}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{rf.explanation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Golden Rules */}
          <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
              <GraduationCap className="w-4 h-4" />
              3 Regras de Ouro Antes de Clicar em Qualquer Link:
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Confirme o domínio real do remetente:</strong> Desconfie de subdomínios externos ou domínios parecidos com a marca.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Desconfie de urgência artificial:</strong> Prazos curtos (&quot;até 18h&quot;, &quot;conta suspensa&quot;) servem para impedir você de pensar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Valide em canal separado:</strong> Em dúvida sobre RH, PIX, boletos ou TI, pergunte diretamente no canal oficial da empresa.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
