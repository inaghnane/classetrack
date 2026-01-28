import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import * as bcryptjs from 'bcryptjs';

async function requireAdmin(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }
  return session;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { firstName, lastName, role, password } = body;

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (role) updateData.role = role;
    if (password) updateData.passwordHash = await bcryptjs.hash(password, 10);

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await requireAdmin(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
