import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'PROF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profId = (session.user as any).id;

    // Récupérer tous les modules enseignés par le professeur
    const professorTeachings = await prisma.professorTeaching.findMany({
      where: { profId },
      include: {
        module: {
          include: {
            filiere: true,
            seance: {
              include: {
                groupe: true,
              },
            },
          },
        },
      },
    });

    // Organiser les données par filière
    const filieresMap = new Map();

    professorTeachings.forEach((teaching) => {
      const module = teaching.module;
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

      // Organiser les séances par groupe
      const groupesMap = filiereData.modules[module.id].groupes;
      module.seance.forEach((seance) => {
        const groupeId = seance.groupe.id;
        if (!groupesMap[groupeId]) {
          groupesMap[groupeId] = {
            id: seance.groupe.id,
            name: seance.groupe.name,
            seances: [],
          };
        }
        groupesMap[groupeId].seances.push(seance);
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
