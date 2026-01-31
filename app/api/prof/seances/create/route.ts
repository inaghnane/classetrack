import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Récupérer les séances d'un prof
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'PROF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profId = (session.user as any).id;

    const seances = await prisma.seance.findMany({
      where: {
        module: {
          professorTeachings: {
            some: {
              profId,
            },
          },
        },
      },
      include: {
        module: true,
        groupe: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(seances);
  } catch (error) {
    console.error('Error fetching seances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Créer une nouvelle séance
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'PROF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { moduleId, groupeId, date, startTime, endTime } = await req.json();

    if (!moduleId || !groupeId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const profId = (session.user as any).id;

    // Vérifier que le prof enseigne ce module
    const teaching = await prisma.professorTeaching.findFirst({
      where: {
        profId,
        moduleId,
      },
    });

    if (!teaching) {
      return NextResponse.json(
        { error: 'Vous n\'enseignez pas ce module' },
        { status: 403 }
      );
    }

    // Vérifier que le groupe appartient à la filière du module
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
    });

    const groupe = await prisma.groupe.findUnique({
      where: { id: groupeId },
    });

    if (!module || !groupe || module.filiereId !== groupe.filiereId) {
      return NextResponse.json(
        { error: 'Le groupe n\'appartient pas à la même filière' },
        { status: 400 }
      );
    }

    // Créer la séance
    const seance = await prisma.seance.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        status: 'PLANNED',
        moduleId,
        groupeId,
      },
      include: {
        module: true,
        groupe: true,
      },
    });

    return NextResponse.json({
      message: 'Séance créée avec succès',
      seance,
    });
  } catch (error) {
    console.error('Error creating seance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
