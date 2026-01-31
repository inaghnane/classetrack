import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createGroupeSchema } from '@/lib/validation';

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

  const groupe = await prisma.groupe.findMany({
    include: { filiere: true },
  });
  return NextResponse.json(groupe);
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createGroupeSchema.parse(body);

    const groupe = await prisma.groupe.create({
      data: {
        name: validated.name,
        code: `GRP-${Date.now()}`,
        filiereId: validated.filiereId,
      },
      include: { filiere: true },
    });

    return NextResponse.json(groupe, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Groupe already exists in this filiere' },
        { status: 400 }
      );
    }
    if (error.errors) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
