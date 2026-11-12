# CHECKLIST DE DADOS REAIS vs. MODELAGEM / PENDÊNCIAS EXTERNAS
*DEV & SEC Suite 2.0 - Matriz de Integridade Técnica e Auditoria*

---

## 🟢 1. Módulos com Dados 100% Reais e Conectados
| Módulo | Fonte Oficial / Mecanismo Real | Status |
| :--- | :--- | :---: |
| **🌐 Scanner Central: Web Posture** | Conexão HTTPS real, handshake TLS, certificados X.509, cabeçalhos HTTP defensivos reais. | ✅ 100% Real |
| **🌐 Scanner Central: DNS & RFCs** | Consultas DNS reais (A, MX, TXT, NS), validação SPF (RFC 7208) e árvore DMARC (RFC 7489). | ✅ 100% Real |
| **🌐 Scanner Central: Portas & IP** | Varredura de sockets TCP em portas abertas e geolocalização via IP-API. | ✅ 100% Real |
| **🌐 Scanner Central: Subdomínios & WAF** | DNS Ativo + Certificate Transparency (`crt.sh`) e detecção de borda Cloudflare/AWS. | ✅ 100% Real |
| **🌐 Scanner Central: Threat Intelligence** | **VirusTotal API v3 oficial (90+ motores conectados com chave ativa)** + Abuse.ch URLhaus. | ✅ 100% Real |
| **🌐 Scanner Central: CVEs & NIST** | API oficial v2.0 do NVD / NIST (`services.nvd.nist.gov`). | ✅ 100% Real |
| **📶 Auditoria de Wi-Fi & Redes Locais** | Script PowerShell nativo com varredura ativa `/24`, `netsh wlan`, `Get-NetNeighbor`, BSSIDs, tabela OUI/maclookup e IEEE MAC Privado. | ✅ 100% Real |
| **🎣 Simulador de Conscientização (`/phishing`)** | Disparo real via **Resend API (`@info.devesec.com`)** / SMTP (`nodemailer`), rastreamento por pixel e clique (`/api/phishing/track`) e tela educativa (`/phishing/treinamento`). | ✅ 100% Real |
| **🔐 Autenticação, 2FA & Redefinição** | Hash PBKDF2 (SHA-512), sessão segura HMAC-SHA256 HttpOnly, disparo OTP via **WhatsApp Evolution API (instância `personal-tasks`)** e **E-mail Resend (`@info.devesec.com`)**. | ✅ 100% Real |
| **🛡️ Controle de Acesso Pro (RBAC Guard)** | Next.js Edge Middleware interceptando rotas privadas (`/wifi`, `/phishing`, `/cloud`, etc.) e liberando rotas públicas/demo (`/`, `/scanner`, `/docs`, `/phishing/treinamento`). | ✅ 100% Real |
| **👤 Engenharia Social & C-Level** | Consulta oficial ao **Registro.br (NIC.br)** e ao **Quadro de Sócios (QSA) da Receita Federal**. | ✅ 100% Real |
| **💻 Auditoria de Código & SAST** | Análise estática real de arquivos/código com regras de segredos e OWASP API Top 10. | ✅ 100% Real |
| **📱 Auditoria Mobile APK** | Parser e auditor estático do `AndroidManifest.xml` de arquivos Android. | ✅ 100% Real |
| **☁️ Auditoria Cloud: S3 & Blobs** | Sondagem HTTP real de URLs AWS S3 / Azure Blobs (verificação de status 200/403/404). | ✅ 100% Real |
| **📊 Comparador: Evolução Técnica** | Comparação dos achados reais gravados no banco de dados SQLite/JSON da plataforma. | ✅ 100% Real |

---

## 🟡 2. O Que Depende de Configuração do Usuário ou Credenciais

### A. Simulador de Conscientização (`/phishing`) - URL Pública para Campanhas Externas
* **Situação Atual:** O disparo real via **Resend API (`RESEND_API_KEY` no `.env`)** e SMTP (`nodemailer`), o pixel de abertura e o registro de cliques funcionam 100% ao vivo.
* **Dependência Externa para Colaboradores Fora da Rede:** Quando disparado localmente (`http://localhost:3000`), os cliques funcionam apenas na sua máquina. Para capturar cliques de celulares/home-office, basta publicar a aplicação em um domínio/subdomínio público (ex: `simulador.devesec.com`) ou usar um túnel HTTPS (ex: Cloudflare Tunnel) e preencher no campo "URL Pública da Plataforma".

