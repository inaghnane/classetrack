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

  // Récupérer les groupes de l'étudiant
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId },
    include: {
      groupe: {
        include: { filiere: true },
      },
    },
  });

  if (!enrollments.length) {
    return NextResponse.json([]);
  }

  const groupeIds = enrollments.map((e) => e.groupeId);
  const filiereId = enrollments[0].groupe.filiereId;

  const attendances = await prisma.attendance.findMany({
    where: {
      studentId,
      seance: {
        groupeId: { in: groupeIds },
        filiereId,
      },
    },
    include: {
      seance: {
        include: {
          module: true,
          groupe: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Récupérer les séances clôturées des groupes de l'étudiant
  const closedSeances = await prisma.seance.findMany({
    where: {
      groupeId: { in: groupeIds },
      filiereId,
      status: 'CLOSED',
    },
    include: {
      module: true,
      groupe: true,
    },
  });

  const attendedSeanceIds = new Set(attendances.map(a => a.seanceId));

  const computedAbsences = closedSeances
    .filter(seance => !attendedSeanceIds.has(seance.id))
    .map(seance => ({
      id: `absent-${seance.id}`,
      studentId,
      seanceId: seance.id,
      status: 'ABSENT',
      createdAt: seance.date,
      updatedAt: seance.updatedAt,
      seance,
    }));

  const merged = [...attendances, ...computedAbsences].sort((a: any, b: any) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return NextResponse.json(merged);
}
