import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { enrollSchema } from '@/lib/validation';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function GET(_request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const enrollment = await prisma.enrollment.findMany({
    include: {
      student: { select: { id: true, email: true, firstName: true, lastName: true } },
      groupe: {
        include: {
          filiere: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(enrollment);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = enrollSchema.parse(body);

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: validated.studentId,
        groupeId: validated.groupeId,
      },
      include: {
        student: { select: { id: true, email: true, firstName: true, lastName: true } },
        groupe: {
          include: { filiere: true },
        },
      },
    });

    return NextResponse.json(enrollment, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Étudiant déjà inscrit dans ce groupe' },
        { status: 400 }
      );
    }
    if (error.errors) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
