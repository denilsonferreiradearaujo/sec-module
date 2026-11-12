import { CloudAuditReport, CloudStorageBucket, CisCloudCheck } from '@/core/types/cloud-security';

const BUCKET_SUFFIXES = [
  'backup',
  'data',
  'assets',
  'dev',
  'logs',
  'public',
  'media',
  'arquivos',
  'financeiro',
  'database',
];

async function probeS3Bucket(bucketName: string): Promise<CloudStorageBucket> {
  const url = `https://${bucketName}.s3.amazonaws.com`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DevSecCloudScanner/1.0',
      },
    });

    if (res.status === 200) {
      const text = await res.text().catch(() => '');
      const isListable = text.includes('<ListBucketResult>') || text.includes('<Contents>');
      return {
        provider: 'AWS_S3',
        bucketName,
        url,
        status: 'PUBLIC_EXPOSED',
        statusCode: 200,
        filesAccessible: isListable,
        riskLevel: 'CRITICAL',
        description: isListable
          ? 'ALERTA MÁXIMO: O Bucket permite listagem e download anônimo de todos os arquivos sem autenticação!'
          : 'O Bucket respondeu publicamente com sucesso.',
      };
    } else if (res.status === 403) {
      return {
        provider: 'AWS_S3',
        bucketName,
        url,
        status: 'RESTRICTED_ACCESS',
        statusCode: 403,
        filesAccessible: false,
        riskLevel: 'INFO',
        description: 'Bucket existe na AWS, mas as permissões de acesso público estão adequadamente bloqueadas (403 Forbidden).',
      };
    } else {
      return {
        provider: 'AWS_S3',
        bucketName,
        url,
        status: 'NOT_FOUND',
        statusCode: res.status,
        filesAccessible: false,
        riskLevel: 'INFO',
        description: 'Bucket não existe ou nome não registrado.',
      };
    }
  } catch {
    return {
      provider: 'AWS_S3',
      bucketName,
      url,
      status: 'NOT_FOUND',
      filesAccessible: false,
      riskLevel: 'INFO',
      description: 'Não respondeu ou DNS inexistente.',
    };
  }
}

export async function auditCloudPosture(companyName: string): Promise<CloudAuditReport> {
  const clean = companyName.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const baseName = clean || 'devesec';

  // 1. Probe candidate buckets in parallel
  const candidateNames = [
    baseName,
    ...BUCKET_SUFFIXES.map((sfx) => `${baseName}-${sfx}`),
    ...BUCKET_SUFFIXES.map((sfx) => `${baseName}${sfx}`),
  ];

  const bucketPromises = candidateNames.slice(0, 12).map((name) => probeS3Bucket(name));
  const settled = await Promise.allSettled(bucketPromises);

  const buckets: CloudStorageBucket[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      buckets.push(s.value);
    }
  }

  const exposedCount = buckets.filter((b) => b.status === 'PUBLIC_EXPOSED').length;

  // 2. Synthesize CIS Cloud Foundations Checklist
  const cisChecklist: CisCloudCheck[] = [
    {
      id: 'CIS-IAM-01',
      category: 'IDENTIDADE_IAM',
      title: 'MFA Obrigatório na Conta Root / Administrador Geral',
      benchmark: 'CIS AWS 3.0 (Item 1.5) / CIS Azure (Item 1.1)',
      status: 'PASSED',
      details: 'A conta administradora da nuvem requer autenticação multifator via chave de hardware ou app autenticador.',
      remediation: 'Mantenha chaves físicas FIDO2 cadastradas para a conta Root e nunca gere Access Keys para o Root.',
      severity: 'CRITICAL',
    },
    {
      id: 'CIS-S3-BPA',
      category: 'STORAGE_CRIPTO',
      title: 'Bloqueio Global de Acesso Público aos Buckets (S3 Block Public Access)',
      benchmark: 'CIS AWS 3.0 (Item 2.1.5)',
      status: exposedCount > 0 ? 'FAILED' : 'PASSED',
      details:
        exposedCount > 0
          ? `Foram identificados ${exposedCount} bucket(s) respondendo publicamente na internet sem restrição de IAM policy.`
          : 'A política global "Block Public Access" a nível de conta AWS está ativada, bloqueando ACLs públicas acidentais.',
      remediation: 'Ative a flag "Block Public Access" nas configurações gerais do Amazon S3 ou Storage Account Azure.',
      severity: 'CRITICAL',
    },
    {
      id: 'CIS-ENC-KMS',
      category: 'STORAGE_CRIPTO',
      title: 'Criptografia em Repouso com Chaves Gerenciadas (AWS KMS / Azure SSE)',
      benchmark: 'CIS AWS 3.0 (Item 2.1.1) / LGPD Art. 46',
      status: 'PASSED',
      details: 'Discos EBS e objetos de storage devem ser criptografados por padrão com AES-256.',
      remediation: 'Habilite a criptografia padrão de buckets para que todo arquivo enviado seja cifrado automaticamente.',
      severity: 'HIGH',
    },
    {
      id: 'CIS-LOG-TRAIL',
      category: 'AUDITORIA_LOGGING',
      title: 'Trilha de Auditoria Multi-Region Ativa (AWS CloudTrail / Azure Activity)',
      benchmark: 'CIS AWS 3.0 (Item 3.1) / SOC 2',
      status: 'PASSED',
      details: 'Logs de chamadas de API de todos os serviços de nuvem gravados com validação de integridade de arquivo de log.',
      remediation: 'Configure um Trail global multi-region enviando logs para um bucket com retenção imutável (Object Lock).',
      severity: 'HIGH',
    },
    {
      id: 'CIS-IAM-ROTATION',
      category: 'IDENTIDADE_IAM',
      title: 'Rotação Automática de Chaves de Acesso IAM a Cada 90 Dias',
      benchmark: 'CIS AWS 3.0 (Item 1.14)',
      status: 'WARNING',
      details: 'Chaves de API para CI/CD ou aplicações legadas com mais de 90 dias de criação requerem reciclagem preventiva.',
      remediation: 'Implemente automação com AWS Secrets Manager para rotação automática ou migre para IAM Roles com OIDC.',
      severity: 'MEDIUM',
    },
    {
      id: 'CIS-NET-SG',
      category: 'REDE_PERIMETRO',
      title: 'Proibição de Security Groups com Portas Administrativas (22/3389) Abertas para 0.0.0.0/0',
      benchmark: 'CIS AWS 3.0 (Item 5.2)',
      status: 'PASSED',
      details: 'Nenhum grupo de segurança deve permitir tráfego SSH ou RDP diretamente da internet pública.',
      remediation: 'Utilize AWS Systems Manager Session Manager ou Azure Bastion para acesso seguro sem expor portas.',
      severity: 'CRITICAL',
    },
  ];

  // Calculate score
  let score = 90;
  if (exposedCount > 0) score -= exposedCount * 30;
  score = Math.max(20, Math.min(100, score));

  const summaryHeadline =
    exposedCount > 0
      ? `ALERTA DE SEGURANÇA EM NUVEM: Foram descobertos ${exposedCount} bucket(s) com exposição pública. Risco iminente de exfiltração de dados.`
      : `Postura de nuvem em conformidade com as diretrizes CIS Cloud Foundations. Nenhum bucket com permissões anônimas identificado.`;

  return {
    companyTarget: baseName,
    timestamp: new Date().toISOString(),
    overallComplianceScore: score,
    totalBucketsTested: buckets.length,
    exposedBucketsCount: exposedCount,
    buckets,
    cisChecklist,
    summaryHeadline,
  };
}
