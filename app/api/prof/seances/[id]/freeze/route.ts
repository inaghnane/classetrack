import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

async function requireProf(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'PROF') {
    return null;
  }
  return session;
}

/**
 * POST /api/prof/seances/[id]/freeze
 * Geler le QR code (le rendre statique)
 * Le QR s'affichera toujours le même et ne changera pas toutes les 3 secondes
 * Utile pour scanner facilement sans que le QR change
 *
 * Request body: { frozen: true/false }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireProf(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { frozen } = body; // true = geler, false = dégeler

    const seance = await prisma.seance.findUnique({
      where: { id: params.id },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Seance not found' }, { status: 404 });
    }

    if (seance.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Seance must be OPEN' },
        { status: 400 }
      );
    }

    const updated = await prisma.seance.update({
      where: { id: params.id },
      data: {
        qrFrozen: frozen === true,
        updatedAt: new Date(),
      },
      include: {
        module: true,
        groupe: true,
      },
    });

    return NextResponse.json(
      {
        id: updated.id,
        status: updated.status,
        qrSecret: updated.qrSecret,
        qrFrozen: updated.qrFrozen,
        message: updated.qrFrozen
          ? 'QR code frozen ❄️ - It will not change anymore'
          : 'QR code unfrozen ☀️ - It will change every 3 seconds',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[FREEZE-QR] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
