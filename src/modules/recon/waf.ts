import { SubdomainItem, WafDetectionData } from '@/core/types/security';

// Helper to check if an IP belongs to Cloudflare known prefixes
export function isCloudflareIp(ip?: string): boolean {
  if (!ip) return false;
  // Common Cloudflare IPv4 ranges
  return (
    ip.startsWith('104.') ||
    ip.startsWith('172.64.') ||
    ip.startsWith('172.65.') ||
    ip.startsWith('172.66.') ||
    ip.startsWith('172.67.') ||
    ip.startsWith('172.68.') ||
    ip.startsWith('172.69.') ||
    ip.startsWith('172.70.') ||
    ip.startsWith('172.71.') ||
    ip.startsWith('108.162.') ||
    ip.startsWith('162.158.') ||
    ip.startsWith('198.41.') ||
    ip.startsWith('141.101.') ||
    ip.startsWith('190.93.') ||
    ip.startsWith('188.114.')
  );
}

export function detectWafAndOriginLeak(
  rawHeaders: Record<string, string | string[] | undefined> = {},
  mainIps: string[] = [],
  subdomains: SubdomainItem[] = []
): WafDetectionData {
  const evidence: string[] = [];
  let detected = false;
  let wafName: string | undefined = undefined;
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

  // Normalize headers to lowercase
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawHeaders)) {
    if (v) headers[k.toLowerCase()] = Array.isArray(v) ? v.join(' ') : String(v);
  }

  const serverHeader = headers['server'] || '';
  const viaHeader = headers['via'] || '';

  // 1. Cloudflare
  if (headers['cf-ray'] || headers['cf-cache-status'] || serverHeader.toLowerCase().includes('cloudflare')) {
    detected = true;
    wafName = 'Cloudflare WAF & DDoS Shield';
    confidence = 'HIGH';
    if (headers['cf-ray']) evidence.push(`Cabeçalho 'cf-ray' identificado: ${headers['cf-ray']}`);
    if (serverHeader) evidence.push(`Assinatura de servidor: '${serverHeader}'`);
  } else if (mainIps.some((ip) => isCloudflareIp(ip))) {
    detected = true;
    wafName = 'Cloudflare (Proxy / Anycast IP)';
    confidence = 'HIGH';
    evidence.push(`IP de resolução está no range Anycast da Cloudflare (${mainIps[0]})`);
  }
  // 2. AWS WAF / CloudFront
  else if (headers['x-amz-cf-id'] || viaHeader.toLowerCase().includes('cloudfront') || serverHeader.toLowerCase().includes('cloudfront')) {
    detected = true;
    wafName = 'AWS CloudFront / AWS WAF';
    confidence = 'HIGH';
    if (headers['x-amz-cf-id']) evidence.push(`Identificador 'x-amz-cf-id' detectado.`);
    if (viaHeader) evidence.push(`Proxy 'Via': ${viaHeader}`);
  }
  // 3. Akamai
  else if (headers['x-akamai-transformed'] || serverHeader.toLowerCase().includes('akamaighost')) {
    detected = true;
    wafName = 'Akamai Edge / Kona WAF';
    confidence = 'HIGH';
    evidence.push(`Assinatura de borda Akamai detectada.`);
  }
  // 4. Imperva / Incapsula
  else if (headers['x-iinfo'] || headers['x-cdn']?.toLowerCase().includes('incapsula')) {
    detected = true;
    wafName = 'Imperva / Incapsula WAF';
    confidence = 'HIGH';
    evidence.push(`Header 'x-iinfo' de inspeção Imperva detectado.`);
  }
  // 5. Sucuri
  else if (headers['x-sucuri-id'] || serverHeader.toLowerCase().includes('sucuri')) {
    detected = true;
    wafName = 'Sucuri CloudProxy WAF';
    confidence = 'HIGH';
    evidence.push(`Assinatura Sucuri CloudProxy detectada.`);
  }

  // Check for Origin IP Leak (Vazamento de IP Real de Origem)
  let originIpLeakDetected = false;
  let suspectedOriginIp: string | undefined = undefined;
  let originIpReason: string | undefined = undefined;

  if (detected && wafName?.includes('Cloudflare')) {
    // If Cloudflare is active, check if any subdomain points to a NON-Cloudflare IP
    for (const sub of subdomains) {
      if (sub.isAlive && sub.ip && !isCloudflareIp(sub.ip)) {
        // High-risk subdomains typically pointing to direct origin
        if (
          sub.subdomain.startsWith('mail.') ||
          sub.subdomain.startsWith('direct.') ||
          sub.subdomain.startsWith('origin.') ||
          sub.subdomain.startsWith('ftp.') ||
          sub.subdomain.startsWith('cpanel.') ||
          sub.subdomain.startsWith('webmail.')
        ) {
          originIpLeakDetected = true;
          suspectedOriginIp = sub.ip;
          originIpReason = `O subdomínio '${sub.subdomain}' aponta para o IP ${sub.ip} que não possui proteção Cloudflare, permitindo bypass do WAF.`;
          break;
        }
      }
    }
  }

  return {
    detected,
    wafName,
    confidence,
    evidence,
    originIpLeakDetected,
    suspectedOriginIp,
    originIpReason,
  };
}
