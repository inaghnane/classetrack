import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

async function requireStudent(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'STUDENT') {
    return null;
  }
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireStudent(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const studentId = (session.user as any).id;

  const attendances = await prisma.attendance.findMany({
    where: { studentId },
    include: {
      seance: {
        include: {
          module: true,
          groupe: true,
          professor: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { markedAt: 'desc' },
  });

  return NextResponse.json(attendances);
}
