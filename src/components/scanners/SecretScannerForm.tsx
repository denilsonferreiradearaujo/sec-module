'use client';

import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Sparkles, Loader2, GitBranch, FileCode } from 'lucide-react';

interface SecretScannerFormProps {
  onScanComplete: (report: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const SAMPLE_VULNERABLE_CONFIG = [
  '# Exemplo de Configuração de Ambiente para Demonstração',
  'NODE_ENV=production',
  'PORT=3000',
  '',
  '# AWS Credentials (Expostas indevidamente)',
  'AWS_ACCESS_KEY_ID=' + 'AKIA' + 'IOSFODNN7EXAMPLE',
  'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  'AWS_REGION=us-east-1',
  '',
  '# Database Connection com Senha em Texto Puro',
  'DATABASE_URL=postgres://devesec_admin:P@ssw0rdSuperSecr3t2026@db.internal.devesec.com:5432/production_db',
  '',
  '# GitHub Personal Access Token',
  'GITHUB_TOKEN=' + 'ghp_' + 'ABC1234567890abcdefghijklmnopqrstuvwxy',
  '',
  '# Chaves de Pagamento e Integração (Exemplo de Teste)',
  'STRIPE_SECRET_KEY=' + 'sk_test_' + '51AbCdEfGhIjKlMnOpQrStUvWxYz0123',
  'SLACK_WEBHOOK_URL=' + 'https://hooks.slack.com/services/T' + '00000000/B00000000/XXXX' + 'XXXXXXXXXXXX',
  '',
  '# Token de Autenticação JWT',
  'AUTH_SECRET="minha_chave_jwt_super_secreta_com_mais_de_12_chars"',
  ''
].join('\n');

export default function SecretScannerForm({ onScanComplete, isLoading, setIsLoading }: SecretScannerFormProps) {
  const [content, setContent] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !repoUrl.trim()) {
      setError('Por favor, cole um trecho de código/.env ou insira a URL de um repositório GitHub.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/secret-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          sourceName: sourceName.trim() || (repoUrl.trim() ? repoUrl.trim() : 'Código / Configuração Auditada'),
          repoUrl: repoUrl.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao auditar segredos.');
      }

      onScanComplete(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro inesperado durante a auditoria.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSample = () => {
    setContent(SAMPLE_VULNERABLE_CONFIG);
    setSourceName('arquivo-ambiente-producao.env');
    setError(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
          <KeyRound className="w-3.5 h-3.5" />
          DevSecOps & GitGuardian Intelligence
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Auditoria de Vazamento de Segredos
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Identifique credenciais, tokens de API, chaves privadas e strings de conexão expostas em código, arquivos <code className="text-emerald-400">.env</code> e configurações de nuvem.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border shadow-2xl relative overflow-hidden">
        <form onSubmit={handleScan} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                Nome do Arquivo ou Identificador
              </label>
              <input
                type="text"
                placeholder="Ex: .env.production, docker-compose.yml, api/auth.ts"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                Ou URL de Repositório GitHub (Opcional)
              </label>
              <input
                type="text"
                placeholder="https://github.com/usuario/repositorio"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Conteúdo do Arquivo / Trecho de Código
              </label>
              <button
                type="button"
                onClick={loadSample}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 underline transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Carregar Exemplo com Falhas (Demonstração)
              </button>
            </div>
            <textarea
              rows={9}
              placeholder="Cole aqui o conteúdo de arquivos .env, scripts Python/JS, arquivos YAML, JSON ou certificados..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 transition-all placeholder-slate-600 resize-y"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] text-slate-500">
              🛡️ Análise estática em memória. Nenhum dado é gravado ou compartilhado com terceiros.
            </span>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditando Segredos...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Iniciar Auditoria de Segredos
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
