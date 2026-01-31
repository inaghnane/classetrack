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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireProf(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const seance = await prisma.seance.findUnique({
      where: { id: params.id },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Seance not found' }, { status: 404 });
    }

    if (seance.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Seance is not in OPEN status' },
        { status: 400 }
      );
    }

    // Récupérer tous les étudiants du groupe
    const enrollments = await prisma.enrollment.findMany({
      where: { groupeId: seance.groupeId },
      select: { studentId: true },
    });

    // Récupérer les étudiants déjà présents
    const presentAttendances = await prisma.attendance.findMany({
      where: { seanceId: params.id, status: 'PRESENT' },
      select: { studentId: true },
    });

    const presentStudentIds = new Set(presentAttendances.map(a => a.studentId));
    
    // Créer des enregistrements ABSENT pour les étudiants qui n'ont pas scanné
    const absentStudents = enrollments.filter(e => !presentStudentIds.has(e.studentId));
    
    if (absentStudents.length > 0) {
      await prisma.attendance.createMany({
        data: absentStudents.map(e => ({
          studentId: e.studentId,
          seanceId: params.id,
          status: 'ABSENT',
        })),
        skipDuplicates: true,
      });
    }

    const updated = await prisma.seance.update({
      where: { id: params.id },
      data: { status: 'CLOSED' },
      include: {
        module: true,
        groupe: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
