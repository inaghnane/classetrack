import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateQRToken } from '@/lib/qr-generator';
import { validateDeviceAccess } from '@/lib/device';
import { scanSchema } from '@/lib/validation';

// Add CORS headers for Cloudflare compatibility
function addCorsHeaders(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}

async function requireStudent(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'STUDENT') {
    return null;
  }
  return session;
}

// Handle preflight CORS requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireStudent(request);
    if (!session) {
      const response = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      return addCorsHeaders(response);
    }

    const body = await request.json();
    const validated = scanSchema.parse(body);

    const studentId = (session.user as any).id;
    const { seanceId, token, deviceId } = validated;

    // Récupérer l'étudiant
    const student = await prisma.user.findUnique({
      where: { id: studentId },
    });

    // Vérifier la restriction d'appareil (prevent triche)
    if (deviceId && student?.deviceId) {
      const deviceValidation = validateDeviceAccess(student.deviceId, deviceId);
      if (!deviceValidation.allowed) {
        const response = NextResponse.json(
          { error: deviceValidation.message },
          { status: 403 }
        );
        return addCorsHeaders(response);
      }
    }

    // Get seance
    const seance = await prisma.seance.findUnique({
      where: { id: seanceId },
      include: { groupe: true },
    });

    if (!seance) {
      const response = NextResponse.json({ error: 'Seance not found' }, { status: 404 });
      return addCorsHeaders(response);
    }

    // Check if student is in the group
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_groupeId: { studentId, groupeId: seance.groupeId } },
    });

    if (!enrollment) {
      const response = NextResponse.json(
        { error: 'Student not in this group' },
        { status: 403 }
      );
      return addCorsHeaders(response);
    }

    // Check if already marked present
    const existing = await prisma.attendance.findUnique({
      where: { studentId_seanceId: { studentId, seanceId } },
    });

    if (existing) {
      const response = NextResponse.json(
        { error: 'Already marked for this seance' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Check seance is OPEN and validate QR token
    if (seance.status !== 'OPEN') {
      const response = NextResponse.json(
        { error: 'Seance is not open' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    if (!seance.qrSecret || !validateQRToken(token, seanceId, seance.qrSecret)) {
      const response = NextResponse.json(
        { error: 'Invalid or expired QR token' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }

    // Mark as present
    const attendance = await prisma.attendance.create({
      data: {
        seanceId,
        studentId,
        status: 'PRESENT',
      },
      include: {
        student: { select: { email: true, firstName: true, lastName: true } },
        seance: { select: { id: true } },
      },
    });

    const response = NextResponse.json(attendance, { status: 201 });
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('[SCAN] Error:', error);
    
    if (error.errors) {
      const response = NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}
