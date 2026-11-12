'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Terminal, LayoutGrid, Menu, X, BookOpen, LogIn, LogOut, UserCheck } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Re-checar autenticação na mudança de rota e quando houver evento de login/logout
  useEffect(() => {
    checkAuth();

    const handleAuthChange = () => checkAuth();
    window.addEventListener('auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
    };
  }, [pathname, checkAuth]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Falha ao desconectar:', err);
    } finally {
      setUser(null);
      // Redireciona sempre para a página principal conforme solicitado
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-border bg-background/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center group-hover:border-emerald-400 transition-all duration-300">
            <Shield className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg text-white tracking-tight">DEV &amp; SEC</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Suite 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 tracking-wider">Cyber Intelligence &amp; Hardening</p>
          </div>
        </Link>

        {/* Right CTA & Nav */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono transition-all"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
            <span>Módulos</span>
          </Link>

          <Link
            href="/docs"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guia &amp; Docs</span>
          </Link>

          {/* Estado de Autenticação: Visível tanto no desktop quanto adaptado */}
          {!loadingUser && (
            user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="max-w-[130px] sm:max-w-[180px] truncate">{user.email}</span>
                  <span className="hidden sm:inline-block text-[9px] px-1 bg-emerald-500/20 rounded text-emerald-400 border border-emerald-500/30 font-bold">
                    PRO
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  title="Encerrar sessão e ir para a página principal"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 text-xs font-mono transition-all"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-bold">Sair</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/20 font-mono"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Acessar Pro</span>
              </Link>
            )
          )}

          <a
            href="https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20agendar%20um%20Pentest%20com%20a%20Dev%20&%20Sec"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-800 text-xs font-mono items-center gap-1.5 transition-all"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auditor</span>
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
          {user ? (
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-200 text-xs truncate max-w-[160px]">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs flex items-center gap-1 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sair
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-emerald-500 text-slate-950 font-bold"
            >
              <LogIn className="w-4 h-4" />
              Acessar Painel Pro
            </Link>
          )}

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
            Guia &amp; Docs
          </Link>
          <Link
            href="/scanner"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 p-2 rounded-lg text-slate-300 hover:bg-slate-900 hover:text-emerald-400"
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            Scanner Central (Público / Demo)
          </Link>
        </div>
      )}
    </header>
  );
}
