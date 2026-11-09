# Guia de Hardening e Correções de Segurança — portfolio.devesec.com

> **Documento Gerado pela Dev & Sec Intelligence Suite**  
> Este guia técnico detalha as correções recomendadas para o subdomínio **`portfolio.devesec.com`**, que foi identificado pelo scanner rodando uma aplicação em **Next.js**.

---

## 📋 Diagnóstico Realizado pelo Scanner

Na auditoria executada em `portfolio.devesec.com`, foram constatados os seguintes pontos:

| Categoria | Problema Identificado | Severidade | Impacto |
|---|---|---|---|
| **Vazamento de Stack** | Cabeçalho `X-Powered-By: Next.js` ativo | **BAIXO** | Revela que o site roda Next.js, facilitando ataques direcionados a CVEs do framework |
| **Vazamento de Info** | Cabeçalho `Server: openresty` exposto | **BAIXO** | Revela a tecnologia do servidor web |
| **Web Posture** | Ausência do cabeçalho `Content-Security-Policy` (CSP) | **ALTO** | Ausência de camada contra Cross-Site Scripting (XSS) |
| **Web Posture** | Ausência do cabeçalho `X-Frame-Options` | **MÉDIO** | Permite incorporação em iframes externos (Clickjacking) |
| **Web Posture** | Ausência do cabeçalho `X-Content-Type-Options: nosniff` | **BAIXO** | Risco de interpretação errônea de arquivos (MIME Sniffing) |
| **Web Posture** | HSTS sem `includeSubDomains; preload` | **BAIXO** | Falta a diretiva de inclusão de subdomínios |

---

## 🛠️ Passo a Passo de Correção (Direto no Next.js)

Como o `portfolio.devesec.com` é uma aplicação em **Next.js**, você pode corrigir **todos os cabeçalhos de segurança e remover o X-Powered-By em um único arquivo**: no `next.config.js` (ou `next.config.mjs`) do projeto do portfólio!

### 1. Atualizar o `next.config.js` (ou `next.config.mjs`)

Abra o arquivo de configuração do seu projeto de portfólio e adicione a função `headers` e a propriedade `poweredByHeader: false`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. Desativa o cabeçalho X-Powered-By: Next.js
  poweredByHeader: false,

  // 2. Injeta todos os cabeçalhos defensivos recomendados pela Dev & Sec
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
// (Se estiver usando ESM/mjs, use: export default nextConfig;)
```

---

### 2. Ocultar o Cabeçalho `Server: openresty`

No servidor OpenResty/Nginx que faz o proxy reverso para a aplicação Next.js:

No bloco `server { ... }` ou `location / { ... }`:
```nginx
proxy_hide_header X-Powered-By;
server_tokens off;
```

---

### 3. Validação após a Aplicação

1. Faça o build e reinicie a aplicação do portfólio (`npm run build && pm2 restart all` ou seu deploy de produção).
2. Abra a **Dev & Sec Intelligence Suite** (`http://localhost:3000`).
3. Digite `portfolio.devesec.com` e clique em **Auditar**.
4. O vazamento de `Next.js` terá desaparecido, todos os 6 cabeçalhos de segurança estarão ativos e a nota do seu portfólio atingirá o nível **A+ (Verde)**!
