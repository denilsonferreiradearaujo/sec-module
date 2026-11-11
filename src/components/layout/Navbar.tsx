'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Smartphone, Globe, Terminal, ExternalLink, KeyRound, Wifi, TrendingUp, Mail, LayoutGrid, Menu, X, BookOpen } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center group-hover:border-emerald-400 transition-all duration-300">
            <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">DEV & SEC</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Suite 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wider">Cyber Intelligence & Hardening</p>
          </div>
        </Link>

        {/* Right CTA & Nav */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono transition-all"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Painel de Módulos</span>
          </Link>

          <Link
            href="/docs"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guia & Docs</span>
          </Link>

          <a
            href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20agendar%20um%20Pentest%20com%20a%20Dev%20&%20Sec"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 items-center gap-2 font-mono"
          >
            <Terminal className="w-3.5 h-3.5" />
            Falar com Auditor
          </a>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 p-4 space-y-3 font-mono text-xs">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-emerald-400"
          >
            <LayoutGrid className="w-4 h-4 text-emerald-400" />
            Painel de Módulos
          </Link>
          <Link
            href="/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-emerald-400"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Guia & Docs
          </Link>
          <Link
            href="/scanner"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-emerald-400"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            Scanner Central & Arsenal Kali
          </Link>
          <Link
            href="/wifi"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-cyan-400"
          >
            <Wifi className="w-4 h-4 text-cyan-400" />
            Auditoria Wi-Fi (Wifite + Aircrack-ng)
          </Link>
          <Link
            href="/comparator"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-emerald-400"
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Comparador Antes vs Depois (ROI)
          </Link>
          <Link
            href="/phishing"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-amber-400"
          >
            <Mail className="w-4 h-4 text-amber-400" />
            Conscientização & Phishing
          </Link>
          <Link
            href="/secrets"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-amber-400"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            Vazamento de Segredos (DevSecOps)
          </Link>
          <Link
            href="/mobile"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-violet-400"
          >
            <Smartphone className="w-4 h-4 text-violet-400" />
            Auditoria Mobile (OWASP)
          </Link>
          <Link
            href="/docs"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            Guia Operacional & Documentação Visual
          </Link>
        </div>
      )}
    </header>
  );
}
