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

/**
 * POST /api/prof/seances/[id]/extend
 * Étendre le temps de validité du QR code de 5 minutes supplémentaires
 * Régénère un nouveau qrSecret pour remettre le compteur à zéro
 * Utile en cas de problème technique (caméra cassée, etc.)
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
    const seance = await prisma.seance.findUnique({
      where: { id: params.id },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Seance not found' }, { status: 404 });
    }

    if (seance.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Seance must be OPEN to extend time' },
        { status: 400 }
      );
    }

    // Générer un nouveau qrSecret pour remettre le compteur à zéro
    // Cela ajoute effectivement 5 minutes de validité
    const newQRSecret = generateQRSecret();

    const updated = await prisma.seance.update({
      where: { id: params.id },
      data: {
        qrSecret: newQRSecret,
        updatedAt: new Date(), // Reset le timer
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
        message: 'QR time extended by 5 minutes ✓',
        extendedAt: new Date(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[EXTEND-QR] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
