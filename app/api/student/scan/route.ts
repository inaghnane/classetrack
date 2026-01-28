import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateQRToken } from '@/lib/qr-generator';
import { scanSchema } from '@/lib/validation';

async function requireStudent(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'STUDENT') {
    return null;
  }
  return session;
}

export async function POST(request: NextRequest) {
  const session = await requireStudent(request);
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = scanSchema.parse(body);

    const studentId = (session.user as any).id;
    const { seanceId, token } = validated;

    // Get seance
    const seance = await prisma.seance.findUnique({
      where: { id: seanceId },
      include: { groupe: true },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Seance not found' }, { status: 404 });
    }

    // Check if student is in the group
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_groupeId: { studentId, groupeId: seance.groupeId } },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Student not in this group' },
        { status: 403 }
      );
    }

    // Check if already marked present
    const existing = await prisma.attendance.findUnique({
      where: { seanceId_studentId: { seanceId, studentId } },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Already marked for this seance' },
        { status: 400 }
      );
    }

    // Check seance is OPEN and validate QR token
    if (seance.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Seance is not open' },
        { status: 400 }
      );
    }

    if (!seance.qrSecret || !validateQRToken(token, seanceId, seance.qrSecret)) {
      return NextResponse.json(
        { error: 'Invalid or expired QR token' },
        { status: 400 }
      );
    }

    // Mark as present
    const attendance = await prisma.attendance.create({
      data: {
        seanceId,
        studentId,
        status: 'PRESENT',
        source: 'QR',
        markedAt: validated.scannedAt || new Date(),
      },
      include: {
        student: { select: { email: true, firstName: true, lastName: true } },
        seance: { select: { id: true } },
      },
    });

    return NextResponse.json(attendance, { status: 201 });
  } catch (error: any) {
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
