import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

async function requireProf() {
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
  const session = await requireProf();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { studentIds } = body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'studentIds requis' }, { status: 400 });
    }

    const seance = await prisma.seance.findUnique({
      where: { id: params.id },
      include: { 
        groupe: true,
        filiere: true,
      },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Seance not found' }, { status: 404 });
    }

    if (seance.status !== 'OPEN') {
      return NextResponse.json({ error: 'Seance is not open' }, { status: 400 });
    }

    // Vérifier que tous les étudiants sont dans la même filière (pas forcément le même groupe)
    const enrollments = await prisma.enrollment.findMany({
      where: { 
        studentId: { in: studentIds },
        groupe: { filiereId: seance.filiereId },
      },
      select: { studentId: true },
    });

    const allowedStudentIds = new Set(enrollments.map((e) => e.studentId));
    const invalidStudents = studentIds.filter((id: string) => !allowedStudentIds.has(id));

    if (invalidStudents.length > 0) {
      return NextResponse.json({ 
        error: 'Certains étudiants ne sont pas dans cette filière',
        invalidStudents 
      }, { status: 403 });
    }

    const results = await Promise.all(
      studentIds.map(async (studentId: string) => {
        return prisma.attendance.upsert({
          where: { studentId_seanceId: { studentId, seanceId: seance.id } },
          update: { status: 'PRESENT' },
          create: { studentId, seanceId: seance.id, status: 'PRESENT' },
        });
      })
    );

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('Manual mark present error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
