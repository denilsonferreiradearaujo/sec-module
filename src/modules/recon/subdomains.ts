import { SubdomainItem } from '@/core/types/security';
import dns from 'node:dns/promises';

const COMMON_PREFIXES = [
  'api',
  'vpn',
  'mail',
  'webmail',
  'dev',
  'homolog',
  'staging',
  'admin',
  'painel',
  'git',
  'gitlab',
  'portal',
  'app',
  'auth',
  'sso',
  'cloud',
  'remote',
  'smtp',
  'ftp',
  'direct',
  'origin',
  'cpanel',
  'intranet',
  'monitor',
  'grafana',
  'jenkins',
];

// Resolves a single hostname to IPv4 with timeout
async function resolveHostWithTimeout(host: string, timeoutMs = 1500): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
    const dnsPromise = dns.resolve4(host).then((ips) => (ips.length > 0 ? ips[0] : null));
    return await Promise.race([dnsPromise, timeoutPromise]);
  } catch {
    return null;
  }
}

// Queries Certificate Transparency Logs from crt.sh
async function fetchCrtShSubdomains(domain: string, timeoutMs = 3000): Promise<string[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'DevSec-Subdomain-Recon/2.0' },
    });
    clearTimeout(timer);

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const found = new Set<string>();
    const cleanRoot = domain.toLowerCase();

    for (const item of data) {
      const nameVal = item.name_value;
      if (typeof nameVal === 'string') {
        const parts = nameVal.split(/\r?\n/);
        for (const p of parts) {
          const clean = p.trim().toLowerCase().replace(/^\*\./, '');
          if (clean.endsWith(`.${cleanRoot}`) && clean !== cleanRoot && !clean.includes('*')) {
            found.add(clean);
          }
        }
      }
    }

    return Array.from(found).slice(0, 30); // Cap at top 30
  } catch {
    return [];
  }
}

export async function enumerateSubdomains(domain: string): Promise<SubdomainItem[]> {
  const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  const resultsMap = new Map<string, SubdomainItem>();

  // 1. Parallel DNS brute-force of high-value prefixes
  const brutePromises = COMMON_PREFIXES.map(async (prefix) => {
    const sub = `${prefix}.${cleanDomain}`;
    const ip = await resolveHostWithTimeout(sub, 1200);
    if (ip) {
      resultsMap.set(sub, {
        subdomain: sub,
        ip,
        isAlive: true,
        source: 'DNS_BRUTEFORCE',
      });
    }
  });

  // 2. Fetch Certificate Transparency logs from crt.sh concurrently
  const crtPromise = fetchCrtShSubdomains(cleanDomain, 2800).then(async (crtSubs) => {
    // Resolve any discovered crt.sh subdomains that aren't already known
    const resolvePromises = crtSubs.slice(0, 15).map(async (sub) => {
      if (resultsMap.has(sub)) return;
      const ip = await resolveHostWithTimeout(sub, 1200);
      resultsMap.set(sub, {
        subdomain: sub,
        ip: ip || undefined,
        isAlive: Boolean(ip),
        source: 'CERT_TRANSPARENCY',
      });
    });
    await Promise.all(resolvePromises);
  });

  await Promise.allSettled([...brutePromises, crtPromise]);

  const items = Array.from(resultsMap.values());
  // Sort so alive subdomains appear first
  items.sort((a, b) => {
    if (a.isAlive && !b.isAlive) return -1;
    if (!a.isAlive && b.isAlive) return 1;
    return a.subdomain.localeCompare(b.subdomain);
  });

  return items;
}
