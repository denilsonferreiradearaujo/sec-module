# Dev & Sec — Cyber Intelligence & Security Suite

> **Tecnologia que constrói. Segurança que protege.**  
> Aplicação modular de auditoria cibernética, avaliação de postura defensiva (**Blue Team**), reconhecimento de superfície de ataque (**Red Team**), inteligência de ameaças, auditoria de aplicativos móveis (OWASP Mobile) e gerador de relatórios executivos com conversão comercial (*Lead Magnet*).

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- **Bun 1.x** (recomendado) ou **Node.js 18+**

### 1. Instalar as Dependências
```bash
bun install
```

### 2. Iniciar o Servidor de Desenvolvimento
```bash
bun run dev
```
Acesse a aplicação no navegador em:  
👉 **[http://localhost:3000](http://localhost:3000)**

### 3. Compilar para Produção (Build)
```bash
bun run build
bun run start
```

---

## 🛡️ Módulos e Capacidades Técnicas

```
                  ┌───────────────────────────────────────────────┐
                  │               Input do Usuário                │
                  │         (Domínio, URL, IP, Username)          │
                  └───────────────────────┬───────────────────────┘
                                          │
     ┌────────────────────────┬───────────┴───────────┬────────────────────────┐
     ▼                        ▼                       ▼                        ▼
┌──────────────┐       ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│  Agente 1:   │       │  Agente 2:   │        │  Agente 3:   │        │  Agente 4:   │
│ Web Posture  │       │ Infra Recon  │        │ Threat Intel │        │  OSINT & ID  │
├──────────────┤       ├──────────────┤        ├──────────────┤        ├──────────────┤
│ • HSTS & CSP │       │ • Port Scan  │        │ • URLhaus C2 │        │ • WHOIS RDAP │
│ • TLS / SSL  │       │ • DNS & SPF  │        │ • Homograph  │        │ • Sherlock   │
│ • Cookies    │       │ • DMARC Auth │        │ • Typosquat  │        │ • Redes Soc. │
│ • Tech Leaks │       │ • Geoloc ASN │        │ • Blacklists │        │ • Breaches   │
└──────┬───────┘       └──────┬───────┘        └──────┬───────┘        └──────┬───────┘
       │                      │                       │                        │
       └──────────────────────┴───────────┬───────────┴────────────────────────┘
                                          ▼
                         ┌─────────────────────────────────┐
                         │    Motor de Síntese & Score     │
                         │   • Score Global de Postura     │
                         │   • Classificação A+ a F        │
                         │   • Plano de Remediação         │
                         │   • CTA Comercial Dev & Sec     │
                         └─────────────────────────────────┘
```

### 1. 🌐 Web Posture & Hardening (Blue Team)
- **Cabeçalhos HTTP de Proteção**: Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), X-Frame-Options (Clickjacking), X-Content-Type-Options (nosniff) e Permissions-Policy.
- **Auditoria de Cookies**: Verificação obrigatória das flags `HttpOnly`, `Secure` e `SameSite` contra ataques XSS e CSRF.
- **Detecção de Vazamentos Tecnológicos**: Análise de headers `Server` e `X-Powered-By`.

### 2. 🎯 Infraestrutura & Superfície de Ataque (Red Team)
- **Port Scanner Concorrente**: Varredura em portas críticas (HTTP, HTTPS, SSH, FTP, Telnet, bancos MySQL/PostgreSQL/Redis, RDP).
- **DNS & E-mail Security**: Resolução de A, AAAA, MX, TXT, NS com auditoria rigorosa de **SPF** e **DMARC** contra falsificação de e-mails corporativos (*Email Spoofing*).
- **Geolocalização & ASN**: Identificação de país, cidade, ASN e provedor de nuvem (AWS, Cloudflare, etc.).
- **Subdomínios**: Mapeamento via Certificate Transparency Logs (`crt.sh`).

### 3. 🛡️ Threat Intelligence & Anti-Phishing
- **URLhaus Abuse.ch**: Consulta em tempo real de bases de distribuição ativa de malware e servidores C2.
- **Heurísticas Anti-Phishing**: Detecção de ataques homógrafos (Punycode / IDN), palavras-chave sensíveis de bancos/login em domínios não oficiais e alta entropia de caracteres (algoritmos DGA).

### 4. 🔍 OSINT Corporativo & Pegada Digital
- **WHOIS via RDAP**: Data de criação, data de expiração (alerta de domínio prestes a expirar) e registrador.
- **Reconhecimento Estilo Sherlock**: Mapeamento automatizado de nomes de usuário ou marcas em mais de 10 plataformas públicas (GitHub, GitLab, DockerHub, NPM, PyPI, Reddit, Dev.to, Medium, etc.).

### 5. 📱 DevSecOps — Auditoria de Aplicativos Móveis (OWASP Mobile)
- Rota dedicada em `/mobile` para auditoria estática de `AndroidManifest.xml`:
  - Detecção de permissões perigosas (SMS, Câmera, Microfone, Localização precisa, Instalação de apps).
  - Alerta de flags críticas: `android:allowBackup="true"`, `usesCleartextTraffic="true"`, `debuggable="true"`.
  - Mapeamento de componentes expostos (`exported="true"`) sem permissões de proteção.
  - Conformidade com o **OWASP Mobile Top 10**.

### 6. 📊 Relatório Executivo & Conversão Comercial (Lead Magnet)
- Score ponderado de postura (0 a 100) e classificação de **A+** a **F**.
- Resumo executivo para C-Level e guias técnicos de remediação passo a passo para engenheiros.
- Botão de exportação / impressão profissional em PDF.
- Botão de contato direto via WhatsApp com mensagem pré-formatada para contratação de **Pentests**, **EASM** ou **Consultoria de Segurança** com a **Dev & Sec**.

---

## 📁 Estrutura de Pastas

```text
services-devesec/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Layout global com Navbar e Footer Dev & Sec
│   │   ├── page.tsx               # Scanner Central Unificado
│   │   ├── mobile/page.tsx        # Auditoria Mobile (OWASP)
│   │   ├── globals.css            # Tema Neon & estilos de impressão PDF
│   │   └── api/
│   │       ├── scan/route.ts      # Orquestrador de sub-agentes
│   │       └── mobile-audit/      # Endpoint de análise AndroidManifest
│   ├── core/
│   │   ├── types/security.ts      # Tipagens e DTOs de segurança
│   │   └── scoring/engine.ts      # Motor de cálculo de score e notas A+ a F
│   ├── modules/
│   │   ├── posture/scanner.ts     # Scanner de cabeçalhos e SSL
│   │   ├── recon/scanner.ts       # Portas, DNS, SPF/DMARC e Geoloc
│   │   ├── threat-intel/scanner.ts# URLhaus, heurísticas de phishing
│   │   ├── osint/scanner.ts       # WHOIS RDAP e Sherlock footprint
│   │   └── mobile/scanner.ts      # Analisador estático de apps
│   └── components/
│       ├── layout/                # Navbar e Footer
│       ├── scanners/              # Formulários interativos
│       └── report/                # Dashboard visual de relatório
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

---

## ⚖️ Conformidade e Ética
Esta plataforma foi desenvolvida para fins de **diagnóstico defensivo**, **conformidade com LGPD**, **auditoria autorizada** e **educação técnica**. Ela não realiza ataques destrutivos nem coleta dados privados não consentidos de pessoas físicas.
