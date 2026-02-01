import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createSeanceSchema } from '@/lib/validation';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function GET() {
const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const seance = await prisma.seance.findMany({
    include: {
      module: true,
      groupe: { include: { filiere: true } },
      professor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { date: 'asc' },
  });
  return NextResponse.json(seance);
}

export async function POST(request: NextRequest) {
const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createSeanceSchema.parse(body);

    // Récupérer le module pour obtenir le filiereId
    const module = await prisma.module.findUnique({
      where: { id: validated.moduleId },
      select: { filiereId: true },
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 400 }
      );
    }

    const assignment = await prisma.professorAssignment.findFirst({
      where: {
        profId: validated.profId,
        moduleId: validated.moduleId,
        groupeId: validated.groupeId,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Le professeur n\'est pas assigné à ce module/groupe' },
        { status: 400 }
      );
    }

    const seance = await prisma.seance.create({
      data: {
        moduleId: validated.moduleId,
        groupeId: validated.groupeId,
        filiereId: module.filiereId,
        profId: validated.profId,
        date: validated.date,
        startTime: validated.startTime,
        endTime: validated.endTime,
      },
      include: {
        module: true,
        groupe: { include: { filiere: true } },
        filiere: true,
        professor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json(seance, { status: 201 });
  } catch (error: any) {
    if (error.errors) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Referenced resource not found' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
