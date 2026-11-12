'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get('from') || '/';

  // Campos limpos sem dados pré-preenchidos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados do desafio 2FA
  const [step2FA, setStep2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [identifierMasked, setIdentifierMasked] = useState('');
  const [timer, setTimer] = useState(120);

  // Contador regressivo do código 2FA (120 segundos)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step2FA && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step2FA, timer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
        setLoading(false);
        return;
      }

      // Se exigir 2FA
      if (data.requires2FA) {
        setStep2FA(true);
        setTwoFactorMethod(data.method);
        setIdentifierMasked(data.identifierMasked);
        setTimer(120);
        setLoading(false);
        return;
      }

      // Sucesso direto: redireciona e força recarga para a Navbar detectar a sessão imediatamente
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = fromParam;
    } catch (err: any) {
      setError('Falha de conexão com o servidor. Tente novamente.');
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: twoFactorCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Código inválido ou expirado.');
        setLoading(false);
        return;
      }

      // Redireciona com sucesso
      window.dispatchEvent(new Event('auth-change'));
      window.location.href = fromParam;
    } catch (err: any) {
      setError('Erro ao validar código. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Cyber Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Shield className="w-8 h-8 text-emerald-400" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-white tracking-tight">
          DEV &amp; SEC <span className="text-emerald-400 font-mono text-sm px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">SUITE 2.0</span>
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-mono">
          Autenticação Militar &amp; Acesso aos Módulos Pro
        </p>

        {fromParam !== '/' && (
          <div className="mt-4 mx-4 sm:mx-0 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>O módulo <strong>{fromParam}</strong> requer uma sessão autenticada. Faça login para continuar.</span>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!step2FA ? (
            /* Formulário Principal de Login */
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  E-mail Corporativo
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome@empresa.com"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono font-medium text-slate-300">
                    Senha de Acesso
                  </label>
                  <Link
                    href="/esqueci-senha"
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-emerald-500/30 rounded-xl shadow-lg shadow-emerald-500/20 text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Autenticando sessão...</span>
                  </>
                ) : (
                  <>
                    <span>Entrar no Painel Pro</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Desafio 2FA (Dois Fatores) */
            <form onSubmit={handleVerify2FA} className="space-y-5">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-3">
                  {twoFactorMethod === 'whatsapp' ? (
                    <Smartphone className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <Mail className="w-6 h-6 text-emerald-400" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-white">Verificação em Duas Etapas (2FA)</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Um código de 6 dígitos foi enviado para{' '}
                  <strong className="text-emerald-400 font-mono">{identifierMasked}</strong> via{' '}
                  {twoFactorMethod === 'whatsapp' ? 'WhatsApp (Evolution API)' : 'E-mail corporativo'}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 text-center mb-2">
                  Código de 6 dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="block w-full py-3 text-center tracking-[10px] text-xl font-mono font-bold bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Expiração do código:</span>
                <span className={`font-bold ${timer < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}s
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || twoFactorCode.length < 6}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Confirmar e Acessar</span>
              </button>

              <button
                type="button"
                onClick={() => setStep2FA(false)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
              >
                ← Voltar ao login de credenciais
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-emerald-400 font-mono transition-colors"
            >
              ← Voltar para a Vitrine Pública / Demonstração
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
