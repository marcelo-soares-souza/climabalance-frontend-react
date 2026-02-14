import { jwtDecode } from 'jwt-decode';
import type { JwtPayload } from '@/types/auth';

export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  return Date.now() >= payload.exp * 1000;
}

export function getTokenExpiresAt(token: string): number {
  const payload = decodeToken(token);
  if (!payload) return 0;
  return payload.exp * 1000;
}
