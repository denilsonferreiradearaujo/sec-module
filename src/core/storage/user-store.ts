import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  salt: string;
  role: 'ADMIN' | 'OPERATOR' | 'AUDITOR';
  twoFactorEnabled: boolean;
  twoFactorMethod: 'whatsapp' | 'email';
  createdAt: string;
  updatedAt: string;
}

export interface AuthOtpToken {
  id: string;
  identifier: string; // email ou telefone normalizado
  code: string;
  type: '2FA' | 'RESET_PASSWORD';
  expiresAt: string; // ISO
  used: boolean;
  createdAt: string;
}

export interface UserSessionPayload {
  userId: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR' | 'AUDITOR';
  exp: number; // Unix timestamp em segundos
}

const AUTH_DIR = path.join(process.cwd(), 'data', 'auth');
const USERS_FILE = path.join(AUTH_DIR, 'users.json');
const TOKENS_FILE = path.join(AUTH_DIR, 'tokens.json');

const JWT_SECRET = process.env.AUTH_JWT_SECRET || 'devesec-enterprise-super-secret-key-2025-hmac-sha256';

async function ensureDir() {
  try {
    await fs.mkdir(AUTH_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

// ========================================================
// CRIPTOGRAFIA DE SENHAS (PBKDF2 Seguro)
// ========================================================
export function hashPassword(password: string, customSalt?: string): { hash: string; salt: string } {
  const salt = customSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const calculated = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated, 'hex'), Buffer.from(hash, 'hex'));
}

// ========================================================
// GERENCIAMENTO DE SESSÃO ASSINADA (HMAC SHA-256 JWT-LIKE)
// ========================================================
function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString();
}

export function createSessionToken(user: Pick<UserAccount, 'id' | 'email' | 'name' | 'role'>, expiresInDays = 7): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const payload: UserSessionPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp,
  };

  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${headerB64}.${payloadB64}.${signature}`;
}

export function verifySessionToken(token: string): UserSessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== expectedSig) return null;

    const payload: UserSessionPayload = JSON.parse(base64UrlDecode(payloadB64));
    if (Date.now() / 1000 > payload.exp) {
      return null; // Token expirado
    }

    return payload;
  } catch {
    return null;
  }
}

// ========================================================
// PERSISTÊNCIA DE USUÁRIOS
// ========================================================
export async function getUsers(): Promise<UserAccount[]> {
  await ensureDir();
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    const users: UserAccount[] = JSON.parse(data);
    if (users && users.length > 0) return users;
  } catch {
    // Arquivo não existe ou inválido, inicializa com seed padrão
  }

  // Seed padrão corporativo
  const defaultPassword = process.env.ROOT_PASSWORD || 'DevSec2025!@';
  const { hash, salt } = hashPassword(defaultPassword);

  const initialUsers: UserAccount[] = [
    {
      id: 'user_admin_root',
      name: 'Administrador DEV & SEC',
      email: 'contato@devesec.com',
      phone: process.env.NEXT_PUBLIC_WHATSAPP || '5519999486552',
      passwordHash: hash,
      salt,
      role: 'ADMIN',
      twoFactorEnabled: false,
      twoFactorMethod: 'whatsapp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user_admin_alias',
      name: 'Denilson Ferreira (Root)',
      email: 'admin@devesec.com',
      phone: '5519999486552',
      passwordHash: hash,
      salt,
      role: 'ADMIN',
      twoFactorEnabled: false,
      twoFactorMethod: 'whatsapp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  await fs.writeFile(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');
  return initialUsers;
}

export async function findUserByEmail(email: string): Promise<UserAccount | null> {
  const users = await getUsers();
  const cleanEmail = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === cleanEmail) || null;
}

export async function findUserByPhoneOrEmail(input: string): Promise<UserAccount | null> {
  const users = await getUsers();
  const raw = input.trim().toLowerCase();
  
  if (raw.includes('@')) {
    return users.find((u) => u.email.toLowerCase() === raw) || null;
  }

  // Busca por telefone (com ou sem 55, com ou sem nono dígito)
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;

  const suffix8 = digits.length >= 8 ? digits.slice(-8) : digits;

  return users.find((u) => {
    if (!u.phone) return false;
    const uDigits = u.phone.replace(/\D/g, '');
    return (
      uDigits === digits ||
      uDigits.endsWith(digits) ||
      digits.endsWith(uDigits) ||
      (suffix8.length >= 8 && uDigits.endsWith(suffix8))
    );
  }) || null;
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
  const users = await getUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) return false;

  const { hash, salt } = hashPassword(newPassword);
  users[index].passwordHash = hash;
  users[index].salt = salt;
  users[index].updatedAt = new Date().toISOString();

  await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  return true;
}

// ========================================================
// PERSISTÊNCIA E VALIDAÇÃO DE TOKENS OTP (120 Segundos)
// ========================================================
async function getTokens(): Promise<AuthOtpToken[]> {
  await ensureDir();
  try {
    const data = await fs.readFile(TOKENS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function saveTokens(tokens: AuthOtpToken[]): Promise<void> {
  await ensureDir();
  // Limpar tokens expirados com mais de 24 horas
  const now = Date.now();
  const filtered = tokens.filter((t) => now - new Date(t.createdAt).getTime() < 24 * 60 * 60 * 1000);
  await fs.writeFile(TOKENS_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
}

export async function createOtpToken(
  identifier: string,
  type: '2FA' | 'RESET_PASSWORD',
  validitySeconds = 120
): Promise<string> {
  const tokens = await getTokens();
  const cleanId = identifier.trim().toLowerCase();

  // Invalida tokens anteriores não usados para o mesmo identificador
  tokens.forEach((t) => {
    if (t.identifier.toLowerCase() === cleanId && t.type === type && !t.used) {
      t.used = true;
    }
  });

  // Código OTP de 6 dígitos numéricos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + validitySeconds * 1000).toISOString();

  const newToken: AuthOtpToken = {
    id: `otp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    identifier: cleanId,
    code,
    type,
    expiresAt,
    used: false,
    createdAt: new Date().toISOString(),
  };

  tokens.push(newToken);
  await saveTokens(tokens);

  return code;
}

export async function verifyOtpToken(
  identifier: string,
  code: string,
  type: '2FA' | 'RESET_PASSWORD'
): Promise<boolean> {
  const tokens = await getTokens();
  const cleanId = identifier.trim().toLowerCase();
  const cleanCode = code.trim();
  const now = new Date();

  const foundIndex = tokens.findIndex((t) => {
    if (t.used) return false;
    if (t.type !== type) return false;
    if (t.code !== cleanCode) return false;
    if (new Date(t.expiresAt) <= now) return false;

    // Compara identificador (email direto ou variações de telefone)
    if (cleanId.includes('@')) {
      return t.identifier.toLowerCase() === cleanId;
    }
    const targetDigits = cleanId.replace(/\D/g, '');
    const tokenDigits = t.identifier.replace(/\D/g, '');
    const targetSuffix8 = targetDigits.slice(-8);
    const tokenSuffix8 = tokenDigits.slice(-8);
    return (
      targetDigits === tokenDigits ||
      targetDigits.endsWith(tokenDigits) ||
      tokenDigits.endsWith(targetDigits) ||
      (targetSuffix8.length >= 8 && targetSuffix8 === tokenSuffix8)
    );
  });

  if (foundIndex === -1) {
    return false;
  }

  // Marca como usado
  tokens[foundIndex].used = true;
  await saveTokens(tokens);
  return true;
}
