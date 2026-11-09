import { MobileAuditData, SecurityFinding, SeverityLevel } from '@/core/types/security';

const DANGEROUS_PERMISSIONS: Record<string, string> = {
  'android.permission.ACCESS_FINE_LOCATION': 'Acesso a GPS preciso em tempo real',
  'android.permission.ACCESS_COARSE_LOCATION': 'Acesso a localização aproximada da rede celular/Wi-Fi',
  'android.permission.READ_CONTACTS': 'Leitura da lista de contatos pessoais do dispositivo',
  'android.permission.WRITE_CONTACTS': 'Modificação e criação de contatos no aparelho',
  'android.permission.RECORD_AUDIO': 'Gravação de áudio através do microfone do dispositivo',
  'android.permission.CAMERA': 'Captura de fotos e vídeos pela câmera',
  'android.permission.READ_SMS': 'Leitura de mensagens SMS (risco de interceptação de tokens 2FA)',
  'android.permission.SEND_SMS': 'Envio de SMS silencioso (risco de cobranças indevidas)',
  'android.permission.READ_CALL_LOG': 'Acesso ao histórico de chamadas telefônicas',
  'android.permission.READ_EXTERNAL_STORAGE': 'Leitura do armazenamento compartilhado do dispositivo',
  'android.permission.WRITE_EXTERNAL_STORAGE': 'Gravação no armazenamento compartilhado (risco de adulteração)',
  'android.permission.SYSTEM_ALERT_WINDOW': 'Exibição de janelas sobrepostas (risco de Tapjacking / Phishing visual)',
  'android.permission.REQUEST_INSTALL_PACKAGES': 'Capacidade de solicitar instalação de outros aplicativos (.apk)',
};

