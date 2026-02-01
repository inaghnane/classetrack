import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { createModuleSchema } from '@/lib/validation';

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

  const module = await prisma.module.findMany({
    include: { filiere: true },
  });
  return NextResponse.json(module);
}

export async function POST(request: NextRequest) {
const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = createModuleSchema.parse(body);

    const module = await prisma.module.create({
      data: {
        name: validated.name,
        code: `MOD-${Date.now()}`,
        filiereId: validated.filiereId,
      },
      include: { filiere: true },
    });

    return NextResponse.json(module, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Module already exists in this filiere' },
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
