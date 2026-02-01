import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateQRSecret } from '@/lib/qr-generator';

async function requireProf(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'PROF') {
    return null;
  }
  return session;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireProf(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const seance = await prisma.seance.findUnique({
      where: { id: params.id },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Seance not found' }, { status: 404 });
    }

    if (seance.status !== 'PLANNED') {
      return NextResponse.json(
        { error: 'Seance is not in PLANNED status' },
        { status: 400 }
      );
    }

    const profId = (session.user as any).id;

    if (seance.profId && seance.profId !== profId) {
      return NextResponse.json(
        { error: 'Seance is assigned to another professor' },
        { status: 403 }
      );
    }

    if (!seance.profId) {
      const assignment = await prisma.professorAssignment.findFirst({
        where: {
          profId,
          moduleId: seance.moduleId,
          groupeId: seance.groupeId,
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: 'Vous n\'êtes pas assigné à ce module/groupe' },
          { status: 403 }
        );
      }
    }

    const qrSecret = seance.qrSecret ?? generateQRSecret();

    const updated = await prisma.seance.update({
      where: { id: params.id },
      data: {
        status: 'OPEN',
        qrSecret,
        profId: seance.profId ?? profId,
      },
      include: {
        module: true,
        groupe: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
