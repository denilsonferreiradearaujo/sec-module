import { EmailSecurityData } from '@/core/types/security';

export function auditEmailSecurity(
  domain: string,
  spfData?: { present: boolean; record?: string; valid: boolean },
  dmarcData?: {
    present: boolean;
    record?: string;
    valid: boolean;
    policy?: 'none' | 'quarantine' | 'reject';
    effectivePolicy?: 'none' | 'quarantine' | 'reject';
  }
): EmailSecurityData {
  let spfStatus: EmailSecurityData['spfStatus'] = 'CRITICAL';
  let dmarcStatus: EmailSecurityData['dmarcStatus'] = 'CRITICAL';
  let spoofingVulnerable = true;

  const spfRec = spfData?.record || '';
  const dmarcRec = dmarcData?.record || '';
  const policy = dmarcData?.effectivePolicy || dmarcData?.policy || 'none';

  // Evaluate SPF
  if (spfData?.present && spfData.valid) {
    if (spfRec.includes('-all')) {
      spfStatus = 'SECURE';
    } else if (spfRec.includes('~all')) {
      spfStatus = 'WARNING';
    } else {
      spfStatus = 'CRITICAL';
    }
  } else {
    spfStatus = 'CRITICAL';
  }

  // Evaluate DMARC
  if (dmarcData?.present && dmarcData.valid) {
    if (policy === 'reject') {
      dmarcStatus = 'SECURE';
      spoofingVulnerable = false;
    } else if (policy === 'quarantine') {
      dmarcStatus = 'WARNING';
      spoofingVulnerable = false;
    } else {
      // p=none
      dmarcStatus = 'CRITICAL';
      spoofingVulnerable = true;
    }
  } else {
    dmarcStatus = 'CRITICAL';
    spoofingVulnerable = true;
  }

  // Build Executive Summary
  let summary = '';
  let recommendation: string | undefined = undefined;

  if (spoofingVulnerable) {
    summary = `O domínio '${domain}' está vulnerável a ataques de personificação (Email Spoofing). Criminosos podem enviar e-mails falsificados fingindo ser diretores ou funcionários da empresa.`;
    recommendation = `Implemente uma política DMARC rígida (p=reject ou p=quarantine) e certifique-se de que o registro SPF termine com '-all' para impedir que terceiros enviem mensagens em nome de '${domain}'.`;
  } else if (dmarcStatus === 'WARNING' || spfStatus === 'WARNING') {
    summary = `O domínio '${domain}' possui proteção anti-spoofing intermediária (política 'quarantine' ou SPF '~all'). E-mails forjados podem ser encaminhados para a pasta de spam.`;
    recommendation = `Considere migrar a política DMARC para 'p=reject' e SPF para '-all' para descarte sumário de e-mails forjados.`;
  } else {
    summary = `O domínio '${domain}' possui excelente proteção de e-mail (SPF '-all' e DMARC 'p=reject'). Tentativas de falsificação são rejeitadas pelos servidores de e-mail destino.`;
  }

  // Extract SPF mechanism
  let spfMechanism: string | undefined = undefined;
  if (spfRec.includes('-all')) spfMechanism = '-all';
  else if (spfRec.includes('~all')) spfMechanism = '~all';
  else if (spfRec.includes('?all')) spfMechanism = '?all';
  else if (spfRec.includes('+all')) spfMechanism = '+all';

  return {
    spfStatus,
    dmarcStatus,
    spoofingVulnerable,
    effectiveDmarcPolicy: policy,
    dmarcPolicy: policy,
    spfMechanism,
    spfRecord: spfRec || undefined,
    dmarcRecord: dmarcRec || undefined,
    summary,
    recommendation,
  };
}
