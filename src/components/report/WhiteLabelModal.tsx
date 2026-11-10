'use client';

import React, { useState } from 'react';
import { X, Building2, Upload, UserCheck, FileText, Check } from 'lucide-react';
import { WhiteLabelConfig } from '@/core/types/security';

interface WhiteLabelModalProps {
  currentConfig?: WhiteLabelConfig;
  onSave: (config: WhiteLabelConfig) => void;
  onClose: () => void;
}

export default function WhiteLabelModal({ currentConfig, onSave, onClose }: WhiteLabelModalProps) {
  const [clientName, setClientName] = useState(currentConfig?.clientName || '');
  const [clientLogoUrl, setClientLogoUrl] = useState(currentConfig?.clientLogoUrl || '');
  const [consultantName, setConsultantName] = useState(currentConfig?.consultantName || 'Denilson Ferreira de Araújo');
  const [consultantTitle, setConsultantTitle] = useState(currentConfig?.consultantTitle || 'Auditor Líder de Segurança Cibernética | Dev & Sec');
  const [executiveOpinion, setExecutiveOpinion] = useState(
    currentConfig?.executiveOpinion ||
      'Auditoria técnica realizada com conformidade estrita aos padrões OWASP, NIST e CIS Controls. Recomenda-se a remediação prioritária das vulnerabilidades críticas apontadas neste laudo antes da homologação em ambiente produtivo.'
  );

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setClientLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave({
      clientName: clientName.trim() || undefined,
      clientLogoUrl: clientLogoUrl || undefined,
      consultantName: consultantName.trim() || undefined,
      consultantTitle: consultantTitle.trim() || undefined,
      executiveOpinion: executiveOpinion.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-surface border border-surface-border shadow-2xl p-6 sm:p-8 space-y-6 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <Building2 className="w-3.5 h-3.5" />
            White-Label & Personalização de Laudo
          </div>
          <h3 className="text-xl font-bold text-white">Personalizar Relatório Oficial (PDF)</h3>
          <p className="text-xs text-slate-400">
            Configure o nome do cliente, logotipo corporativo e o parecer do auditor para impressão.
          </p>
        </div>

        <div className="space-y-4 text-xs font-mono">
          {/* Client Company Name */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Nome da Empresa do Cliente:</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: Banco Alfa S.A. / TechCorp Soluções"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Client Logo Upload */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block">Logotipo do Cliente (PNG/JPG):</label>
            <div className="flex items-center gap-4">
              {clientLogoUrl ? (
                <div className="w-20 h-12 rounded-lg border border-slate-700 bg-white p-1 flex items-center justify-center relative overflow-hidden">
                  <img src={clientLogoUrl} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-12 rounded-lg border border-dashed border-slate-700 bg-slate-900/50 flex items-center justify-center text-slate-500 text-[10px]">
                  Sem logo
                </div>
              )}
              <label className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center gap-2 transition-colors">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Carregar Imagem</span>
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
              {clientLogoUrl && (
                <button
                  type="button"
                  onClick={() => setClientLogoUrl('')}
                  className="text-rose-400 hover:underline text-[11px]"
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          {/* Consultant Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Nome do Auditor / Consultor:</label>
              <input
                type="text"
                value={consultantName}
                onChange={(e) => setConsultantName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Cargo / Certificação:</label>
              <input
                type="text"
                value={consultantTitle}
                onChange={(e) => setConsultantTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Executive Opinion */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">Parecer Técnico do Especialista:</label>
            <textarea
              rows={3}
              value={executiveOpinion}
              onChange={(e) => setExecutiveOpinion(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white outline-none focus:border-emerald-500 text-xs font-sans leading-relaxed"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Check className="w-4 h-4" />
            Aplicar no Laudo
          </button>
        </div>
      </div>
    </div>
  );
}
