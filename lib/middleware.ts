import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Add CORS headers for Cloudflare compatibility
 * Fixes "Internal Server Error" issues when using Cloudflare
 */
export function addCloudflareHeaders(response: NextResponse): NextResponse {
  // CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  // Cache control for Cloudflare
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  // Additional headers for reliability
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  return response;
}

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
