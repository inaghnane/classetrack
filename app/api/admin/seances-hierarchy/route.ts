import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(_req: NextRequest) {
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
        professorAssignments: {
          include: {
            module: { include: { filiere: true } },
            groupe: true,
          },
        },
      },
    });

    const hierarchy = await Promise.all(
      professors.map(async (prof) => {
        const modulesByFiliere = new Map<string, any>();
        const assignments = prof.professorAssignments || [];
        const seances = await prisma.seance.findMany({
          where: { profId: prof.id },
          include: {
            module: { include: { filiere: true } },
            groupe: true,
            attendances: true,
          },
          orderBy: { date: 'desc' },
        });

        assignments.forEach((assignment: any) => {
          const filiere = assignment.module.filiere;
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
          let moduleBlock = moduleEntry.modules.find((m: any) => m.id === assignment.module.id);
          if (!moduleBlock) {
            moduleBlock = {
              id: assignment.module.id,
              name: assignment.module.name,
              code: assignment.module.code,
              groupes: [],
            };
            moduleEntry.modules.push(moduleBlock);
          }

          let groupeBlock = moduleBlock.groupes.find((g: any) => g.groupe.id === assignment.groupe.id);
          if (!groupeBlock) {
            groupeBlock = {
              groupe: {
                id: assignment.groupe.id,
                name: assignment.groupe.name,
              },
              seances: [],
            };
            moduleBlock.groupes.push(groupeBlock);
          }
        });

        seances.forEach((seance) => {
          const filiere = seance.module.filiere;
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
          let moduleBlock = moduleEntry.modules.find((m: any) => m.id === seance.module.id);
          if (!moduleBlock) {
            moduleBlock = {
              id: seance.module.id,
              name: seance.module.name,
              code: seance.module.code,
              groupes: [],
            };
            moduleEntry.modules.push(moduleBlock);
          }

          let groupeBlock = moduleBlock.groupes.find((g: any) => g.groupe.id === seance.groupe.id);
          if (!groupeBlock) {
            groupeBlock = {
              groupe: {
                id: seance.groupe.id,
                name: seance.groupe.name,
              },
              seances: [],
            };
            moduleBlock.groupes.push(groupeBlock);
          }

          groupeBlock.seances.push({
            id: seance.id,
            date: seance.date.toISOString().split('T')[0],
            startTime: seance.startTime,
            endTime: seance.endTime,
            status: seance.status,
            confirmed: seance.confirmed,
            present: seance.attendances.filter((a) => a.status === 'PRESENT').length,
            absent: seance.attendances.filter((a) => a.status === 'ABSENT').length,
            total: enrollmentsByGroupe.get(seance.groupe.id) || 0,
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
      })
    );

    return NextResponse.json(hierarchy);
  } catch (error) {
    console.error('Error fetching admin hierarchy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
