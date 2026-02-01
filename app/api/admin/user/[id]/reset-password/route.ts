import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import * as bcryptjs from 'bcryptjs';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const defaultPassword = user.role === 'STUDENT' ? 'Student@12345' : 'Prof@12345';
    const passwordHash = await bcryptjs.hash(defaultPassword, 10);

    await prisma.user.update({
      where: { id: params.id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    return NextResponse.json({ success: true, message: `Mot de passe réinitialisé à ${defaultPassword}` });
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
