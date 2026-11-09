import React from 'react';
import { Shield, Lock, FileCode, CheckCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-surface-border bg-slate-950/80 py-10 mt-20 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-white tracking-wide">DEV & SEC</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tecnologia que constrói. Segurança que protege. Plataforma modular de inteligência em ameaças,
              EASM e auditoria de sistemas.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Defesa & Blue Team</h4>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Cabeçalhos HTTP & CSP</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Validação TLS / SSL</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Segurança de Cookies & Tokens</li>
              <li className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Políticas SPF, DKIM e DMARC</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Ataque & Red Team</h4>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-cyan-400" /> Superfície de Ataque Externa (EASM)</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-cyan-400" /> Port Scanning & Serviços Expostos</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-cyan-400" /> Reconhecimento de Subdomínios</li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-cyan-400" /> Threat Intelligence & URLhaus</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">DevSecOps & Mobile</h4>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="flex items-center gap-1.5"><FileCode className="w-3.5 h-3.5 text-violet-400" /> Auditoria AndroidManifest</li>
              <li className="flex items-center gap-1.5"><FileCode className="w-3.5 h-3.5 text-violet-400" /> OWASP Mobile Top 10</li>
              <li className="flex items-center gap-1.5"><FileCode className="w-3.5 h-3.5 text-violet-400" /> Detecção de Permissões Críticas</li>
              <li className="flex items-center gap-1.5"><FileCode className="w-3.5 h-3.5 text-violet-400" /> Varredura de Componentes Abertos</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Dev & Sec. Todos os direitos reservados.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px] text-emerald-500/80">
            SEC_ENGINE_STATUS: ONLINE // ZERO_EXPLOITS_AUTHORIZED
          </p>
        </div>
      </div>
    </footer>
  );
}
