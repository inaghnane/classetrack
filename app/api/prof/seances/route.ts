import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

async function requireProf(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'PROF') {
    return null;
  }
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireProf(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const professorId = (session.user as any).id;

  // Get modules taught by this professor
  const teachings = await prisma.professorTeaching.findMany({
    where: { profId: professorId },
    select: { moduleId: true },
  });

  const moduleIds = teachings.map((t) => t.moduleId);

  // Get seances for these modules
  const seances = await prisma.seance.findMany({
    where: { moduleId: { in: moduleIds } },
    include: {
      module: true,
      groupe: { include: { filiere: true } },
      attendances: { select: { id: true, studentId: true, status: true } },
    },
    orderBy: { date: 'asc' },
  });

  return NextResponse.json(seances);
}
