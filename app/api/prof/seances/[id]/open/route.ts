import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateQRSecret } from '@/lib/qr-generator';

async function requireProf(request: NextRequest) {
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

    const qrSecret = seance.qrSecret ?? generateQRSecret();

    const updated = await prisma.seance.update({
      where: { id: params.id },
      data: {
        status: 'OPEN',
        qrSecret,
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
