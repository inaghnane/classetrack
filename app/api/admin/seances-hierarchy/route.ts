import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Récupérer les enrollements pour chaque groupe
    const enrollmentsByGroupe = new Map<string, number>();
    const allGroupes = await prisma.groupe.findMany({
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });
    allGroupes.forEach((groupe) => {
      enrollmentsByGroupe.set(groupe.id, groupe._count.enrollments);
    });

    // Récupérer tous les professeurs avec leurs modules et groupes
    const professors = await prisma.user.findMany({
      where: { role: 'PROF' },
      include: {
        professorTeachings: {
          include: {
            module: {
              include: {
                filiere: true,
                seance: {
                  include: {
                    groupe: true,
                    attendances: true,
                  },
                  orderBy: { date: 'desc' },
                },
              },
            },
          },
        },
      },
    });

    // Organiser les données de manière hiérarchique
    const hierarchy = professors.map((prof) => {
      // Grouper les modules par filière
      const modulesByFiliere = new Map<string, any>();

      prof.professorTeachings.forEach((teaching) => {
        const filiere = teaching.module.filiere;
        if (!modulesByFiliere.has(filiere.id)) {
          modulesByFiliere.set(filiere.id, {
            filiere: {
              id: filiere.id,
              name: filiere.name,
              code: filiere.code,
            },
            modules: [],
          });
        }

        const moduleEntry = modulesByFiliere.get(filiere.id);
        
        // Grouper les séances par groupe
        const seancesByGroupe = new Map<string, any>();
        teaching.module.seance.forEach((seance) => {
          if (!seancesByGroupe.has(seance.groupe.id)) {
            seancesByGroupe.set(seance.groupe.id, {
              groupe: {
                id: seance.groupe.id,
                name: seance.groupe.name,
              },
              seances: [],
            });
          }

          seancesByGroupe.get(seance.groupe.id).seances.push({
            id: seance.id,
            date: seance.date.toISOString().split('T')[0],
            startTime: seance.startTime,
            endTime: seance.endTime,
            status: seance.status,
            present: seance.attendances.filter((a) => a.status === 'PRESENT').length,
            absent: seance.attendances.filter((a) => a.status === 'ABSENT').length,
            total: enrollmentsByGroupe.get(seance.groupe.id) || 0,
          });
        });

        moduleEntry.modules.push({
          id: teaching.module.id,
          name: teaching.module.name,
          code: teaching.module.code,
          groupes: Array.from(seancesByGroupe.values()),
        });
      });

      return {
        professor: {
          id: prof.id,
          name: prof.name,
          firstName: prof.firstName,
          lastName: prof.lastName,
          email: prof.email,
        },
        filieres: Array.from(modulesByFiliere.values()),
      };
    });

    return NextResponse.json(hierarchy);
  } catch (error) {
    console.error('Error fetching admin hierarchy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
