import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createSeanceSchema } from '@/lib/validation';

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const seances = await prisma.seance.findMany({
    include: {
      module: true,
      professor: { select: { id: true, email: true, firstName: true, lastName: true } },
      groupe: { include: { filiere: true } },
    },
    orderBy: { startsAt: 'asc' },
  });
  return NextResponse.json(seances);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createSeanceSchema.parse(body);

    // Verify professor is actually a PROF
    const professor = await prisma.user.findUnique({
      where: { id: body.professorId },
    });

    if (!professor || professor.role !== 'PROF') {
      return NextResponse.json(
        { error: 'Professor not found or invalid role' },
        { status: 400 }
      );
    }

    const seance = await prisma.seance.create({
      data: {
        ...validated,
        professorId: body.professorId,
      },
      include: {
        module: true,
        professor: { select: { id: true, email: true, firstName: true, lastName: true } },
        groupe: { include: { filiere: true } },
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
