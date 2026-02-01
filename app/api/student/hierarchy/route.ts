import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = (session.user as any).id;

    // Récupérer les inscriptions (groupes) de l'étudiant
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        groupe: {
          include: {
            filiere: true,
          },
        },
      },
    });

    if (!enrollments.length) {
      return NextResponse.json({ error: 'Student not enrolled in any groupe' }, { status: 404 });
    }

    const groupeIds = enrollments.map((e) => e.groupeId);
    const filiere = enrollments[0].groupe.filiere;

    // Récupérer uniquement les modules de la filière + séances du/des groupe(s) de l'étudiant
    const modules = await prisma.module.findMany({
      where: {
        filiereId: filiere.id,
      },
      include: {
        seance: {
          where: {
            status: { in: ['PLANNED', 'OPEN', 'CLOSED'] },
            groupeId: { in: groupeIds },
          },
          include: {
            groupe: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const formattedModules = modules.map((module: any) => ({
      id: module.id,
      name: module.name,
      code: module.code,
      seances: module.seance.map((seance: any) => ({
        id: seance.id,
        date: seance.date,
        startTime: seance.startTime,
        endTime: seance.endTime,
        status: seance.status,
        groupeName: seance.groupe.name,
        groupeId: seance.groupe.id,
      })),
    }));

    const result = {
      filiere: {
        id: filiere.id,
        name: filiere.name,
        code: filiere.code,
      },
      modules: formattedModules,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student hierarchy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
