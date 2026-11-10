'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  BookOpen,
  Terminal,
  Wifi,
  TrendingUp,
  Mail,
  Smartphone,
  KeyRound,
  Globe,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Database,
  FolderSearch,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Flame,
  FileCode,
  Lock,
} from 'lucide-react';

export type DocCategory =
  | 'ALL'
  | 'QUARANTINE_SCANNER'
  | 'THREAT_INTEL'
  | 'KALI_ARSENAL'
  | 'WIFI_AUDIT'
  | 'COMPARATOR_ROI'
  | 'PHISHING_EMAIL'
  | 'MOBILE_SECRETS'
  | 'INCIDENT_RESPONSE';

export interface DocItem {
  id: string;
  title: string;
  category: DocCategory;
  categoryLabel: string;
  badge: string;
  badgeColor: string; // Tailwind color class
  iconName: 'shield' | 'terminal' | 'wifi' | 'mail' | 'mobile' | 'key' | 'globe' | 'database' | 'search' | 'folderSearch' | 'sparkles' | 'trendingUp' | 'help';
  summary: string;
  whatItDoes: string;
  whyItMatters: string;
  howDevSecAudits: string;
  practicalExample: {
    scenario: string;
    vulnerableOrAttack: string;
    remediationCode: string;
  };
  remediationSummary: string;
}

