import { OsintData, SecurityFinding } from '@/core/types/security';

const PLATFORMS_TO_CHECK = [
  { name: 'GitHub', url: (h: string) => `https://github.com/${h}` },
  { name: 'GitLab', url: (h: string) => `https://gitlab.com/${h}` },
  { name: 'DockerHub', url: (h: string) => `https://hub.docker.com/u/${h}` },
  { name: 'NPM', url: (h: string) => `https://www.npmjs.com/~${h}` },
  { name: 'PyPI', url: (h: string) => `https://pypi.org/user/${h}/` },
  { name: 'Reddit', url: (h: string) => `https://www.reddit.com/user/${h}` },
  { name: 'Dev.to', url: (h: string) => `https://dev.to/${h}` },
  { name: 'Medium', url: (h: string) => `https://medium.com/@${h}` },
  { name: 'YouTube', url: (h: string) => `https://www.youtube.com/@${h}` },
  { name: 'Telegram', url: (h: string) => `https://t.me/${h}` },
];

async function checkPublicProfile(platform: string, url: string): Promise<{ platform: string; url: string; exists: boolean; status: 'FOUND' | 'NOT_FOUND' | 'ERROR' }> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DeveSec-OSINT/1.0',
      },
      signal: AbortSignal.timeout(2500),
      redirect: 'manual',
    });
    if (res.status === 200) {
      return { platform, url, exists: true, status: 'FOUND' };
    }
    return { platform, url, exists: false, status: 'NOT_FOUND' };
  } catch {
    return { platform, url, exists: false, status: 'ERROR' };
  }
}

export async function scanOsint(target: string, isUsername = false): Promise<{ data: OsintData; findings: SecurityFinding[] }> {
  const findings: SecurityFinding[] = [];
  let cleanTarget = target.trim();

  const osintData: OsintData = {
    status: 'SUCCESS',
    socialProfiles: [],
    moduleScore: 100,
  };

  // If target looks like a domain, do RDAP (WHOIS)
  if (!isUsername && cleanTarget.includes('.')) {
    const domain = cleanTarget.replace(/^https?:\/\//i, '').split('/')[0].split(':')[0];

    try {
      const rdapRes = await fetch(`https://rdap.org/domain/${domain}`, {
        signal: AbortSignal.timeout(4000),
      });

      if (rdapRes.ok) {
        const rdap = await rdapRes.json();
        const events: Array<{ eventAction: string; eventDate: string }> = rdap.events || [];
        const registrationEvent = events.find((e) => e.eventAction === 'registration');
        const expirationEvent = events.find((e) => e.eventAction === 'expiration');

        const creationDate = registrationEvent?.eventDate;
        const expirationDate = expirationEvent?.eventDate;

        osintData.whois = {
          registrar: rdap.port43 || rdap.handle || 'Registrar Oficial Identificado',
          creationDate,
          expirationDate,
          privacyProtected: true,
          nameServers: (rdap.nameservers || []).map((ns: { ldhName: string }) => ns.ldhName).filter(Boolean),
        };

        // Check Domain Age
        if (creationDate) {
          const created = new Date(creationDate);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays < 30) {
            findings.push({
              id: 'OSINT-NEWLY-REGISTERED-DOMAIN',
              title: 'Domínio Registrado Recentemente (< 30 dias)',
              description: `O domínio tem apenas ${diffDays} dias de registro. Domínios recém-criados apresentam alto índice de correlação com fraudes descartáveis.`,
              severity: 'HIGH',
              remediation: 'Implemente monitoramento rígido durante os primeiros meses de operação do domínio.',
              category: 'OSINT',
            });
            osintData.moduleScore -= 20;
          }
        }

        // Check Expiration
        if (expirationDate) {
          const expires = new Date(expirationDate);
          const now = new Date();
          const daysToExpiry = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysToExpiry <= 15 && daysToExpiry >= 0) {
            findings.push({
              id: 'OSINT-EXPIRING-SOON',
              title: `Domínio Prestes a Expirar (${daysToExpiry} dias restantes)`,
              description: 'Se o domínio expirar, pode ser sequestrado por cibercriminosos (Domain Hijacking).',
              severity: 'HIGH',
              remediation: 'Renove imediatamente o registro do domínio junto ao registrar ou ative a renovação automática.',
              category: 'OSINT',
            });
            osintData.moduleScore -= 20;
          }
        }
      }
    } catch {
      // RDAP error or timeout
    }
  }

  // Extract handle for social recon (either target directly or domain brand name)
  let handle = cleanTarget;
  if (cleanTarget.includes('.')) {
    handle = cleanTarget.replace(/^https?:\/\//i, '').split('.')[0];
  }
  handle = handle.replace(/[^a-zA-Z0-9_-]/g, '');

  if (handle && handle.length >= 3) {
    const results = await Promise.all(
      PLATFORMS_TO_CHECK.map((p) => checkPublicProfile(p.name, p.url(handle)))
    );
    osintData.socialProfiles = results;
  }

  osintData.moduleScore = Math.max(0, osintData.moduleScore);
  return { data: osintData, findings };
}
