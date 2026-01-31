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

    const seance = await prisma.seance.create({
      data: {
        moduleId: validated.moduleId,
        groupeId: validated.groupeId,
        date: validated.date,
        startTime: validated.startTime,
        endTime: validated.endTime,
      },
      include: {
        module: true,
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