### B. Integração WhatsApp Evolution API
* **Situação Atual:** Conexão 100% ativa e testada com a instância `personal-tasks` (`5519999486552`). Disparo de OTP de 6 dígitos com validade de 120s funcionando tanto para redefinição de senha quanto para 2FA.

### C. Auditoria Cloud (`/cloud`) - Checklist Interno CIS Cloud Foundations
* **Situação Atual:** A varredura de S3/Blobs é 100% externa e real. O checklist interno (MFA no Root, CloudTrail multi-region, KMS) é um modelo de conformidade.
* **O Que Falta para Auditar o Painel da Nuvem ao Vivo:** Requer que o cliente forneça credenciais de leitura da AWS (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`) ou permissão IAM via OIDC/Role.

### D. Arsenal Kali Linux (`/scanner` - Nmap, Nikto, Nuclei, Gobuster, SQLmap)
* **Situação Atual:** Os executores estão programados para rodar as ferramentas reais no terminal.
* **Dependência:** Requer que os binários estejam instalados no sistema operacional (ambiente Kali Linux ou instalados no Windows PATH). Caso o executável não seja encontrado, cai no fallback seguro.

### E. Calculadora de Riscos & Multas LGPD (`/comparator`)
* **Natureza da Métrica:** O cálculo da multa ANPD (2% do faturamento até R$ 50M) e a metodologia FAIR (Loss Event Frequency) são fórmulas matemáticas e jurídicas de estimativa para diretores, e não faturas emitidas por órgãos fiscais.

---

## 🚀 3. Checklist de Pendências para Produção (Deploy na VPS)

### Infraestrutura & Deploy na VPS
- [ ] **Subir aplicação na VPS com HTTPS (SSL):** Publicar o projeto Next.js atrás de Nginx/Caddy com certificado SSL (Let's Encrypt / Cloudflare).
- [ ] **Apontar Subdomínio Público no DNS (HostGator):** Criar registro `A` ou `CNAME` (ex.: `suite.devesec.com` ou `simulador.devesec.com`) apontando para o IP da VPS.
  * *Impacto direto:* Ao acessar o sistema pelo domínio HTTPS na VPS, o campo **"URL Pública da Plataforma"** em `/phishing` já preencherá automaticamente o domínio real, passando a capturar aberturas, cliques e reportes de **celulares (4G/5G), notebooks externos e home office** 24h por dia. O mesmo vale para o script Wi-Fi baixado da VPS, que já apontará a telemetria automaticamente para a URL da VPS.
- [ ] **Configurar Variáveis de Ambiente na VPS:** Copiar as chaves ativas de `.env` (`VIRUSTOTAL_API_KEY`, `RESEND_API_KEY`, `EVOLUTION_API_KEY`, etc.) para o servidor.
- [ ] **Migração Opcional para MySQL com Prisma:** Seguir o guia documentado em `ARQUITETURA_SISTEMA.md` caso deseje utilizar o banco MySQL já existente na VPS.
- [ ] **Garantir Persistência da Pasta `data/`:** Assegurar que o diretório `data/` não seja apagado entre atualizações/deploys.

### Melhorias Funcionais Concluídas
- [x] **DNS `info.devesec.com` Configurado:** Registros DKIM, SPF, MX e DMARC (`TXT _dmarc.info.devesec.com`) devidamente publicados na HostGator e validados pelo relatório DMARC do Google.
- [x] **Controle de Acesso & Autenticação Pro:** Middleware Edge protegendo as rotas administrativas/pro, tela de login, sessão segura em cookie HttpOnly e botão explícito "Sair" com redirecionamento para a página principal.
- [x] **2FA e Redefinição de Senha:** WhatsApp Evolution API com tolerância ao 9º dígito e E-mail Resend com domínio corporativo homologado.
