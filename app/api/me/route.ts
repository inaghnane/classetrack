import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  return NextResponse.json(user);
}
