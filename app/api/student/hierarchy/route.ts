import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = (session.user as any).id;

    // Récupérer l'étudiant avec ses enrollments pour accéder à sa filière via le groupe
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        enrollments: {
          include: {
            groupe: {
              include: {
                filiere: {
                  include: {
                    modules: {
                      include: {
                        seance: {
                          include: {
                            groupe: true,
                          },
                          where: {
                            status: {
                              in: ['OPEN', 'CLOSED'],
                            },
                          },
                          orderBy: {
                            date: 'desc',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student || !student.enrollments.length) {
      return NextResponse.json({ error: 'Student not enrolled in any groupe' }, { status: 404 });
    }

    // Récupérer la filière du premier enrollment (tous les enrollments devraient être dans la même filière)
    const filiere = student.enrollments[0].groupe.filiere;

    // Organiser les données par module
    const modules = filiere.modules.map((module: any) => ({
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
      modules,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching student hierarchy:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
