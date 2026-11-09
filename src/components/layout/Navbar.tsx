'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Smartphone, Globe, Terminal, ExternalLink, KeyRound } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center group-hover:border-emerald-400 transition-all duration-300">
            <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">DEV & SEC</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Suite v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wider">Cyber Intelligence & Hardening</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors">
            <Globe className="w-4 h-4 text-emerald-400" />
            Scanner Central
          </Link>
          <Link href="/secrets" className="flex items-center gap-2 text-slate-300 hover:text-amber-400 transition-colors">
            <KeyRound className="w-4 h-4 text-amber-400" />
            Vazamento de Segredos
          </Link>
          <Link href="/mobile" className="flex items-center gap-2 text-slate-300 hover:text-cyan-400 transition-colors">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            Auditoria Mobile
          </Link>
          <a
            href="https://devesec.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            Site Oficial
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20agendar%20um%20Pentest%20com%20a%20Dev%20&%20Sec"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 flex items-center gap-2"
          >
            <Terminal className="w-3.5 h-3.5" />
            Falar com Especialistas
          </a>
        </div>
      </div>
    </header>
  );
}
