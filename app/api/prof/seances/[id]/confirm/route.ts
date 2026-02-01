import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

async function requireProf() {
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
  const session = await requireProf();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { confirmed } = body;

    if (typeof confirmed !== 'boolean') {
      return NextResponse.json({ error: 'confirmed doit être un boolean' }, { status: 400 });
    }

    const seance = await prisma.seance.findUnique({
      where: { id: params.id },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Seance not found' }, { status: 404 });
    }

    if (seance.status !== 'CLOSED') {
      return NextResponse.json({ error: 'Seule une séance clôturée peut être confirmée' }, { status: 400 });
    }

    const updatedSeance = await prisma.seance.update({
      where: { id: params.id },
      data: { confirmed },
    });

    return NextResponse.json({ success: true, confirmed: updatedSeance.confirmed });
  } catch (error) {
    console.error('Confirm seance error:', error);
    const err = error as any;
    if (err?.code === 'P2022' || String(err?.message || '').includes('Unknown column')) {
      return NextResponse.json(
        { error: "Colonne 'confirmed' manquante. Exécute: ALTER TABLE seance ADD COLUMN confirmed BOOLEAN NOT NULL DEFAULT false;" },
        { status: 400 }
      );
    }
    const message = err?.message || 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