const DOC_ITEMS: DocItem[] = [
  {
    id: 'quarantine-mode',
    title: 'Modo de Quarentena Isolado vs Modo Ativo',
    category: 'QUARANTINE_SCANNER',
    categoryLabel: 'Scanner & Quarentena',
    badge: 'Proteção Anti-Malware',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    iconName: 'shield',
    summary: 'Mecanismo de proteção que impede que o servidor da aplicação envie requisições HTTP para sites suspeitos de conter vírus ou exploits.',
    whatItDoes: 'Quando a opção "Modo de Quarentena Isolado" está ATIVA, nossa plataforma não envia pacotes HTTP diretamente para a URL do alvo. Ela consulta apenas bancos globais de reputação (VirusTotal, AbuseIPDB, URLhaus). Quando está DESMARCADA, a aplicação faz um GET seguro de cabeçalhos.',
    whyItMatters: 'Criminosos colocam malware em páginas web para infectar quem as visita. O Modo de Quarentena garante que você possa auditar um link de golpe sem disparar armadilhas ou avisar o criminoso que o link foi visitado.',
    howDevSecAudits: 'Se marcado, corta a conexão direta via abort preventivo e aciona apenas os nós de Threat Intelligence passivo.',
    practicalExample: {
      scenario: 'Recebimento de um link suspeito de golpe via WhatsApp (ex: brasilpago.app/consulta)',
      vulnerableOrAttack: 'Acessar a URL pelo navegador do celular ou computador pode disparar download de APK malicioso ou exploit de browser.',
      remediationCode: 'No Scanner Dev & Sec:\n[x] Manter o "Modo de Quarentena Isolado Ativo" selecionado para análise 100% segura sem contato com o servidor do hacker.',
    },
    remediationSummary: 'Sempre que a procedência da URL for duvidosa (falsos bancos, sorteios, phishing), mantenha o Modo de Quarentena marcado.',
  },
  {
    id: 'anti-evasion-tree-walk',
    title: 'Detecção Anti-Evasão de Phishing (URL Tree-Walk)',
    category: 'THREAT_INTEL',
    categoryLabel: 'Threat Intelligence',
    badge: 'Anti-Evasão MITRE T1566',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    iconName: 'globe',
    summary: 'Desmonta URLs fraudulentas em múltiplos caminhos para flagrar golpistas que tentam esconder o phishing em subpastas ou com parâmetros dinâmicos.',
    whatItDoes: 'Golpistas inserem trampolins como /go/ ou parâmetros dinâmicos (?doc=CPF) para que a URL tenha um hash inédito e dê 404 nos antivírus. O motor Tree-Walk remove os parâmetros e caminhos falsos até encontrar a denúncia original.',
    whyItMatters: 'Sem essa tecnologia, uma URL como brasilpago.app/go/consulta/?doc=123 passaria como "limpa", pois os antivírus tradicionais só tinham registrado o caminho base brasilpago.app/consulta/.',
    howDevSecAudits: 'Gera 4 a 6 candidatos em árvore (sem parâmetros, removendo /go/ ou /r/, diretório pai e domínio raiz) e consulta a inteligência global em paralelo.',
    practicalExample: {
      scenario: 'Golpe financeiro tentando burlar motores de proteção',
      vulnerableOrAttack: 'Atacante envia: https://brasilpago.app/go/consulta/?doc=40488366844\n(O antivírus comum avalia a URL inteira e não acha nada)',
      remediationCode: 'Tree-Walk da Dev & Sec extrai:\n1. https://brasilpago.app/consulta/ -> ENCONTRADO! (Flagged: LevelBlue Phishing)\n2. Detecta CPF exposto em texto claro no parâmetro ?doc=',
    },
    remediationSummary: 'Bloqueie o domínio em Proxies e Firewalls (EDR/SIEM) e notifique a equipe para nunca preencher dados em sites fora da terminação .gov.br.',
  },
  {
    id: 'cpf-parameter-leak',
    title: 'Alerta de CPF em URL de Consulta Não Oficial (?doc=)',
    category: 'THREAT_INTEL',
    categoryLabel: 'Threat Intelligence',
    badge: 'LGPD & Engenharia Social',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    iconName: 'search',
    summary: 'Identifica quando URLs de sites comerciais não governamentais (.app, .site) transportam números de CPF em texto claro na barra de endereço.',
    whatItDoes: 'Aplica expressões regulares inteligentes para identificar padrões de 11 dígitos de CPF em parâmetros comuns de phishing (?doc=, ?cpf=, ?num=) fora de domínios governamentais (.gov.br).',
    whyItMatters: 'Criminosos usam dados vazados da população para personalizar links falsos de "Valores a Receber" ou "Restituição do Imposto de Renda". A vítima acha que o site é legítimo porque o CPF dela já aparece preenchido.',
    howDevSecAudits: 'Detecta a ocorrência, mascara os dígitos centrais (ex: 404.***.***-44) para respeitar a privacidade e gera finding CRÍTICO.',
    practicalExample: {
      scenario: 'Página falsa simulando consulta do Banco Central ou Receita Federal',
      vulnerableOrAttack: 'https://site-falso.online/consulta?doc=12345678900',
      remediationCode: 'Regra de ouro:\nNenhum órgão do governo brasileiro solicita pagamento de taxas via PIX ou consulta valores fora do portal oficial Gov.br (.gov.br).',
    },
    remediationSummary: 'Oriente a vítima a não realizar transferências PIX e registrar boletim de ocorrência na Delegacia de Crimes Cibernéticos.',
  },
  {
    id: 'hsts-posture',
    title: 'HSTS (HTTP Strict Transport Security)',
    category: 'QUARANTINE_SCANNER',
    categoryLabel: 'Scanner & Quarentena',
    badge: 'Segurança Web & SSL',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    iconName: 'shield',
    summary: 'Cabeçalho obrigatório que força os navegadores a se comunicarem exclusivamente por HTTPS criptografado.',
    whatItDoes: 'Informa ao navegador que aquele site nunca deve ser acessado por HTTP inseguro, mesmo que o usuário digite "http://" ou clique em um link sem o cadeado.',
    whyItMatters: 'Sem o HSTS, um atacante conectado na mesma rede Wi-Fi que a vítima (em um café, aeroporto ou empresa) pode aplicar o golpe SSL Strip / Man-in-the-Middle e rebaixar a conexão para HTTP claro, roubando senhas em tempo real.',
    howDevSecAudits: 'Verifica a presença do cabeçalho Strict-Transport-Security, a duração do max-age (mínimo recomendado de 1 ano) e as diretivas includeSubDomains e preload.',
    practicalExample: {
      scenario: 'Vulnerabilidade em servidor Nginx sem HSTS',
      vulnerableOrAttack: 'O servidor aceita conexões HTTP na porta 80 e apenas redireciona, permitindo interceptação inicial.',
      remediationCode: '# Adicionar no bloco server {} do Nginx:\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;',
    },
    remediationSummary: 'Configure o cabeçalho HSTS no Nginx, Apache ou Cloudflare com max-age de pelo menos 31536000 segundos.',
  },
  {
    id: 'csp-posture',
    title: 'CSP (Content Security Policy)',
    category: 'QUARANTINE_SCANNER',
    categoryLabel: 'Scanner & Quarentena',
    badge: 'Proteção Anti-XSS',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    iconName: 'shield',
    summary: 'A muralha mais poderosa contra ataques de injeção de scripts (XSS) e sequestro de cliques (Clickjacking).',
    whatItDoes: 'Diz ao navegador exatamente de quais servidores ele tem permissão para carregar scripts, estilos, imagens e iframes. Se um invasor injetar um script malicioso no site, o navegador se recusa a executá-lo.',
    whyItMatters: 'Sem CSP, qualquer vulnerabilidade de XSS permite que invasores roubem cookies de sessão, interceptem cartões de crédito digitados na tela ou alterem o visual da página para fraudes.',
    howDevSecAudits: 'Analisa se o cabeçalho Content-Security-Policy está presente e se não contém diretivas excessivamente permissivas (como unsafe-inline ou *).',
    practicalExample: {
      scenario: 'Defesa contra XSS e roubo de dados',
      vulnerableOrAttack: '<script src="https://hacker.com/malware.js"></script> injetado em comentário.',
      remediationCode: '# Exemplo de CSP robusto no Nginx:\nadd_header Content-Security-Policy "default-src \'self\'; script-src \'self\' https://trustedscripts.com; object-src \'none\';" always;',
    },
    remediationSummary: 'Defina uma política CSP restritiva iniciando em modo de teste (Content-Security-Policy-Report-Only) e ative em produção.',
  },
  {
    id: 'kali-nmap',
    title: 'Nmap (Network Mapper) - Auditoria de Portas e Serviços',
    category: 'KALI_ARSENAL',
    categoryLabel: 'Arsenal Kali Linux',
    badge: 'Varredura de Superfície',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    iconName: 'terminal',
    summary: 'O padrão da indústria em reconhecimento de redes: identifica portas TCP abertas e versões de servidores.',
    whatItDoes: 'Envia pacotes SYN para as principais portas de rede (como 22 SSH, 80 HTTP, 443 HTTPS, 3306 MySQL, 5432 PostgreSQL, 8080 Tomcat) e coleta a resposta (banner) do serviço.',
    whyItMatters: 'Portas de banco de dados ou acessos administrativos abertos para a internet inteira são os alvos favoritos de ataques de força bruta, ransomware e roubo massivo de dados.',
    howDevSecAudits: 'Executa via binário nativo do Kali Linux ou realiza varredura segura de portas via sockets TCP do motor TypeScript.',
    practicalExample: {
      scenario: 'Porta 3306 (MySQL) exposta publicamente na nuvem',
      vulnerableOrAttack: 'nmap -sS -p 3306 alvo.com -> 3306/tcp OPEN mysql 5.7 (Permite força bruta direta)',
      remediationCode: '# No firewall (iptables/UFW ou AWS Security Group):\nufw deny 3306\n# Liberar apenas para o IP específico da aplicação:\nufw allow from 192.168.1.50 to any port 3306',
    },
    remediationSummary: 'Feche todas as portas de bancos de dados e interfaces administrativas para a internet pública; use VPN com MFA.',
  },
  {
    id: 'kali-gobuster',
    title: 'Gobuster / FFUF - Descoberta de Arquivos Sensíveis',
    category: 'KALI_ARSENAL',
    categoryLabel: 'Arsenal Kali Linux',
    badge: 'Detecção de Fuga de Dados',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    iconName: 'folderSearch',
    summary: 'Procura ativamente arquivos confidenciais que desenvolvedores esquecem publicados nos servidores.',
    whatItDoes: 'Faz requisições rápidas para caminhos críticos como /.env, /.git/config, /backup.zip, /dump.sql, /phpmyadmin e /server-status.',
    whyItMatters: 'Se o arquivo /.env for deixado público no servidor, o atacante baixa na hora as senhas do banco de dados, chaves da AWS, credenciais do Stripe e tokens de e-mail.',
    howDevSecAudits: 'Simula a wordlist de fuzzing verificando se os endpoints respondem status 200 com conteúdo revelador de variáveis de ambiente.',
    practicalExample: {
      scenario: 'Arquivo .env exposto via web',
      vulnerableOrAttack: 'GET https://empresa.com/.env -> Retorna "DB_PASSWORD=SuperSenha123! AWS_SECRET_KEY=..."',
      remediationCode: '# No Nginx, bloqueie acesso a qualquer arquivo que comece com ponto (.):\nlocation ~ /\\.(?!well-known).* {\n    deny all;\n    access_log off;\n    log_not_found off;\n}',
    },
    remediationSummary: 'Bloqueie no servidor web o acesso a arquivos ocultos (.env, .git) e nunca armazene backups compactados na raiz pública.',
  },
  {
    id: 'kali-sqlmap',
    title: 'SQLmap - Sonda Segura de Injeção de SQL',
    category: 'KALI_ARSENAL',
    categoryLabel: 'Arsenal Kali Linux',
    badge: 'Proteção de Bancos de Dados',
    badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    iconName: 'database',
    summary: 'Verifica se parâmetros da URL ou formulários sofrem de falhas de injeção de SQL que permitam extrair o banco de dados.',
    whatItDoes: 'Testa parâmetros como ?id=1 ou ?busca= com payloads não destrutivos de escape de aspas e checa se o servidor retorna mensagens de erro clássicas do MySQL, PostgreSQL, Oracle ou SQL Server.',
    whyItMatters: 'A Injeção de SQL (OWASP Top 10) permite que invasores leiam todas as tabelas do banco de dados, descubram hashes de senhas e até assumam controle do sistema operacional do servidor.',
    howDevSecAudits: 'Dispara sonda passiva ou ativa controlada para validar se a aplicação sanitiza inputs ou usa Prepared Statements.',
    practicalExample: {
      scenario: 'Parâmetro de consulta vulnerável a SQL Injection',
      vulnerableOrAttack: 'SELECT * FROM produtos WHERE id = \' + req.query.id + \' (Vulnerável a id=1\' OR \'1\'=\'1)',
      remediationCode: '// Correção: Sempre utilize consultas parametrizadas (Prepared Statements):\nconst user = await db.query(\'SELECT * FROM produtos WHERE id = $1\', [productId]);',
    },
    remediationSummary: 'Utilize ORMs modernos (Prisma, TypeORM, Drizzle) ou consultas preparadas; jamais concatene strings de input na query SQL.',
  },
  {
    id: 'kali-nuclei',
    title: 'Nuclei - Scanner de CVEs e Vulnerabilidades Conhecidas',
    category: 'KALI_ARSENAL',
    categoryLabel: 'Arsenal Kali Linux',
    badge: 'Detecção de Exploits / Zero-Day',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    iconName: 'sparkles',
    summary: 'Motor baseado em templates mantidos pela comunidade global de cibersegurança para caçar vulnerabilidades conhecidas (CVEs).',
    whatItDoes: 'Compara as tecnologias, versões e respostas do alvo com milhares de assinaturas de falhas conhecidas (como vulnerabilidades em WordPress, Log4j, SpringBoot, Apache Struts, etc.).',
    whyItMatters: 'Hackers usam bots automáticos que escaneiam a internet inteira procurando servidores rodando versões antigas com falhas públicas para infectar com ransomware em minutos.',
    howDevSecAudits: 'Mapeia tecnologias do cabeçalho e HTML e cruza com a base do National Vulnerability Database (NVD/NIST) e templates Nuclei.',
    practicalExample: {
      scenario: 'Servidor rodando biblioteca desatualizada com Remote Code Execution (RCE)',
      vulnerableOrAttack: 'Apache Log4j versão 2.14.0 (CVE-2021-44228 Log4Shell permite controle total do servidor).',
      remediationCode: '# Atualização imediata do pacote nos gerenciadores de dependência:\nmvn versions:use-latest-releases\n# Ou atualizar imagem Docker para a versão com patch oficial.',
    },
    remediationSummary: 'Mantenha todos os pacotes, frameworks e sistemas operacionais atualizados com patches de segurança (Patch Management).',
  },
  {
    id: 'wifi-audit',
    title: 'Auditoria de Redes Wi-Fi Multiplataforma (Windows & Kali)',
    category: 'WIFI_AUDIT',
    categoryLabel: 'Auditoria Wi-Fi',
    badge: 'Segurança de Perímetro Físico',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    iconName: 'wifi',
    summary: 'Avalia a robustez do sinal sem fio, criptografias utilizadas e presença de redes fracas ou rogue APs.',
    whatItDoes: 'Gera scripts que rodam nativamente no PowerShell do Windows (via netsh wlan) ou no Kali Linux (airmon-ng/wifite), capturando BSSIDs, canais, força do sinal e cifras (WPA3, WPA2, WEP).',
    whyItMatters: 'Redes corporativas com WEP, redes abertas sem senha ou senhas fracas em WPA2-Personal permitem que atacantes no estacionamento interceptem todo o tráfego da empresa ou invadam computadores locais.',
    howDevSecAudits: 'A sonda compila os dados sem fio e envia a telemetria automaticamente via API REST para processamento imediato com nota executiva.',
    practicalExample: {
      scenario: 'Rede corporativa com criptografia legada ou senha compartilhada simples',
      vulnerableOrAttack: 'Cifra WEP ou WPA2 com senha de dicionário (ex: "empresa123") quebrada via Aircrack-ng em minutos.',
      remediationCode: 'Recomendações técnicas:\n1. Adotar WPA3-Enterprise ou WPA2-Enterprise com autenticação 802.1X (RADIUS).\n2. Isolar a rede de Visitantes (Guest) em uma VLAN separada sem acesso à rede interna.',
    },
    remediationSummary: 'Desative WPS, migre para WPA3/WPA2-Enterprise com certificados e isole redes de visitantes em VLAN dedicada.',
  },
  {
    id: 'comparator-roi',
    title: 'Comparador de Auditorias (Antes vs Depois) & Prova de ROI',
    category: 'COMPARATOR_ROI',
    categoryLabel: 'Comparador ROI',
    badge: 'Inteligência Comercial & Gestão',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    iconName: 'trendingUp',
    summary: 'Compara a primeira varredura realizada de um cliente com a mais recente, gerando o relatório de evolução de postura de segurança.',
    whatItDoes: 'Armazena cada laudo de auditoria. Ao pesquisar um domínio no comparador, o sistema seleciona automaticamente o laudo inicial (Baseline) e o último laudo para calcular os pontos recuperados e falhas eliminadas.',
    whyItMatters: 'É o maior instrumento de venda e renovação de contratos para consultores: comprova para a diretoria do cliente que o investimento em segurança eliminou os riscos (ex: "Nota F ➔ Nota A, +58 pontos").',
    howDevSecAudits: 'Motor matemático de scoring calcula a diferença de conformidade, pontuação global e elenca as vulnerabilidades que foram 100% corrigidas.',
    practicalExample: {
      scenario: 'Apresentação de resultados após 30 dias de consultoria Dev & Sec',
      vulnerableOrAttack: 'Diagnóstico Inicial (10/10): Nota F (38/100) - Porta MySQL aberta, .env exposto, HSTS ausente.',
      remediationCode: 'Diagnóstico Final (10/11): Nota A (96/100) - 3 vulnerabilidades críticas eliminadas.\nLaudo PDF gerado com o logotipo do cliente pronto para a diretoria.',
    },
    remediationSummary: 'Utilize o Comparador ROI ao final de cada sprint de remediação para comprovar valor e compliance contínuo.',
  },
  {
    id: 'phishing-email-sim',
    title: 'Conscientização Humana & Simulação de Phishing Educativo',
    category: 'PHISHING_EMAIL',
    categoryLabel: 'Phishing & E-mail',
    badge: 'Fator Humano & Engenharia Social',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    iconName: 'mail',
    summary: 'Treina colaboradores contra armadilhas de e-mail sem punição, gerando métricas de cliques e vulnerabilidade comportamental.',
    whatItDoes: 'Permite disparar simulações de e-mail controladas (ex: falsos comunicados de RH, avisos de TI) para medir quem abriu e quem clicou no link.',
    whyItMatters: 'Mais de 80% das invasões corporativas bem-sucedidas no mundo começam com um colaborador clicando em um link falso. A melhoria técnica é inútil se o elo humano não for treinado.',
    howDevSecAudits: 'Registra campanhas por organização, data e número de alvos, com links que apontam para páginas educativas explicando o teste.',
    practicalExample: {
      scenario: 'Simulação mensal de conscientização com a equipe financeira',
      vulnerableOrAttack: 'E-mail com assunto "Urgente: Atualização da Folha de Pagamento" enviado para 50 funcionários.',
      remediationCode: 'Dashboard de Resultados:\n- 42 abriram o e-mail (84%)\n- 8 clicaram no link falso (16%)\n-> Os 8 colaboradores são direcionados para vídeo-treinamento de 3 minutos.',
    },
    remediationSummary: 'Nunca capture senhas reais em simulações. Redirecione os colaboradores que caíram na simulação para uma página amigável de aprendizado.',
  },
  {
    id: 'spf-dkim-dmarc',
    title: 'Blindagem de E-mail: SPF, DKIM e DMARC',
    category: 'PHISHING_EMAIL',
    categoryLabel: 'Phishing & E-mail',
    badge: 'Proteção de Domínio Institucional',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    iconName: 'mail',
    summary: 'Três registros DNS essenciais para impedir que golpistas falsifiquem e-mails em nome da sua empresa (E-mail Spoofing).',
    whatItDoes: 'O SPF define quais servidores podem enviar e-mails em seu nome; o DKIM assina digitalmente as mensagens com chave criptográfica; o DMARC diz aos provedores (Gmail, Outlook) para rejeitar e-mails falsificados.',
    whyItMatters: 'Sem DMARC com política de rejeição (p=reject), qualquer golpista pode enviar um e-mail com o remetente @suaempresa.com.br para clientes cobrando faturas falsas.',
    howDevSecAudits: 'Realiza consultas DNS TXT no domínio e valida a sintaxe dos registros v=spf1, v=DKIM1 e v=DMARC1.',
    practicalExample: {
      scenario: 'Falsificação de e-mail comercial (CEO Fraud)',
      vulnerableOrAttack: 'Golpista envia e-mail falso se passando por financeiro@suaempresa.com.br solicitando PIX.',
      remediationCode: '# Registro TXT DMARC obrigatório no DNS:\n_dmarc.suaempresa.com.br  TXT  "v=DMARC1; p=reject; rua=mailto:dmarc-reports@suaempresa.com.br; pct=100"',
    },
    remediationSummary: 'Configure SPF com ip4 e mx, ative DKIM no seu servidor de e-mail e aplique DMARC com política de quarentena ou rejeição.',
  },
  {
    id: 'secrets-leak',
    title: 'Varredura de Segredos e Chaves de API Vazadas',
    category: 'MOBILE_SECRETS',
    categoryLabel: 'Mobile & Segredos',
    badge: 'DevSecOps & Nuvem',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    iconName: 'key',
    summary: 'Identifica chaves privadas, credenciais da AWS, tokens do Stripe e senhas inseridas acidentalmente no código ou repositório.',
    whatItDoes: 'Varre arquivos e textos com expressões regulares especializadas procurando assinaturas conhecidas (ex: AKIA para AWS, sk_live para Stripe, chaves RSA privadas, Bearer tokens).',
    whyItMatters: 'Uma chave da AWS vazada no GitHub é descoberta por robôs em menos de 60 segundos, gerando milhares de dólares em servidores de mineração de criptomoedas na conta da vítima.',
    howDevSecAudits: 'Executa o analisador léxico de alta entropia identificando mais de 25 formatos de provedores de nuvem e pagamentos.',
    practicalExample: {
      scenario: 'Chave de produção esquecida em arquivo de configuração público',
      vulnerableOrAttack: 'const stripe = new Stripe("sk_live_51Mz..."); // Exposta no frontend ou repositório público',
      remediationCode: '// Armazene exclusivamente em variáveis de ambiente protegidas no servidor:\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);\n// E adicione .env ao .gitignore',
    },
    remediationSummary: 'Revogue imediatamente chaves comprometidas no painel do provedor, implemente rotação de segredos e use ferramentas como git-secrets.',
  },
  {
    id: 'mobile-manifest',
    title: 'Auditoria de Segurança Android (AndroidManifest.xml)',
    category: 'MOBILE_SECRETS',
    categoryLabel: 'Mobile & Segredos',
    badge: 'OWASP Mobile Top 10',
    badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    iconName: 'mobile',
    summary: 'Analisa as configurações e permissões declaradas no manifesto de aplicativos Android (APK).',
    whatItDoes: 'Inspeciona flags críticas como android:allowBackup, android:usesCleartextTraffic, android:debuggable e permissões perigosas (ex: READ_SMS, ACCESS_FINE_LOCATION, RECORD_AUDIO).',
    whyItMatters: 'Se allowBackup estiver ativado, invasores com acesso físico ou via depuração ADB podem extrair o banco de dados interno e tokens salvos do app no celular.',
    howDevSecAudits: 'Lê a árvore XML do AndroidManifest e emite diagnósticos alinhados com o padrão OWASP Mobile Application Security (MASVS).',
    practicalExample: {
      scenario: 'Aplicativo financeiro permitindo tráfego HTTP puro',
      vulnerableOrAttack: '<application android:usesCleartextTraffic="true" android:allowBackup="true" ...>',
      remediationCode: '<!-- Configuração segura no AndroidManifest.xml -->\n<application\n    android:allowBackup="false"\n    android:usesCleartextTraffic="false"\n    android:debuggable="false" ...>',
    },
    remediationSummary: 'Desative allowBackup em apps com dados sensíveis e proíba expressamente tráfego em texto claro (usesCleartextTraffic="false").',
  },
  {
    id: 'faq-unprotected-scan',
    title: 'FAQ: "Rodei um link sem o Modo de Quarentena. O que fazer?"',
    category: 'INCIDENT_RESPONSE',
    categoryLabel: 'Perguntas Frequentes / Incidentes',
    badge: 'Dúvida Frequente do Consultor',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    iconName: 'help',
    summary: 'Explicação detalhada sobre o que ocorre quando uma varredura é disparada sem marcar a opção de quarentena.',
    whatItDoes: 'O scanner executa a requisição exclusivamente no servidor backend (Node.js/Bun). O Node.js não possui motor gráfico de navegador (DOM) e não executa códigos JavaScript nem baixa arquivos executáveis.',
    whyItMatters: 'O perigo real de links maliciosos existe quando um ser humano clica no link diretamente em seu navegador pessoal (Chrome/Edge/Safari). No scanner Dev & Sec, sua máquina física fica 100% isolada.',
    howDevSecAudits: 'O backend apenas recebe o texto dos cabeçalhos HTTP brutos para calcular notas de segurança.',
    practicalExample: {
      scenario: 'O consultor digitou uma URL suspeita (ex: indexhelper.live/?src=vps) sem o flag de segurança',
      vulnerableOrAttack: 'A mensagem de remediação recomendou "Bloqueie o endereço e não tente abrir". Isso é um conselho para o analista não abrir no Chrome!',
      remediationCode: 'Ações recomendadas:\n1. Fique calmo: sua máquina não foi infectada.\n2. Se chegou a abrir no navegador pessoal: limpe histórico e rode o Windows Defender.\n3. Nos próximos testes: ative o Modo de Quarentena Isolado.',
    },
    remediationSummary: 'A ferramenta foi concebida para proteger o operador. O backend atua como um escudo entre você e o servidor do atacante.',
  },
];

