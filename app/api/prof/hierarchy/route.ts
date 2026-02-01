import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'PROF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profId = (session.user as any).id;

    // Récupérer toutes les assignations du professeur (module + groupe)
    const assignments = await prisma.professorAssignment.findMany({
      where: { profId },
      include: {
        module: { include: { filiere: true } },
        groupe: {
          include: {
            _count: { select: { enrollments: true } },
          },
        },
      },
    });

    const seances = await prisma.seance.findMany({
      where: { profId },
      include: {
        groupe: {
          include: {
            _count: { select: { enrollments: true } },
          },
        },
        attendances: true,
      },
    });

    // Organiser les données par filière
    const filieresMap = new Map();

    assignments.forEach((assignment) => {
      const module = assignment.module;
      const filiere = module.filiere;

      if (!filieresMap.has(filiere.id)) {
        filieresMap.set(filiere.id, {
          id: filiere.id,
          name: filiere.name,
          code: filiere.code,
          modules: {},
        });
      }

      const filiereData = filieresMap.get(filiere.id);
      if (!filiereData.modules[module.id]) {
        filiereData.modules[module.id] = {
          id: module.id,
          name: module.name,
          code: module.code,
          groupes: {},
        };
      }

      const groupesMap = filiereData.modules[module.id].groupes;
      if (!groupesMap[assignment.groupeId]) {
        groupesMap[assignment.groupeId] = {
          id: assignment.groupe.id,
          name: assignment.groupe.name,
          seances: [],
        };
      }

      seances
        .filter(
          (s) => s.moduleId === assignment.moduleId && s.groupeId === assignment.groupeId
        )
        .forEach((seance) => {
          const totalStudents = seance.groupe._count.enrollments;
          const presentCount = seance.attendances.filter((a: any) => a.status === 'PRESENT').length;
          const absentCount = seance.attendances.filter((a: any) => a.status === 'ABSENT').length;

          groupesMap[assignment.groupeId].seances.push({
            ...seance,
            stats: {
              total: totalStudents,
              present: presentCount,
              absent: absentCount,
            },
          });
        });
    });

    // Convertir la Map en array
    const filieres = Array.from(filieresMap.values()).map((filiere) => ({
      ...filiere,
      modules: Object.values(filiere.modules).map((module: any) => ({
        ...module,
        groupes: Object.values(module.groupes),
      })),
    }));

    return NextResponse.json(filieres);
  } catch (error) {
    console.error('Error fetching hierarchy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
