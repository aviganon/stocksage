import { cookies, headers } from 'next/headers';
import { verifyIdToken } from '@/lib/firebase/admin';

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function verifyAuth(): Promise<{ uid: string; email: string | null }> {
  const h = await headers();
  const authHeader = h.get('Authorization') ?? h.get('authorization');
  let token: string | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else {
    const c = await cookies();
    token = c.get('__session')?.value ?? null;
  }

  if (!token) throw new AuthError('unauthenticated', 'No auth token');

  try {
    const decoded = await verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    throw new AuthError('invalid_token', 'Invalid or expired token');
  }
}