export default function DocumentationView() {
  const [selectedCategory, setSelectedCategory] = useState<DocCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({
    'faq-unprotected-scan': true, // Keep the incident FAQ expanded by default!
    'quarantine-mode': true,
  });

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return DOC_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.whatItDoes.toLowerCase().includes(q) ||
        item.whyItMatters.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const categories: { key: DocCategory; label: string; count: number }[] = [
    { key: 'ALL', label: 'Todos os Recursos', count: DOC_ITEMS.length },
    { key: 'QUARANTINE_SCANNER', label: 'Scanner & Quarentena', count: DOC_ITEMS.filter((i) => i.category === 'QUARANTINE_SCANNER').length },
    { key: 'THREAT_INTEL', label: 'Anti-Evasão & Phishing', count: DOC_ITEMS.filter((i) => i.category === 'THREAT_INTEL').length },
    { key: 'KALI_ARSENAL', label: 'Arsenal Kali Linux', count: DOC_ITEMS.filter((i) => i.category === 'KALI_ARSENAL').length },
    { key: 'WIFI_AUDIT', label: 'Auditoria Wi-Fi', count: DOC_ITEMS.filter((i) => i.category === 'WIFI_AUDIT').length },
    { key: 'COMPARATOR_ROI', label: 'Comparador ROI', count: DOC_ITEMS.filter((i) => i.category === 'COMPARATOR_ROI').length },
    { key: 'PHISHING_EMAIL', label: 'Phishing & E-mail', count: DOC_ITEMS.filter((i) => i.category === 'PHISHING_EMAIL').length },
    { key: 'MOBILE_SECRETS', label: 'Mobile & Segredos', count: DOC_ITEMS.filter((i) => i.category === 'MOBILE_SECRETS').length },
    { key: 'INCIDENT_RESPONSE', label: 'Dúvidas & Incidentes', count: DOC_ITEMS.filter((i) => i.category === 'INCIDENT_RESPONSE').length },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-surface to-surface-card border border-surface-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            Central de Conhecimento & Documentação Visual
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
            Guia Operacional <span className="text-emerald-400">Dev & Sec Suite 2.0</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Consulte a explicação didática de cada ferramenta, cabeçalho de proteção, teste ofensivo do Kali Linux e procedimentos de segurança para operadores e clientes.
          </p>
        </div>

        <div className="flex items-center gap-2 no-print shrink-0">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Shield className="w-4 h-4" />
            Ir para o Scanner
          </Link>
        </div>
      </div>

      {/* Incident Highlight Box (Directly answers the user's recent concern!) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-3 relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
            </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-white text-base">
                Segurança do Operador: Por que nosso Scanner é seguro contra malwares?
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold">
                Arquitetura Headless
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Diferente de um navegador comum (Chrome ou Edge), o scanner da Dev & Sec roda através do servidor backend em Node.js/Bun. Ele <strong>nunca executa códigos JavaScript</strong> da página auditada, <strong>não renderiza HTML malicioso</strong> e <strong>não baixa executáveis</strong>. Sua máquina pessoal permanece 100% isolada de vírus ou exploits.
            </p>
            <div className="pt-1 flex items-center gap-3 text-[11px] font-mono text-emerald-400">
              <span>✓ Sem execução de DOM</span>
              <span>•</span>
              <span>✓ Proteção contra Drive-by Download</span>
              <span>•</span>
              <span>✓ Isolamento por Quarentena Opcional</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conceito, cabeçalho ou ferramenta (ex: quarentena, hsts, sqlmap, evasao, cpf, wpa3, .env)..."
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs sm:text-sm outline-none focus:border-emerald-500 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs pt-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-950/30 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Documentation Cards Grid */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface border border-surface-border space-y-3 font-mono">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400">Nenhum item encontrado para a busca &quot;{searchQuery}&quot;.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
              }}
              className="text-xs text-emerald-400 hover:underline"
            >
              Limpar filtros e ver todos os tópicos
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = Boolean(expandedItems[item.id]);

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-surface-border bg-surface overflow-hidden transition-all duration-200 hover:border-slate-700"
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-5 sm:p-6 flex items-start sm:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-900/40 transition-colors"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-bold text-white font-mono">{item.title}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">[{item.categoryLabel}]</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.summary}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 pt-2 border-t border-slate-800/80 space-y-6 bg-slate-950/50 text-xs font-mono">
                    {/* Three Columns: O que faz, Por que importa, Como auditamos */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                        <span className="text-[11px] font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />
                          1. O que este item faz?
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.whatItDoes}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                        <span className="text-[11px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5" />
                          2. Por que é perigoso? (Risco)
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.whyItMatters}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                        <span className="text-[11px] font-mono font-bold uppercase text-cyan-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          3. Como a Dev & Sec audita?
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.howDevSecAudits}</p>
                      </div>
                    </div>

                    {/* Practical Example / Code snippet */}
                    <div className="p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-bold text-white flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-emerald-400" />
                          Cenário Prático & Exemplo de Código:
                        </span>
                        <span className="text-[11px] text-slate-500">{item.practicalExample.scenario}</span>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-[11px]">
                        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-rose-300 space-y-1">
                          <span className="font-bold uppercase text-[10px] text-rose-400 block">⚠️ Cenário Vulnerável / Ação do Atacante:</span>
                          <pre className="whitespace-pre-wrap font-mono text-[11px]">{item.practicalExample.vulnerableOrAttack}</pre>
                        </div>

                        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 space-y-1">
                          <span className="font-bold uppercase text-[10px] text-emerald-400 block">🛡️ Como Mitigar / Configuração Correta:</span>
                          <pre className="whitespace-pre-wrap font-mono text-[11px]">{item.practicalExample.remediationCode}</pre>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-sans">
                        <strong className="text-white font-mono">Resumo para o Laudo: </strong>
                        {item.remediationSummary}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Quick Glossary Footer */}
      <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-surface-border space-y-4">
        <h3 className="text-base sm:text-lg font-bold text-white font-mono flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          Glossário Rápido de Siglas de Cibersegurança
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">EASM</span>
            <p className="text-[11px] text-slate-400 font-sans">
              External Attack Surface Management. Mapeamento contínuo de todos os ativos digitais expostos para a internet.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400">Threat Intel</span>
            <p className="text-[11px] text-slate-400 font-sans">
              Inteligência de Ameaças. Bases globais alimentadas por mais de 90 empresas de segurança listando malwares e golpes ativos.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400">SPF / DMARC</span>
            <p className="text-[11px] text-slate-400 font-sans">
              Protocolos de autenticação criptográfica de DNS que impedem que golpistas enviem e-mails usando o nome da sua empresa.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-violet-400">CVE & NVD</span>
            <p className="text-[11px] text-slate-400 font-sans">
              Common Vulnerabilities and Exposures. Catálogo público internacional mantido pelo governo americano de falhas conhecidas de softwares.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
