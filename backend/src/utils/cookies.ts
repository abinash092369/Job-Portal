import { Request } from 'express';

/**
 * Utility to extract a cookie value from raw Request headers.
 * Used to retrieve 'refreshToken' secure httpOnly cookie.
 */
export function getRefreshTokenFromCookie(req: Request): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, val] = cookie.trim().split('=');
    if (key && val) {
      acc[key] = decodeURIComponent(val);
    }
    return acc;
  }, {} as Record<string, string>);

  return cookies['refreshToken'] || null;
}
