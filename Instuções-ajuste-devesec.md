# Guia de Hardening e Correções de Segurança — devesec.com

> **Documento Gerado pela Dev & Sec Intelligence Suite**  
> Este guia técnico detalha os pontos identificados pela auditoria no domínio principal **`devesec.com`** e apresenta o passo a passo exato para elevar a nota de segurança para **A+**.

---

## 📋 Diagnóstico Realizado pelo Scanner

Na auditoria executada em `devesec.com`, foram constatados os seguintes pontos de melhoria:

| Categoria | Problema Identificado | Severidade | Impacto |
|---|---|---|---|
| **Web Posture** | Ausência do cabeçalho `Content-Security-Policy` (CSP) | **ALTO** | Facilita injeção e execução de scripts maliciosos (XSS) |
| **Web Posture** | Ausência do cabeçalho `X-Frame-Options` | **MÉDIO** | Permite incorporação em iframes externos (Clickjacking) |
| **Web Posture** | Ausência do cabeçalho `X-Content-Type-Options: nosniff` | **BAIXO** | Risco de interpretação errônea de arquivos (MIME Sniffing) |
| **Web Posture** | HSTS sem `includeSubDomains; preload` | **BAIXO** | Subdomínios não herdam a obrigatoriedade de HTTPS |
| **Vazamento de Info** | Cabeçalho `Server: openresty` exposto | **BAIXO** | Revela a tecnologia do servidor web para invasores |
| **E-mail & DNS** | DMARC em modo passivo (`p=none`) | **MÉDIO** | Não bloqueia o envio de e-mails falsificados (@devesec.com) |

---

## 🛠️ Passo a Passo de Correção

O domínio `devesec.com` responde atualmente através do servidor web **OpenResty (Nginx)** no IP `209.50.229.147`.

### 1. Inserir os Cabeçalhos de Segurança Defensivos

No arquivo de configuração do seu servidor web (ex: `/etc/nginx/sites-available/devesec.com` ou no bloco de configuração do OpenResty/Hostinger), adicione dentro do bloco `server { ... }` ou `location / { ... }`:

```nginx
# 1. HSTS Completo (Força HTTPS por 1 ano + subdomínios + HSTS Preload list)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# 2. Prevenção de Clickjacking (Impede iframe não autorizado)
add_header X-Frame-Options "SAMEORIGIN" always;

# 3. Prevenção contra MIME Sniffing
add_header X-Content-Type-Options "nosniff" always;

# 4. Política de Referência Segura
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# 5. Restrição de Recursos do Navegador (Câmera, Microfone, Geoloc)
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# 6. Content Security Policy (CSP Inicial para site institucional)
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'self';" always;
```

---

### 2. Ocultar o Cabeçalho `Server: openresty`

Para evitar que scanners automatizados identifiquem o OpenResty:

No arquivo `nginx.conf` principal (ou dentro do bloco `http { ... }`):
```nginx
server_tokens off;
```
Se estiver utilizando Cloudflare ou proxy reverso, você também pode remover o cabeçalho `Server` diretamente no painel do Cloudflare:  
👉 **Rules > Transform Rules > Modify Response Header > Remove `Server`**.

---

### 3. Fortalecer a Política DMARC de E-mail Anti-Spoofing

No DNS do seu provedor (onde o domínio `devesec.com` está gerenciado):

Atualmente sua entrada DMARC está assim:
```text
Host: _dmarc.devesec.com
Tipo: TXT
Valor: v=DMARC1; p=none;
```

**Alteração recomendada:**
Evolua a política para **quarentena** ou **rejeição**, garantindo que fraudadores não consigam disparar e-mails falsificados fingindo ser da Dev & Sec:

```text
Host: _dmarc
Tipo: TXT
Valor: v=DMARC1; p=quarantine; rua=mailto:seguranca@devesec.com; fo=1;
```
*(Quando tiver certeza de que todos os seus serviços de envio legítimos estão no SPF, mude para `p=reject;`)*.

---

### 4. Validação após a Aplicação

Após aplicar as configurações e reiniciar o servidor (`nginx -s reload`):
1. Abra a **Dev & Sec Intelligence Suite** (`http://localhost:3000`).
2. Digite `devesec.com` e clique em **Auditar**.
3. Todos os cabeçalhos estarão verdes (**ATIVO**) e o score subirá para **A+ (95~100 pts)**!
