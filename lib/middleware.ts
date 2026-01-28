import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAuth(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }

  const userRole = (session.user as any)?.role;
  if (!allowedRoles.includes(userRole)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { session, status: 200 };
}
