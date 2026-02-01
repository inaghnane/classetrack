import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

async function requireProf(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'PROF') {
    return null;
  }
  return session;
}

export async function GET(
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
      include: { filiere: true },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Seance not found' }, { status: 404 });
    }

    // Get all students in the same filière (not just the groupe)
    const filiereStudents = await prisma.enrollment.findMany({
      where: { 
        groupe: { filiereId: seance.filiereId },
      },
      select: { studentId: true },
    });

    const studentIds = filiereStudents.map((e) => e.studentId);

    // Get attendance records
    const attendances = await prisma.attendance.findMany({
      where: { seanceId: params.id },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Separate present and absent
    const presentIds = new Set(
      attendances.filter((a) => a.status === 'PRESENT').map((a) => a.studentId)
    );

    const absentStudents = await prisma.user.findMany({
      where: {
        id: { in: studentIds.filter((id) => !presentIds.has(id)) },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    return NextResponse.json({
      present: attendances
        .filter((a) => a.status === 'PRESENT')
        .map((a) => a.student),
      absent: absentStudents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
