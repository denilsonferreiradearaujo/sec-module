'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Smartphone, Mail, KeyRound, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Lock } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Método selecionado: 'whatsapp' ou 'email'
  const [method, setMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [resolvedIdentifier, setResolvedIdentifier] = useState('');

  // Controle de etapas (1 = Solicitar OTP, 2 = Digitar Código e Nova Senha)
  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timer, setTimer] = useState(120);

  // Se a URL já veio com código de redefinição direto
  useEffect(() => {
    const codeParam = searchParams.get('code');
    const idParam = searchParams.get('identifier');
    if (codeParam && idParam) {
      setIdentifier(idParam);
      setResolvedIdentifier(idParam);
      setCode(codeParam);
      setStep(2);
    }
  }, [searchParams]);

  // Contagem regressiva de expiração de 120s
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Solicitar envio do código OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const targetInput = method === 'whatsapp' ? phone : identifier;

    if (!targetInput.trim()) {
      setError(method === 'whatsapp' ? 'Informe seu WhatsApp com DDD ou e-mail.' : 'Informe seu e-mail corporativo.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetInput.trim(),
          method,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Falha ao solicitar código de recuperação.');
        setLoading(false);
        return;
      }

      setResolvedIdentifier(data.identifier || targetInput.trim());
      setSuccessMessage(data.message);
      setStep(2);
      setTimer(120);
      setLoading(false);
    } catch (err: any) {
      setError('Erro de conexão ao solicitar recuperação. Tente novamente.');
      setLoading(false);
    }
  };

  // Validar código e definir nova senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('A nova senha e a confirmação não conferem.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.');
      setLoading(false);
      return;
    }

    const targetInput = resolvedIdentifier || (method === 'whatsapp' ? phone : identifier);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetInput.trim(),
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Código inválido ou expirado.');
        setLoading(false);
        return;
      }

      setSuccessMessage(data.message);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: any) {
      setError('Erro ao redefinir a senha.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Cyber Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/10 via-emerald-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <KeyRound className="w-8 h-8 text-cyan-400" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-white tracking-tight">
          Recuperação de Credenciais
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-mono">
          Canal Seguro via WhatsApp (Evolution API) ou E-mail (Resend)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {step === 1 ? (
            /* ETAPA 1: Escolha do Método e Envio de OTP */
            <div>
              {/* Seletor de Canal */}
              <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800 mb-6 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMethod('whatsapp');
                    setError(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
                    method === 'whatsapp'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMethod('email');
                    setError(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
                    method === 'email'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-mail</span>
                </button>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                {method === 'whatsapp' ? (
                  <div>
                    <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                      WhatsApp com DDD ou E-mail Cadastrado
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Smartphone className="h-4 w-4 text-slate-500" />
                      </div>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ex: 19999999999 ou nome@empresa.com"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 font-mono">
                      Disparo instantâneo pelo conector Evolution API ({process.env.NEXT_PUBLIC_APP_NAME || 'DEV & SEC'}).
                    </p>
                  </div>
                ) : (
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
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="nome@empresa.com"
                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] text-slate-500 font-mono">
                      Disparo com remetente seguro via Resend (info.devesec.com).
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-cyan-500/30 rounded-xl shadow-lg shadow-cyan-500/20 text-xs font-mono font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Gerando e enviando código...</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar Código de Verificação</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* ETAPA 2: Validação do OTP e Nova Senha */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="text-center pb-2">
                <span className="text-xs font-mono text-slate-400">
                  Código de 6 dígitos enviado para{' '}
                  <strong className="text-cyan-400 font-mono">
                    {resolvedIdentifier || (method === 'whatsapp' ? phone : identifier)}
                  </strong>
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 text-center mb-1.5">
                  Código OTP de 6 dígitos
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="block w-full py-3 text-center tracking-[10px] text-xl font-mono font-bold bg-slate-950 border border-slate-700 rounded-xl text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Tempo restante:</span>
                <span className={`font-bold ${timer < 30 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}s
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                  Nova Senha Segura
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="block w-full pl-10 pr-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length < 6}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-mono font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Salvar Nova Senha</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors font-mono"
              >
                ← Voltar e reenviar código
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-emerald-400 font-mono transition-colors"
            >
              ← Voltar para a tela de Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
