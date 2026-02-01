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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireProf();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const groupeId = params.id;
    const profId = (session.user as any).id;

    const assignment = await prisma.professorAssignment.findFirst({
      where: { profId, groupeId },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Groupe non assigné' }, { status: 403 });
    }

    // Récupérer tous les étudiants du groupe
    const enrollments = await prisma.enrollment.findMany({
      where: { groupeId },
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

    const studentIds = enrollments.map((e) => e.studentId);

    // Récupérer toutes les séances fermées du groupe
    const seances = await prisma.seance.findMany({
      where: {
        groupeId,
        status: 'CLOSED',
      },
      select: {
        id: true,
        date: true,
      },
    });

    const seanceIds = seances.map((s) => s.id);

    // Récupérer toutes les absences
    const attendances = await prisma.attendance.findMany({
      where: {
        seanceId: { in: seanceIds },
        studentId: { in: studentIds },
        status: 'ABSENT',
      },
      include: {
        seance: {
          select: {
            id: true,
            date: true,
          },
        },
      },
    });

    // Récupérer toutes les justifications pour ces séances
    const justifications = await prisma.justification.findMany({
      where: {
        seanceId: { in: seanceIds },
        studentId: { in: studentIds },
      },
      select: {
        studentId: true,
        seanceId: true,
        status: true,
      },
    });

    // Créer un map des justifications pour accès rapide
    const justifMap = new Map<string, string>();
    justifications.forEach((j) => {
      justifMap.set(`${j.studentId}_${j.seanceId}`, j.status);
    });

    // Grouper les absences par étudiant
    const absencesByStudent = new Map<string, any>();

    enrollments.forEach((enrollment) => {
      const studentAbsences = attendances.filter(
        (att) => att.studentId === enrollment.studentId
      );

      const absencesWithJustif = studentAbsences.map((absence) => {
        const justifKey = `${absence.studentId}_${absence.seanceId}`;
        const justificationStatus = justifMap.get(justifKey);

        return {
          seanceId: absence.seanceId,
          date: absence.seance.date,
          hasJustification: !!justificationStatus,
          justificationStatus: justificationStatus || null,
        };
      });

      if (studentAbsences.length > 0) {
        absencesByStudent.set(enrollment.studentId, {
          student: enrollment.student,
          totalAbsences: studentAbsences.length,
          absences: absencesWithJustif,
        });
      }
    });

    // Regrouper par nombre d'absences
    const grouped = new Map<number, any[]>();

    absencesByStudent.forEach((data) => {
      const count = data.totalAbsences;
      if (!grouped.has(count)) {
        grouped.set(count, []);
      }
      grouped.get(count)!.push(data);
    });

    // Convertir en tableau trié
    const result = Array.from(grouped.entries())
      .map(([count, students]) => ({
        absenceCount: count,
        students,
      }))
      .sort((a, b) => b.absenceCount - a.absenceCount);

    const totalAbsences = attendances.length;
    const totalJustified = attendances.filter((a) => {
      const key = `${a.studentId}_${a.seanceId}`;
      return justifMap.has(key);
    }).length;

    const totalApproved = attendances.filter((a) => {
      const key = `${a.studentId}_${a.seanceId}`;
      return justifMap.get(key) === 'APPROVED';
    }).length;

    return NextResponse.json({
      totalSeances: seances.length,
      totalAbsences,
      totalJustified,
      totalApproved,
      stats: result,
    });
  } catch (error) {
    console.error('Error fetching absence stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
