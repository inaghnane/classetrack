import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'PROF') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seanceId = params.id;

    // Récupérer la séance
    const seance = await prisma.seance.findUnique({
      where: { id: seanceId },
      include: {
        module: true,
        groupe: true,
      },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Seance not found' }, { status: 404 });
    }

    // Récupérer tous les étudiants du groupe
    const enrollments = await prisma.enrollment.findMany({
      where: { groupeId: seance.groupeId },
      include: {
        student: true,
      },
    });

    // Récupérer les attendances pour cette séance
    const attendances = await prisma.attendance.findMany({
      where: { seanceId },
    });

    // Créer des sets pour les présents
    const presentStudentIds = new Set(
      attendances.map((a) => a.studentId)
    );

    const present = enrollments
      .filter((e) => presentStudentIds.has(e.studentId))
      .map((e) => e.student);

    const absent = enrollments
      .filter((e) => !presentStudentIds.has(e.studentId))
      .map((e) => e.student);

    // Générer le CSV
    let csv = 'Séance,Module,Groupe,Date,Horaire\n';
    csv += `"${seance.id}","${seance.module.name}","${seance.groupe.name}","${new Date(seance.date).toLocaleDateString('fr-FR')}","${seance.startTime} - ${seance.endTime}"\n\n`;

    csv += 'PRÉSENTS\n';
    csv += 'Prénom,Nom,Email,Statut\n';
    present.forEach((student) => {
      csv += `"${student.firstName}","${student.lastName}","${student.email}","Présent"\n`;
    });

    csv += '\nABSENTS\n';
    csv += 'Prénom,Nom,Email,Statut\n';
    absent.forEach((student) => {
      csv += `"${student.firstName}","${student.lastName}","${student.email}","Absent"\n`;
    });

    csv += `\nRÉSUMÉ\n`;
    csv += `Total Présents,${present.length}\n`;
    csv += `Total Absents,${absent.length}\n`;
    csv += `Total Étudiants,${enrollments.length}\n`;
    csv += `Taux de présence,${((present.length / enrollments.length) * 100).toFixed(2)}%\n`;

    // Retourner le CSV comme fichier téléchargeable
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendances-${seance.module.name}-${new Date(seance.date).toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export attendance error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