export function auditAndroidManifest(manifestXml: string): { data: MobileAuditData; findings: SecurityFinding[] } {
  const findings: SecurityFinding[] = [];
  const permissions: MobileAuditData['permissions'] = [];
  const dangerousFlags: MobileAuditData['dangerousFlags'] = [];
  const exportedComponents: MobileAuditData['exportedComponents'] = [];

  let moduleScore = 100;

  // 1. Extract Package Name
  const packageMatch = manifestXml.match(/package\s*=\s*["']([^"']+)["']/i);
  const packageName = packageMatch ? packageMatch[1] : 'com.devesec.audit.target';

  // 2. Extract MinSDK and TargetSDK
  const minSdkMatch = manifestXml.match(/android:minSdkVersion\s*=\s*["'](\d+)["']/i);
  const targetSdkMatch = manifestXml.match(/android:targetSdkVersion\s*=\s*["'](\d+)["']/i);
  const minSdk = minSdkMatch ? parseInt(minSdkMatch[1], 10) : undefined;
  const targetSdk = targetSdkMatch ? parseInt(targetSdkMatch[1], 10) : undefined;

  if (targetSdk && targetSdk < 33) {
    findings.push({
      id: 'MOBILE-OBSOLETE-TARGET-SDK',
      title: `Target SDK Desatualizado (Android SDK ${targetSdk})`,
      description: 'O aplicativo visa uma versão antiga do Android, contornando proteções de segurança e sandbox das versões mais novas (Android 13+ / 14).',
      severity: 'HIGH',
      remediation: 'Atualize o targetSdkVersion para 34 ou superior no build.gradle.',
      category: 'MOBILE',
      cveOrStandard: 'OWASP Mobile M8',
    });
    moduleScore -= 15;
  }

  // 3. Extract Permissions
  const permRegex = /<uses-permission[^>]+android:name\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let pMatch;
  while ((pMatch = permRegex.exec(manifestXml)) !== null) {
    const pName = pMatch[1];
    const isDangerous = Boolean(DANGEROUS_PERMISSIONS[pName]);
    permissions.push({
      name: pName,
      isDangerous,
      description: DANGEROUS_PERMISSIONS[pName] || 'Permissão padrão do sistema Android',
    });

    if (['android.permission.READ_SMS', 'android.permission.SYSTEM_ALERT_WINDOW', 'android.permission.REQUEST_INSTALL_PACKAGES'].includes(pName)) {
      findings.push({
        id: `MOBILE-PERM-${pName.split('.').pop()}`,
        title: `Permissão de Alto Risco Solicitada (${pName.split('.').pop()})`,
        description: `O app requisita "${DANGEROUS_PERMISSIONS[pName]}". Permissões desta categoria exigem justificativa rigorosa perante a Google Play e LGPD.`,
        severity: 'HIGH',
        remediation: 'Avalie se a funcionalidade pode ser implementada via Intents nativos do sistema sem requisitar permissão direta.',
        category: 'MOBILE',
      });
      moduleScore -= 12;
    }
  }

  // 4. Flags: allowBackup
  if (/android:allowBackup\s*=\s*["']true["']/i.test(manifestXml) || !/android:allowBackup/i.test(manifestXml)) {
    dangerousFlags.push({
      flag: 'allowBackup="true"',
      status: 'VULNERABLE',
      explanation: 'Permite extração completa do banco SQLite e SharedPreferences via "adb backup" por cabo USB sem root.',
    });
    findings.push({
      id: 'MOBILE-ALLOW-BACKUP-TRUE',
      title: 'Flag allowBackup Habilitada',
      description: 'Permite que qualquer pessoa com acesso físico ao aparelho extraia dados sensíveis e tokens do app através de comando ADB.',
      severity: 'MEDIUM',
      remediation: 'Defina explicitamente "android:allowBackup=\'false\'" na tag <application> do AndroidManifest.xml.',
      category: 'MOBILE',
      cveOrStandard: 'CWE-312 / OWASP Mobile M2',
    });
    moduleScore -= 15;
  } else {
    dangerousFlags.push({
      flag: 'allowBackup="false"',
      status: 'SECURE',
      explanation: 'Backup via ADB desabilitado com sucesso.',
    });
  }

  // 5. Flags: usesCleartextTraffic
  if (/android:usesCleartextTraffic\s*=\s*["']true["']/i.test(manifestXml)) {
    dangerousFlags.push({
      flag: 'usesCleartextTraffic="true"',
      status: 'VULNERABLE',
      explanation: 'Permite tráfego HTTP sem criptografia, suscetível a ataques Man-in-the-Middle.',
    });
    findings.push({
      id: 'MOBILE-CLEARTEXT-TRAFFIC',
      title: 'Comunicação em Texto Claro Habilitada (Cleartext Traffic)',
      description: 'O aplicativo permite que requisições de rede sejam feitas em HTTP puro, abrindo brecha para interceptação de credenciais e dados.',
      severity: 'HIGH',
      remediation: 'Altere para "android:usesCleartextTraffic=\'false\'" e configure Network Security Config para forçar TLS.',
      category: 'MOBILE',
      cveOrStandard: 'CWE-319 / OWASP Mobile M5',
    });
    moduleScore -= 20;
  } else {
    dangerousFlags.push({
      flag: 'usesCleartextTraffic="false"',
      status: 'SECURE',
      explanation: 'Comunicação obrigatória via HTTPS/TLS.',
    });
  }

  // 6. Flags: debuggable
  if (/android:debuggable\s*=\s*["']true["']/i.test(manifestXml)) {
    dangerousFlags.push({
      flag: 'debuggable="true"',
      status: 'VULNERABLE',
      explanation: 'App compilado em modo de debug, permitindo anexar depuradores em tempo de execução.',
    });
    findings.push({
      id: 'MOBILE-APP-DEBUGGABLE',
      title: 'Aplicativo Compilado em Modo Depuração (Debuggable)',
      description: 'A flag debuggable ativa permite que invasores conectem o depurador JDWP, manipulem variáveis de memória e contornem verificações de segurança.',
      severity: 'CRITICAL',
      remediation: 'Certifique-se de que "android:debuggable=\'false\'" na build de release oficial.',
      category: 'MOBILE',
      cveOrStandard: 'CWE-215 / OWASP Mobile M7',
    });
    moduleScore -= 35;
  }

  // 7. Exported Components
  const componentRegex = /<(activity|service|receiver|provider)[^>]+android:name\s*=\s*["']([^"']+)["'][^>]*>/gi;
  let cMatch;
  while ((cMatch = componentRegex.exec(manifestXml)) !== null) {
    const fullTag = cMatch[0];
    const compType = cMatch[1] as 'activity' | 'service' | 'receiver';
    const compName = cMatch[2];

    const isExported = /android:exported\s*=\s*["']true["']/i.test(fullTag);
    const hasPermission = /android:permission\s*=/i.test(fullTag);

    if (isExported && !hasPermission) {
      exportedComponents.push({
        name: compName,
        type: compType,
        exported: true,
        hasPermission: false,
        risk: 'HIGH',
      });

      // Report only the first 3 exported components to not flood findings
      if (exportedComponents.length <= 3) {
        findings.push({
          id: `MOBILE-EXPORTED-${compType.toUpperCase()}-${compName.split('.').pop()}`,
          title: `Componente Exportado sem Proteção (${compType}: ${compName.split('.').pop()})`,
          description: `O componente está configurado com "android:exported='true'" sem exigir nenhuma permissão de acesso. Outros aplicativos no celular podem dispará-lo diretamente.`,
          severity: 'HIGH',
          remediation: `Defina "android:exported='false'" ou adicione uma "android:permission" personalizada para proteger o componente.`,
          category: 'MOBILE',
          cveOrStandard: 'CWE-926 / OWASP Mobile M4',
        });
        moduleScore -= 15;
      }
    }
  }

  // OWASP Compliance Checklist summary
  const owaspCompliance: MobileAuditData['owaspCompliance'] = [
    {
      code: 'M1:2024',
      title: 'Uso Inadequado de Credenciais',
      status: permissions.some((p) => p.name.includes('SMS')) ? 'WARNING' : 'PASSED',
      notes: 'Avaliação de vetores de roubo de sessão e SMS.',
    },
    {
      code: 'M2:2024',
      title: 'Vazamento Inadvertido de Dados',
      status: dangerousFlags.some((f) => f.flag.includes('allowBackup="true"')) ? 'FAILED' : 'PASSED',
      notes: 'Proteção contra extração de dados via backup local.',
    },
    {
      code: 'M4:2024',
      title: 'Validação e Integridade de Entradas',
      status: exportedComponents.length > 0 ? 'FAILED' : 'PASSED',
      notes: 'Análise de componentes e IPC expostos.',
    },
    {
      code: 'M5:2024',
      title: 'Comunicação Insegura de Rede',
      status: dangerousFlags.some((f) => f.flag.includes('usesCleartextTraffic="true"')) ? 'FAILED' : 'PASSED',
      notes: 'Garantia de TLS e mitigação de tráfego HTTP puro.',
    },
    {
      code: 'M7:2024',
      title: 'Controles Binários Insuficientes',
      status: dangerousFlags.some((f) => f.flag.includes('debuggable="true"')) ? 'FAILED' : 'PASSED',
      notes: 'Verificação de build de depuração e engenharia reversa.',
    },
  ];

  moduleScore = Math.max(0, moduleScore);

  return {
    data: {
      packageName,
      minSdk,
      targetSdk,
      permissions,
      dangerousFlags,
      exportedComponents,
      owaspCompliance,
      moduleScore,
    },
    findings,
  };
}
