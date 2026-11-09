import { NextRequest, NextResponse } from 'next/server';
import { scanSecretsInContent } from '@/modules/secrets/scanner';
import { calculateUnifiedScore } from '@/core/scoring/engine';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let content = (body.content || '').trim();
    const sourceName = (body.sourceName || 'Código Fonte / Arquivo de Configuração').trim();
    const repoUrl = (body.repoUrl || '').trim();

    // If a GitHub repo URL is provided and no content pasted, attempt to fetch sample files
    if (repoUrl && !content) {
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (match) {
        const [, owner, repo] = match;
        const cleanRepo = repo.replace(/\.git$/, '');
        const filesToInspect = ['.env.example', 'docker-compose.yml', 'config.json', 'README.md'];
        const fetchedSnippets: string[] = [];

        for (const file of filesToInspect) {
          try {
            const rawUrl = `https://raw.githubusercontent.com/${owner}/${cleanRepo}/main/${file}`;
            const res = await fetch(rawUrl, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
              const text = await res.text();
              fetchedSnippets.push(`--- File: ${file} ---\n${text}`);
            }
          } catch {
            // ignore fetch timeout
          }
        }

        if (fetchedSnippets.length > 0) {
          content = fetchedSnippets.join('\n\n');
        } else {
          content = `# Repositório analisado: ${repoUrl}\n# Nenhum arquivo de configuração público padrão identificado automaticamente na branch main.`;
        }
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'Nenhum conteúdo ou arquivo informado para auditoria de segredos.' }, { status: 400 });
    }

    const { data: secretsAudit, findings } = await scanSecretsInContent(content, repoUrl || sourceName);

    const report = calculateUnifiedScore({
      target: repoUrl || sourceName,
      targetType: 'code',
      findings,
      secretsAudit,
    });

    return NextResponse.json(report);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro na auditoria de segredos.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
