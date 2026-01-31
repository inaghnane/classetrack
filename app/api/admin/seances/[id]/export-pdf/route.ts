import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import PDFDocument from 'pdfkit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const seanceId = params.id;

    // Récupérer la séance avec toutes les informations
    const seance = await prisma.seance.findUnique({
      where: { id: seanceId },
      include: {
        module: {
          include: {
            filiere: true,
            professorTeachings: {
              include: {
                professor: true,
              },
            },
          },
        },
        groupe: true,
        attendances: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!seance) {
      return NextResponse.json({ error: 'Séance non trouvée' }, { status: 404 });
    }

    // Créer le PDF
    const doc = new PDFDocument({ 
      margin: 50,
      bufferPages: true,
      autoFirstPage: true
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    // En-tête
    doc.fontSize(20).text('Rapport de Presence', { align: 'center' });
    doc.moveDown();

    // Informations de la séance
    doc.fontSize(12);
    doc.text(`Filiere: ${seance.module.filiere.name}`, { continued: false });
    doc.text(`Module: ${seance.module.name} (${seance.module.code})`, { continued: false });
    doc.text(`Groupe: ${seance.groupe.name}`, { continued: false });
    doc.text(`Date: ${new Date(seance.date).toLocaleDateString('fr-FR')}`, { continued: false });
    doc.text(`Horaire: ${seance.startTime} - ${seance.endTime}`, { continued: false });
    doc.text(`Statut: ${seance.status}`, { continued: false });
    
    if (seance.module.professorTeachings.length > 0) {
      const prof = seance.module.professorTeachings[0].professor;
      doc.text(`Professeur: ${prof.firstName} ${prof.lastName}`, { continued: false });
    }
    
    doc.moveDown();

    // Statistiques
    const present = seance.attendances.filter((a) => a.status === 'PRESENT');
    const absent = seance.attendances.filter((a) => a.status === 'ABSENT');
    const total = seance.attendances.length;
    const presenceRate = total > 0 ? ((present.length / total) * 100).toFixed(1) : 0;

    doc.fontSize(14).text('Statistiques', { underline: true });
    doc.fontSize(12);
    doc.text(`Présents: ${present.length}`, { continued: false });
    doc.text(`Absents: ${absent.length}`, { continued: false });
    doc.text(`Total: ${total}`, { continued: false });
    doc.text(`Taux de presence: ${presenceRate}%`, { continued: false });
    doc.moveDown();

    // Liste des présents
    if (present.length > 0) {
      doc.fontSize(14).text('Liste des Présents', { underline: true });
      doc.fontSize(10);
      present.forEach((att, index) => {
        doc.text(
          `${index + 1}. ${att.student.firstName} ${att.student.lastName} (${att.student.email})`
        );
      });
      doc.moveDown();
    }

    // Liste des absents
    if (absent.length > 0) {
      doc.fontSize(14).text('Liste des Absents', { underline: true });
      doc.fontSize(10);
      absent.forEach((att, index) => {
        doc.text(
          `${index + 1}. ${att.student.firstName} ${att.student.lastName} (${att.student.email})`
        );
      });
    }

    // Pied de page
    doc.moveDown();
    doc.fontSize(8).text(`Genere le ${new Date().toLocaleString('fr-FR')}`, {
      align: 'center',
    });

    doc.end();

    // Attendre que le PDF soit généré
    await new Promise<void>((resolve) => {
      doc.on('end', () => resolve());
    });

    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport-${seance.module.code}-${seance.groupe.name}-${new Date(seance.date).toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
