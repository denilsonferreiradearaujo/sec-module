'use client';

import React from 'react';
import Link from 'next/link';
import {
  Globe,
  Wifi,
  TrendingUp,
  Mail,
  KeyRound,
  Smartphone,
  Shield,
  ArrowRight,
  BookOpen,
  UserCheck,
  Cloud,
  Lock,
  Unlock,
} from 'lucide-react';

interface SecurityModuleCard {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  badge: string;
  href: string;
  accentColor: string;
  toolsIncluded: string[];
  isPublic?: boolean;
}

export default function ModuleHubView() {
  const modules: SecurityModuleCard[] = [
    {
      id: 'central-scanner',
      title: 'Scanner Central 360° & Arsenal Kali',
      category: 'EASM & WEB POSTURE',
      description: 'Varredura unificada de portas, DNS RFC 7489, certificados SSL, cabeçalhos defensivos e orquestração de Nmap, Nikto, Gobuster/FFUF, Nuclei e SQLmap.',
      icon: <Globe className="w-6 h-6 text-emerald-400" />,
      badge: 'Principal',
      href: '/scanner',
      accentColor: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5',
      toolsIncluded: ['Nmap', 'Nikto', 'Gobuster', 'Nuclei', 'SQLmap', 'NIST NVD'],
      isPublic: true,
    },
    {
      id: 'docs',
      title: 'Guia Operacional & Documentação Visual',
      category: 'BASE DE CONHECIMENTO & DOCS',
      description: 'Explicações detalhadas de cada módulo, cabeçalho de proteção (HSTS, CSP), testes do Arsenal Kali Linux, scripts de Wi-Fi e procedimentos defensivos para o operador.',
      icon: <BookOpen className="w-6 h-6 text-emerald-400" />,
      badge: 'Documentação',
      href: '/docs',
      accentColor: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5',
      toolsIncluded: ['Manual Técnico', 'Exemplos Práticos', 'Cenários de Ataque', 'Glossário'],
      isPublic: true,
    },
    {
      id: 'wifi-audit',
      title: 'Auditoria de Wi-Fi & Redes Locais',
      category: 'LAYER 2 / RF 802.11',
      description: 'Download do Dev & Sec Wi-Fi Probe para automação de Wifite e Aircrack-ng. Diagnóstico de cifras WEP/WPA-TKIP, vulnerabilidades de WPS Pixie Dust e isolamento de visitantes.',
      icon: <Wifi className="w-6 h-6 text-cyan-400" />,
      badge: 'Módulo Pro',
      href: '/wifi',
      accentColor: 'border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/5',
      toolsIncluded: ['Wifite', 'Aircrack-ng Suite', 'CIS Wireless', 'WPS Audit'],
      isPublic: false,
    },
    {
      id: 'phishing',
      title: 'Simulador de Conscientização de Phishing',
      category: 'ENGENHARIA SOCIAL & TREINAMENTO',
      description: 'Modelos de campanhas educativas contra golpes corporativos (expiração de senhas, notas fiscais falsas, alertas de TI), telemetria ao vivo de abertura/clique e treinamento Just-in-Time.',
      icon: <Mail className="w-6 h-6 text-amber-400" />,
      badge: 'Módulo Pro',
      href: '/phishing',
      accentColor: 'border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5',
      toolsIncluded: ['Resend API', 'Social Engineering Toolkit', 'Just-in-Time Education', 'Telemetria Real'],
      isPublic: false,
    },
    {
      id: 'comparator',
      title: 'Comparador de Auditorias (Antes vs Depois)',
      category: 'GESTÃO & COMPROVAÇÃO DE ROI',
      description: 'Demonstração executiva do salto de postura de segurança alcançado com a consultoria da Dev & Sec. Visualizador de delta de score, mitigação de falhas críticas e evolução de conformidade.',
      icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
      badge: 'Módulo Pro',
      href: '/comparator',
      accentColor: 'border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5',
      toolsIncluded: ['Score Delta', 'Mitigation Matrix', 'Compliance Timeline', 'Executive PDF'],
      isPublic: false,
    },
    {
      id: 'secrets',
      title: 'Vazamento de Segredos & DevSecOps',
      category: 'CI/CD & CÓDIGO FONTE',
      description: 'Inspeção de código e configurações em busca de chaves privadas AWS, tokens Stripe, senhas em texto puro, variáveis de ambiente e conexões de banco de dados.',
      icon: <KeyRound className="w-6 h-6 text-amber-400" />,
      badge: 'Módulo Pro',
      href: '/secrets',
      accentColor: 'border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5',
      toolsIncluded: ['TruffleHog Regexes', 'GitGuardian Rules', 'Entropy Analysis'],
      isPublic: false,
    },
    {
      id: 'cloud',
      title: 'Auditoria Cloud & Postura CSPM',
      category: 'CLOUD SECURITY POSTURE',
      description: 'Varredura ativa de Buckets S3 / Azure Blobs expostos na internet, checagem de permissões públicas e checklist de conformidade CIS Cloud Foundations.',
      icon: <Cloud className="w-6 h-6 text-cyan-400" />,
      badge: 'Módulo Pro',
      href: '/cloud',
      accentColor: 'border-cyan-500/30 hover:border-cyan-500/60 bg-cyan-500/5',
      toolsIncluded: ['S3 Bucket Probe', 'Azure Blob Scanner', 'CIS AWS/Azure/GCP', 'Permission Matrix'],
      isPublic: false,
    },
    {
      id: 'social-engineering',
      title: 'Engenharia Social & Exposição C-Level',
      category: 'OSINT & THREAT INTEL',
      description: 'Auditoria de vazamentos de credenciais na Dark Web (COMB 3.2B, LinkedIn MegaBreach) e cálculo de score de risco de Whaling / BEC para diretoria executiva.',
      icon: <UserCheck className="w-6 h-6 text-violet-400" />,
      badge: 'Módulo Pro',
      href: '/social-engineering',
      accentColor: 'border-violet-500/30 hover:border-violet-500/60 bg-violet-500/5',
      toolsIncluded: ['Dark Web Feeds', 'HIBP Intelligence', 'Whaling Calculator', 'BEC Vectors'],
      isPublic: false,
    },
    {
      id: 'mobile',
      title: 'Auditoria de Aplicativos Mobile (APK)',
      category: 'OWASP MOBILE TOP 10',
      description: 'Análise de segurança em arquivos APK para Android: flags de compilação, sandbox, componentes expostos, permissões perigosas e tráfego em texto claro.',
      icon: <Smartphone className="w-6 h-6 text-violet-400" />,
      badge: 'Módulo Pro',
      href: '/mobile',
      accentColor: 'border-violet-500/30 hover:border-violet-500/60 bg-violet-500/5',
      toolsIncluded: ['Manifest Analyzer', 'Permission Auditor', 'OWASP MASVS'],
      isPublic: false,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-surface to-surface-card border border-surface-border text-center space-y-3 relative overflow-hidden">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <Shield className="w-3.5 h-3.5" />
          Painel de Módulos &amp; Ferramentas Integradas
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Suíte de Módulos <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300">Dev &amp; Sec</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Plataforma modular de inteligência em cibersegurança. Módulos marcados como <strong>PRO</strong> requerem
          sessão autenticada. Visitantes podem testar o <strong>Scanner Central</strong> e consultar as especificações no <strong>Guia &amp; Docs</strong>.
        </p>
      </div>

      {/* Grid of Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${mod.accentColor} group relative`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {mod.icon}
                </div>
                <div className="flex items-center gap-1.5">
                  {mod.isPublic ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold uppercase flex items-center gap-1">
                      <Unlock className="w-3 h-3" />
                      Público / Demo
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Acesso Pro
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold block mb-1">
                  {mod.category}
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {mod.description}
                </p>
              </div>

              {/* Tools tags */}
              <div className="pt-2">
                <span className="text-[10px] font-mono text-slate-500 block mb-1.5">Motores &amp; Padrões:</span>
                <div className="flex flex-wrap gap-1.5">
                  {mod.toolsIncluded.map((tool, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/90 text-slate-400 border border-slate-800"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-800/80">
              <Link
                href={mod.href}
                className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider font-mono flex items-center justify-center gap-2 transition-all shadow-sm ${
                  mod.isPublic
                    ? 'bg-slate-900 hover:bg-emerald-500 text-slate-200 hover:text-slate-950 group-hover:shadow-lg'
                    : 'bg-slate-900/90 hover:bg-cyan-500 text-slate-300 hover:text-slate-950 border border-slate-800 hover:border-cyan-400'
                }`}
              >
                <span>{mod.isPublic ? 'Testar Módulo' : 'Acessar Módulo Pro'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
