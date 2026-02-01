import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

async function requireStudent(_request: NextRequest) {
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

  // Get student's groups
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    select: { groupeId: true },
  });

  const groupIds = enrollments.map((e) => e.groupeId);

  // Get seances for those groups
  const seances = await prisma.seance.findMany({
    where: { groupeId: { in: groupIds } },
    include: {
      module: true,
      groupe: true,
    },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(seances);
}
