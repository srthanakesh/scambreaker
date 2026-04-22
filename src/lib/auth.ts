import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const rawJwtSecret = process.env.JWT_SECRET;
if (!rawJwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  } else {
    console.warn('⚠️  JWT_SECRET is missing. Using unsafe fallback for development.');
  }
}
const JWT_SECRET = new TextEncoder().encode(rawJwtSecret || 'super-secret-key-for-scambreaker-dev');
const COOKIE_NAME = 'sb_session';

export type SessionPayload = {
  userId: string;
  role: 'VICTIM' | 'AUTHORITY';
  email: string;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 2 * 60 * 60, // 2 hours
  });
}

export async function getSessionPayload(token?: string): Promise<SessionPayload | null> {
  const tokenToVerify = token || (await cookies()).get(COOKIE_NAME)?.value;
  if (!tokenToVerify) return null;

  try {
    const verified = await jwtVerify(tokenToVerify, JWT_SECRET);
    return verified.payload as SessionPayload;
  } catch (err) {
    return null;
  }
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  return await getSessionPayload();
}
