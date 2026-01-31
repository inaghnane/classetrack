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
    const userRole = (session.user as any)?.role;
    
    if (!session || (userRole !== 'PROF' && userRole !== 'ADMIN')) {
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

        // Créer des sets pour les présents (uniquement status PRESENT)
        const presentStudentIds = new Set(
            attendances.filter((a) => a.status === 'PRESENT').map((a) => a.studentId)
        );

    const present = enrollments
      .filter((e) => presentStudentIds.has(e.studentId))
      .map((e) => e.student);

    const absent = enrollments
      .filter((e) => !presentStudentIds.has(e.studentId))
      .map((e) => e.student);

    const tauxPresence = ((present.length / enrollments.length) * 100).toFixed(2);

    // Créer le HTML pour le PDF
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Présences</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            padding: 40px;
            background: white;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 28px;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .header p {
            font-size: 12px;
            color: #666;
        }
        
        .info-section {
            background: #f3f4f6;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 25px;
        }
        
        .info-section h2 {
            font-size: 14px;
            color: #1e40af;
            margin-bottom: 10px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 5px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 12px;
        }
        
        .info-item {
            display: flex;
            flex-direction: column;
        }
        
        .info-label {
            font-weight: bold;
            color: #1e40af;
        }
        
        .info-value {
            color: #333;
            margin-top: 2px;
        }
        
        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .stat-box {
            padding: 15px;
            border-radius: 5px;
            text-align: center;
        }
        
        .stat-box.present {
            background: #dcfce7;
            border: 2px solid #16a34a;
        }
        
        .stat-box.absent {
            background: #fee2e2;
            border: 2px solid #dc2626;
        }
        
        .stat-number {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .stat-box.present .stat-number {
            color: #16a34a;
        }
        
        .stat-box.absent .stat-number {
            color: #dc2626;
        }
        
        .stat-label {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .stat-box.present .stat-label {
            color: #15803d;
        }
        
        .stat-box.absent .stat-label {
            color: #b91c1c;
        }
        
        .list-section {
            margin-bottom: 25px;
        }
        
        .list-section h3 {
            font-size: 14px;
            padding: 10px 15px;
            border-radius: 5px;
            margin-bottom: 10px;
            color: white;
            font-weight: bold;
        }
        
        .list-section.present h3 {
            background: #16a34a;
        }
        
        .list-section.absent h3 {
            background: #dc2626;
        }
        
        .list-section ul {
            list-style: none;
            background: #f9fafb;
            padding: 0;
            border-radius: 5px;
            border: 1px solid #e5e7eb;
        }
        
        .list-section li {
            padding: 10px 15px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 12px;
        }
        
        .list-section li:last-child {
            border-bottom: none;
        }
        
        .list-section.present li::before {
            content: '✓ ';
            color: #16a34a;
            font-weight: bold;
        }
        
        .list-section.absent li::before {
            content: '✗ ';
            color: #dc2626;
            font-weight: bold;
        }
        
        .empty-message {
            padding: 20px;
            text-align: center;
            color: #666;
            font-style: italic;
            font-size: 12px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 10px;
            color: #999;
        }
        
        @media print {
            body {
                padding: 0;
            }
            .container {
                max-width: 100%;
            }
            .no-print {
                display: none;
            }
        }
        
        .print-button {
            display: inline-block;
            padding: 10px 20px;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 20px;
        }
        
        .print-button:hover {
            background: #1d4ed8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div style="text-align: center; margin-bottom: 20px;" class="no-print">
            <button class="print-button" onclick="window.print()">🖨️ Imprimer ou télécharger en PDF</button>
        </div>
        
        <div class="header">
            <h1>RAPPORT DE PRÉSENCES</h1>
            <p>ClasseTrack - Gestion des Absences</p>
        </div>
        
        <div class="info-section">
            <h2>Informations de la Séance</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Module:</span>
                    <span class="info-value">${seance.module.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Groupe:</span>
                    <span class="info-value">${seance.groupe.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Date:</span>
                    <span class="info-value">${new Date(seance.date).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Horaire:</span>
                    <span class="info-value">${seance.startTime} - ${seance.endTime}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Étudiants:</span>
                    <span class="info-value">${enrollments.length}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Taux de Présence:</span>
                    <span class="info-value" style="color: #16a34a; font-weight: bold;">${tauxPresence}%</span>
                </div>
            </div>
        </div>
        
        <div class="stats">
            <div class="stat-box present">
                <div class="stat-label">Présents</div>
                <div class="stat-number">${present.length}</div>
                <div>${((present.length / enrollments.length) * 100).toFixed(1)}%</div>
            </div>
            <div class="stat-box absent">
                <div class="stat-label">Absents</div>
                <div class="stat-number">${absent.length}</div>
                <div>${((absent.length / enrollments.length) * 100).toFixed(1)}%</div>
            </div>
        </div>
        
        <div class="list-section present">
            <h3>✓ PRÉSENTS (${present.length})</h3>
            ${present.length > 0 ? `
                <ul>
                    ${present.map(s => `<li>${s.firstName} ${s.lastName} (${s.email})</li>`).join('')}
                </ul>
            ` : `<div class="empty-message">Aucun étudiant présent</div>`}
        </div>
        
        <div class="list-section absent">
            <h3>✗ ABSENTS (${absent.length})</h3>
            ${absent.length > 0 ? `
                <ul>
                    ${absent.map(s => `<li>${s.firstName} ${s.lastName} (${s.email})</li>`).join('')}
                </ul>
            ` : `<div class="empty-message">Tous les étudiants étaient présents</div>`}
        </div>
        
        <div class="footer">
            Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            <br>
            ClasseTrack © 2026
        </div>
    </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
