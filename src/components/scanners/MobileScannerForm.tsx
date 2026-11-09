'use client';

import React, { useState } from 'react';
import { Smartphone, Terminal, Loader2, FileCode, CheckCircle2 } from 'lucide-react';
import { UnifiedAuditReport } from '@/core/types/security';

const VULNERABLE_SAMPLE_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.exemplo.appvulneravel"
    android:versionCode="1"
    android:versionName="1.0">

    <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="28" />

    <!-- Permissões de Risco -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.READ_SMS" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <application
        android:allowBackup="true"
        android:usesCleartextTraffic="true"
        android:debuggable="true"
        android:icon="@mipmap/ic_launcher"
        android:label="App Inseguro">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Componente Exportado sem permissão -->
        <activity
            android:name=".AdminSecretActivity"
            android:exported="true" />

        <service
            android:name=".BackgroundDataSyncService"
            android:exported="true" />
    </application>
</manifest>`;

const SECURE_SAMPLE_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.devesec.appbancario"
    android:versionCode="10"
    android:versionName="2.0">

    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="false"
        android:usesCleartextTraffic="false"
        android:debuggable="false"
        android:label="Dev & Sec Safe App">
        
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <activity
            android:name=".SecureVaultActivity"
            android:exported="false" />
    </application>
</manifest>`;

interface MobileScannerFormProps {
  onScanComplete: (report: UnifiedAuditReport) => void;
}

export default function MobileScannerForm({ onScanComplete }: MobileScannerFormProps) {
  const [manifest, setManifest] = useState(VULNERABLE_SAMPLE_MANIFEST);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manifest.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/mobile-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest: manifest.trim() }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Falha ao auditar manifest.');
      }

      const report: UnifiedAuditReport = await res.json();
      onScanComplete(report);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar auditoria mobile.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="p-8 sm:p-10 rounded-2xl bg-gradient-to-b from-surface to-surface-card border border-surface-border shadow-2xl relative overflow-hidden">
        <div className="relative z-10 text-center space-y-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Smartphone className="w-3.5 h-3.5" />
            DevSecOps — Auditoria Estática de Aplicativos Móveis (OWASP Mobile)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Auditoria de <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">AndroidManifest</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Cole abaixo o conteúdo do arquivo <code className="text-emerald-400">AndroidManifest.xml</code> ou
            utilize os modelos pré-definidos para analisar permissões perigosas, vazamento de dados e conformidade OWASP.
          </p>
        </div>

        {/* Preset buttons */}
        <div className="relative z-10 flex items-center justify-center gap-3 mb-4 flex-wrap">
          <button
            type="button"
            onClick={() => setManifest(VULNERABLE_SAMPLE_MANIFEST)}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono transition-colors"
          >
            Carregar Exemplo: App Inseguro (Vulnerável)
          </button>
          <button
            type="button"
            onClick={() => setManifest(SECURE_SAMPLE_MANIFEST)}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-colors"
          >
            Carregar Exemplo: App Seguro (Hardened)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
          <textarea
            value={manifest}
            onChange={(e) => setManifest(e.target.value)}
            rows={12}
            placeholder="Cole aqui o XML do AndroidManifest..."
            className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 text-cyan-300 font-mono text-xs leading-relaxed outline-none transition-all"
          />

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={loading || !manifest.trim()}
              className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Auditando Código...
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  Executar Auditoria Mobile
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs font-mono">
              ❌ {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
