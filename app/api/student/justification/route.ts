import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const seanceId = formData.get('seanceId') as string;
    const reason = formData.get('reason') as string;
    const file = formData.get('file') as File | null;

    if (!seanceId || !reason) {
      return NextResponse.json({ error: 'Séance et raison requises' }, { status: 400 });
    }

    const studentId = (session.user as any).id;

    // Vérifier que la séance est clôturée
    const seance = await prisma.seance.findUnique({
      where: { id: seanceId },
      include: { groupe: true },
    });

    if (!seance || seance.status !== 'CLOSED') {
      return NextResponse.json(
        { error: 'La séance doit être clôturée pour soumettre un justificatif' },
        { status: 400 }
      );
    }

    // Vérifier que l'étudiant est bien inscrit dans le groupe de cette séance
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        groupeId: seance.groupeId,
      },
    });

    if (!enrollment) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas inscrit dans ce groupe' },
        { status: 403 }
      );
    }

    // Vérifier que l'étudiant est absent
    const attendance = await prisma.attendance.findUnique({
      where: {
        studentId_seanceId: {
          studentId,
          seanceId,
        },
      },
    });

    if (attendance && attendance.status === 'PRESENT') {
      return NextResponse.json(
        { error: 'Vous étiez présent à cette séance' },
        { status: 400 }
      );
    }

    let fileUrl = null;

    // Upload du fichier si fourni
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Créer le dossier uploads s'il n'existe pas
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'justificatifs');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Générer un nom de fichier unique
      const extension = file.name.split('.').pop();
      const filename = `${studentId}_${seanceId}_${Date.now()}.${extension}`;
      const filepath = join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      fileUrl = `/uploads/justificatifs/${filename}`;
    }

    // Créer ou mettre à jour le justificatif
    const justification = await prisma.justification.upsert({
      where: {
        studentId_seanceId: {
          studentId,
          seanceId,
        },
      },
      create: {
        studentId,
        seanceId,
        reason,
        fileUrl,
        status: 'PENDING',
      },
      update: {
        reason,
        fileUrl: fileUrl || undefined,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      message: 'Justificatif soumis avec succès',
      justification,
    });
  } catch (error) {
    console.error('Error submitting justification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET pour récupérer les justificatifs de l'étudiant
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentId = (session.user as any).id;

    const justifications = await prisma.justification.findMany({
      where: { studentId },
      include: {
        seance: {
          include: {
            module: true,
            groupe: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(justifications);
  } catch (error) {
    console.error('Error fetching justifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
