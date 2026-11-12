import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'devesec-enterprise-super-secret-key-2025-hmac-sha256';

// Rotas que exigem login ativo (Módulos Pro)
const PROTECTED_PREFIXES = [
  '/wifi',
  '/cloud',
  '/mobile',
  '/secrets',
  '/social-engineering',
  '/comparator',
];

/**
 * Validação segura de token JWT no Edge Runtime usando Web Crypto API nativa
 */
async function isValidSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const [headerB64, payloadB64, signature] = parts;

    // Decodifica payload para verificar expiração
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    if (!payload.exp || Date.now() / 1000 > payload.exp) {
      return false; // Expirado
    }

    // Validação de assinatura HMAC-SHA256
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(JWT_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    // Normaliza base64url para Uint8Array
    const sigB64 = signature.replace(/-/g, '+').replace(/_/g, '/');
    const sigStr = atob(sigB64);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    return await crypto.subtle.verify('HMAC', key, sigBytes, data);
  } catch (err) {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('devesec_session')?.value;

  // 1. Exceção especial para a tela pública de treinamento de phishing
  // Colaboradores que clicam no link do simulador DEVEM acessar /phishing/treinamento sem login
  if (pathname.startsWith('/phishing/treinamento')) {
    return NextResponse.next();
  }

  // 2. Proteção do console de campanhas /phishing
  const isProtected =
    PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    pathname === '/phishing' ||
    pathname.startsWith('/phishing/');

  const authenticated = await isValidSession(sessionCookie);

  // Se rota for protegida e usuário não estiver logado -> Redireciona para /login
  if (isProtected && !authenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se já estiver logado e tentar acessar /login, manda para a Home / Painel
  if (pathname === '/login' && authenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
