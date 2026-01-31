import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { validateDeviceAccess } from '@/lib/device';

/**
 * POST /api/student/validate-device
 * Valider que l'appareil actuel est autorisé pour ce compte
 * Utilisé après le login pour vérifier la restriction d'appareil
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId, deviceId } = body;

    if (!studentId || !deviceId) {
      return NextResponse.json(
        { error: 'Missing studentId or deviceId' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Vérifier l'accès à l'appareil
    const validation = validateDeviceAccess(user.deviceId, deviceId);

    if (!validation.allowed) {
      return NextResponse.json(
        { 
          error: validation.message,
          previousDevice: user.deviceId,
          currentDevice: deviceId,
        },
        { status: 403 }
      );
    }

    // Si l'utilisateur n'avait pas d'appareil lié, le lier maintenant
    if (!user.deviceId) {
      await prisma.user.update({
        where: { id: studentId },
        data: { deviceId },
      });
    }

    return NextResponse.json(
      {
        allowed: true,
        message: validation.message,
        deviceId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[DEVICE-VALIDATE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
