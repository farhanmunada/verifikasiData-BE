import { verify } from 'hono/jwt';
import { env } from '../config/env';

export interface JwtPayload {
  id: number;
  username: string;
  exp: number;
  iat: number;
}



export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const payload = await verify(token, env.JWT_SECRET, 'HS256');
    return payload as unknown as JwtPayload;
  } catch (err: any) {
    console.error('JWT Verification error:', err?.message || err);
    return null;
  }
}
