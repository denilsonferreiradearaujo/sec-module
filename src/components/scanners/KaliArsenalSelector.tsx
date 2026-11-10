'use client';

import React, { useState } from 'react';
import { Terminal, Shield, ChevronDown, ChevronUp, Cpu, Database, FolderSearch, Globe2, Sparkles } from 'lucide-react';
import { KaliArsenalConfig } from '@/core/types/kali-tools';

interface KaliArsenalSelectorProps {
  config: KaliArsenalConfig;
  onChange: (newConfig: KaliArsenalConfig) => void;
}

export default function KaliArsenalSelector({ config, onChange }: KaliArsenalSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleTool = (tool: keyof Omit<KaliArsenalConfig, 'intensity' | 'customParameters'>) => {
    onChange({
      ...config,
      [tool]: !config[tool],
    });
  };

  const enableAll = () => {
    onChange({
      ...config,
      nmap: true,
      nikto: true,
      gobuster: true,
      nuclei: true,
      sqlmap: true,
    });
  };

  const resetAll = () => {
    onChange({
      ...config,
      nmap: false,
      nikto: false,
      gobuster: false,
      nuclei: false,
      sqlmap: false,
    });
  };

  const activeCount = [config.nmap, config.nikto, config.gobuster, config.nuclei, config.sqlmap].filter(Boolean).length;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 overflow-hidden transition-all">
      <div
        onClick={() => setExpanded(!expanded)}
        className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-900/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Arsenal Kali Linux & Motores Avançados
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                activeCount > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}>
                {activeCount > 0 ? `${activeCount} Ativos` : 'Opcionais'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Nmap, Nikto, Gobuster/FFUF, Nuclei e SQLmap com fallback nativo em TypeScript.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
              Orquestração híbrida pronta
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="text-slate-400 p-1 hover:text-white"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4 bg-slate-950/40">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-mono text-[11px]">Selecione os motores a disparar:</span>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <button
                type="button"
                onClick={enableAll}
                className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
              >
                Ativar Todos (Arsenal Máximo)
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* NMAP */}
            <div
              onClick={() => toggleTool('nmap')}
              className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                config.nmap ? 'bg-cyan-500/10 border-cyan-500/50 shadow-sm' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Cpu className={`w-4 h-4 mt-0.5 ${config.nmap ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-white">Nmap (Network Mapper)</span>
                  <input type="checkbox" checked={config.nmap} readOnly className="rounded text-cyan-500" />
                </div>
                <p className="text-[11px] text-slate-400">Varredura profunda de portas TCP e identificação de banners.</p>
              </div>
            </div>

            {/* NIKTO */}
            <div
              onClick={() => toggleTool('nikto')}
              className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                config.nikto ? 'bg-emerald-500/10 border-emerald-500/50 shadow-sm' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Globe2 className={`w-4 h-4 mt-0.5 ${config.nikto ? 'text-emerald-400' : 'text-slate-500'}`} />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-white">Nikto Server Hardening</span>
                  <input type="checkbox" checked={config.nikto} readOnly className="rounded text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-400">Audita métodos HTTP perigosos (TRACE/PUT) e falhas de config.</p>
              </div>
            </div>

            {/* GOBUSTER */}
            <div
              onClick={() => toggleTool('gobuster')}
              className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                config.gobuster ? 'bg-amber-500/10 border-amber-500/50 shadow-sm' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <FolderSearch className={`w-4 h-4 mt-0.5 ${config.gobuster ? 'text-amber-400' : 'text-slate-500'}`} />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-white">Gobuster / FFUF Fuzzing</span>
                  <input type="checkbox" checked={config.gobuster} readOnly className="rounded text-amber-500" />
                </div>
                <p className="text-[11px] text-slate-400">Descobre arquivos sensíveis vazados: .env, backups, .git/ e admin.</p>
              </div>
            </div>

            {/* NUCLEI */}
            <div
              onClick={() => toggleTool('nuclei')}
              className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                config.nuclei ? 'bg-rose-500/10 border-rose-500/50 shadow-sm' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Sparkles className={`w-4 h-4 mt-0.5 ${config.nuclei ? 'text-rose-400' : 'text-slate-500'}`} />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-white">Nuclei CVE Templates</span>
                  <input type="checkbox" checked={config.nuclei} readOnly className="rounded text-rose-500" />
                </div>
                <p className="text-[11px] text-slate-400">Verificação ativa de vulnerabilidades conhecidas e zero-days.</p>
              </div>
            </div>

            {/* SQLMAP */}
            <div
              onClick={() => toggleTool('sqlmap')}
              className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-start gap-3 ${
                config.sqlmap ? 'bg-violet-500/10 border-violet-500/50 shadow-sm' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Database className={`w-4 h-4 mt-0.5 ${config.sqlmap ? 'text-violet-400' : 'text-slate-500'}`} />
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-white">SQLmap Safe Probe</span>
                  <input type="checkbox" checked={config.sqlmap} readOnly className="rounded text-violet-500" />
                </div>
                <p className="text-[11px] text-slate-400">Testa injeção de SQL e vazamento de mensagens de banco.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
