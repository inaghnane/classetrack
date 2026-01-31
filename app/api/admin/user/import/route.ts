import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import * as bcryptjs from 'bcryptjs';
import * as XLSX from 'xlsx';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }
  return session;
}

function normalizeHeader(header: string) {
  return header.toLowerCase().trim();
}

function getCell(row: any, key: string) {
  const keys = Object.keys(row);
  const match = keys.find(k => normalizeHeader(k) === key);
  return match ? row[match] : undefined;
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const groupeId = formData.get('groupeId') as string | null;

    if (!file || !groupeId) {
      return NextResponse.json({ error: 'Fichier et groupe requis' }, { status: 400 });
    }

    const groupe = await prisma.groupe.findUnique({ where: { id: groupeId } });
    if (!groupe) {
      return NextResponse.json({ error: 'Groupe introuvable' }, { status: 404 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(bytes), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    let created = 0;
    let enrolled = 0;
    let skipped = 0;

    for (const row of rows) {
      const email = (getCell(row, 'email') || '').toString().trim();
      const firstName = (getCell(row, 'firstname') || getCell(row, 'prenom') || '').toString().trim();
      const lastName = (getCell(row, 'lastname') || getCell(row, 'nom') || '').toString().trim();

      if (!email || !firstName || !lastName) {
        skipped += 1;
        continue;
      }

      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        const passwordHash = await bcryptjs.hash('ChangeMe123!', 10);
        user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            role: 'STUDENT',
            passwordHash,
          },
        });
        created += 1;
      } else if (user.role !== 'STUDENT') {
        skipped += 1;
        continue;
      }

      const existingEnrollment = await prisma.enrollment.findUnique({
        where: { studentId_groupeId: { studentId: user.id, groupeId } },
      });

      if (!existingEnrollment) {
        await prisma.enrollment.create({
          data: { studentId: user.id, groupeId },
        });
        enrolled += 1;
      }
    }

    return NextResponse.json({ created, enrolled, skipped });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
