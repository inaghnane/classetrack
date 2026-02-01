import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Récupérer tous les justificatifs pour le professeur
export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'PROF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profId = (session.user as any).id;

    const assignments = await prisma.professorAssignment.findMany({
      where: { profId },
      select: { moduleId: true, groupeId: true },
    });

    // Récupérer les justificatifs pour les séances assignées à ce prof
    const justifications = await prisma.justification.findMany({
      where: {
        seance: {
          OR: assignments.map((a) => ({
            moduleId: a.moduleId,
            groupeId: a.groupeId,
          })),
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        seance: {
          include: {
            module: true,
            groupe: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(justifications);
  } catch (error) {
    console.error('Error fetching justifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Approuver/Rejeter un justificatif avec commentaire
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'PROF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { justificationId, status, adminComment } = await req.json();

    if (!justificationId || !status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'justificationId et status (APPROVED/REJECTED) requis' },
        { status: 400 }
      );
    }

    const profId = (session.user as any).id;

    // Vérifier que le justificatif existe et appartient à un module/groupe assigné à ce prof
    const justification = await prisma.justification.findUnique({
      where: { id: justificationId },
      include: {
        seance: true,
      },
    });

    if (!justification) {
      return NextResponse.json({ error: 'Justificatif non trouvé' }, { status: 404 });
    }

    const assignment = await prisma.professorAssignment.findFirst({
      where: {
        profId,
        moduleId: justification.seance.moduleId,
        groupeId: justification.seance.groupeId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas assigné à ce module/groupe' },
        { status: 403 }
      );
    }

    // Mettre à jour le justificatif
    const updated = await prisma.justification.update({
      where: { id: justificationId },
      data: {
        status,
        adminComment: adminComment || null,
      },
    });

    return NextResponse.json({
      message: `Justificatif ${status === 'APPROVED' ? 'approuvé' : 'rejeté'} avec succès`,
      justification: updated,
    });
  } catch (error) {
    console.error('Error updating justification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
