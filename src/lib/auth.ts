import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import { cookies } from 'next/headers';

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';
const durationToSeconds = (duration: string): number => {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration);
  if (!match || Number(match[1]) <= 0) {
    throw new Error('La duración del token debe usar un formato como 15m o 7d');
  }

  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return Number(match[1]) * units[match[2]];
};

const getSecret = (name: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): Uint8Array => {
  const secret = process.env[name];
  if (!secret || secret.length < 32) {
    throw new Error(`${name} debe estar configurado con al menos 32 caracteres`);
  }
  return new TextEncoder().encode(secret);
};

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getSecret('JWT_ACCESS_SECRET'));
}

export async function signRefreshToken(payload: TokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(getSecret('JWT_REFRESH_SECRET'));
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, getSecret('JWT_ACCESS_SECRET'));
    return verified.payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const verified = await jwtVerify(token, getSecret('JWT_REFRESH_SECRET'));
    return verified.payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === 'production';

  cookieStore.set({
    name: 'accessToken',
    value: accessToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: durationToSeconds(ACCESS_TOKEN_TTL),
  });

  cookieStore.set({
    name: 'refreshToken',
    value: refreshToken,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: durationToSeconds(REFRESH_TOKEN_TTL),
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
}