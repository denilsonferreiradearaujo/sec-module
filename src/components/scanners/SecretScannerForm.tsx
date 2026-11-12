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

const SAMPLE_API_VULNERABILITIES = [
  '// Exemplo de Controller Express / Node.js com Falhas OWASP API Top 10',
  'const express = require("express");',
  'const axios = require("axios");',
  'const jwt = require("jsonwebtoken");',
  'const app = express();',
  '',
  '// 1. OWASP API8:2023 - Security Misconfiguration (CORS Permissivo)',
  'app.use((req, res, next) => {',
  '  res.setHeader("Access-Control-Allow-Origin", "*");',
  '  next();',
  '});',
  '',
  '// 2. OWASP API1:2023 - Broken Object Level Authorization (BOLA)',
  'app.get("/api/v1/orders/:id", async (req, res) => {',
  '  // Falha: Busca pedido diretamente por ID sem validar se pertence ao usuário logado',
  '  const order = await db.Order.findById(req.params.id);',
  '  res.json(order);',
  '});',
  '',
  '// 3. OWASP API3:2023 - Broken Object Property (Mass Assignment)',
  'app.put("/api/v1/users/profile", async (req, res) => {',
  '  // Falha: Passa req.body diretamente sem filtrar roles ou privilégios de admin',
  '  const updated = await User.update(req.body);',
  '  res.json(updated);',
  '});',
  '',
  '// 4. OWASP API7:2023 - Server Side Request Forgery (SSRF)',
  'app.post("/api/v1/fetch-avatar", async (req, res) => {',
  '  // Falha: Faz download de URL fornecida pelo usuário sem validar IP de rede interna',
  '  const response = await axios.get(req.body.avatarUrl);',
  '  res.send(response.data);',
  '});',
  '',
  '// 5. OWASP API2:2023 - Broken Authentication (Segredo Fraco)',
  'const token = jwt.sign({ role: "admin" }, "secret");',
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

  const loadApiSample = () => {
    setContent(SAMPLE_API_VULNERABILITIES);
    setSourceName('controller-api-rotas.js');
    setError(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider mb-2">
          <KeyRound className="w-3.5 h-3.5" />
          SAST & OWASP API Top 10 Intelligence
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Auditoria de Código / SAST & <span className="text-amber-400">Vazamento de Segredos</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Identifique credenciais expostas (AWS, GitHub, DBs, Private Keys) e falhas críticas de segurança em APIs (BOLA, Mass Assignment, SSRF, Autenticação Fraca).
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
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={loadSample}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 underline transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Exemplo .env (Secrets)
                </button>
                <span className="text-slate-600 text-xs">•</span>
                <button
                  type="button"
                  onClick={loadApiSample}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Exemplo API (OWASP Top 10)
                </button>
              </div>
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
