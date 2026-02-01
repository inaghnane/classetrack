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

function splitList(value: string) {
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(bytes), { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    const allModules = await prisma.module.findMany({
      include: { filiere: true },
    });
    const allFilieres = await prisma.filiere.findMany();
    const allGroupes = await prisma.groupe.findMany();

    const moduleByCode = new Map(allModules.map((m) => [m.code.toLowerCase(), m]));
    const moduleByName = new Map(allModules.map((m) => [m.name.toLowerCase(), m]));
    const filiereByCode = new Map(allFilieres.map((f) => [f.code.toLowerCase(), f]));
    const filiereByName = new Map(allFilieres.map((f) => [f.name.toLowerCase(), f]));
    const groupeByCode = new Map(allGroupes.map((g) => [g.code.toLowerCase(), g]));
    const groupeByName = new Map(allGroupes.map((g) => [g.name.toLowerCase(), g]));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows) {
      const email = (getCell(row, 'email') || '').toString().trim();
      const firstName = (getCell(row, 'firstname') || getCell(row, 'prenom') || '').toString().trim();
      const lastName = (getCell(row, 'lastname') || getCell(row, 'nom') || '').toString().trim();
      const modulesCell = (getCell(row, 'modules') || getCell(row, 'module') || '').toString().trim();
      const filiereCell = (getCell(row, 'filiere') || '').toString().trim();
      const groupesCell = (getCell(row, 'groupes') || getCell(row, 'groupe') || '').toString().trim();

      if (!email || !firstName || !lastName) {
        skipped += 1;
        continue;
      }

      const existingUsers = await prisma.user.findMany({ where: { email } });

      if (existingUsers.length > 1) {
        skipped += 1;
        continue;
      }

      let user = existingUsers[0];

      if (!user) {
        const passwordHash = await bcryptjs.hash('Prof@12345', 10);
        user = await prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            role: 'PROF',
            passwordHash,
            mustChangePassword: true,
          },
        });
        created += 1;
      } else {
        // Mettre à jour si nécessaire
        const updateData: any = {};
        
        if (user.role !== 'PROF') {
          skipped += 1;
          continue;
        }

        if (firstName && firstName !== user.firstName) {
          updateData.firstName = firstName;
        }
        if (lastName && lastName !== user.lastName) {
          updateData.lastName = lastName;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
          updated += 1;
        }
      }

      const moduleIds = new Set<string>();
      const groupeIds = new Set<string>();

      if (modulesCell) {
        splitList(modulesCell).forEach((token) => {
          const key = token.toLowerCase();
          const module = moduleByCode.get(key) || moduleByName.get(key);
          if (module) {
            moduleIds.add(module.id);
          }
        });
      }

      if (filiereCell) {
        const key = filiereCell.toLowerCase();
        const filiere = filiereByCode.get(key) || filiereByName.get(key);
        if (filiere) {
          allModules
            .filter((m) => m.filiereId === filiere.id)
            .forEach((m) => moduleIds.add(m.id));

          if (!groupesCell) {
            allGroupes
              .filter((g) => g.filiereId === filiere.id)
              .forEach((g) => groupeIds.add(g.id));
          }
        }
      }

      if (groupesCell) {
        splitList(groupesCell).forEach((token) => {
          const key = token.toLowerCase();
          const groupe = groupeByCode.get(key) || groupeByName.get(key);
          if (groupe) {
            groupeIds.add(groupe.id);
          }
        });
      }

      if (!groupesCell && moduleIds.size > 0) {
        const filiereIds = new Set(
          allModules
            .filter((m) => moduleIds.has(m.id))
            .map((m) => m.filiereId)
        );
        allGroupes
          .filter((g) => filiereIds.has(g.filiereId))
          .forEach((g) => groupeIds.add(g.id));
      }

      const assignments = Array.from(moduleIds).flatMap((moduleId) => {
        const module = allModules.find((m) => m.id === moduleId);
        if (!module) return [];
        return Array.from(groupeIds)
          .filter((groupeId) => {
            const groupe = allGroupes.find((g) => g.id === groupeId);
            return groupe && groupe.filiereId === module.filiereId;
          })
          .map((groupeId) => ({ moduleId, groupeId }));
      });

      if (assignments.length > 0) {
        await prisma.$transaction(async (tx) => {
          await tx.professorAssignment.deleteMany({
            where: { profId: user!.id },
          });

          await tx.professorAssignment.createMany({
            data: assignments.map((a) => ({
              profId: user!.id,
              moduleId: a.moduleId,
              groupeId: a.groupeId,
            })),
            skipDuplicates: true,
          });

          const uniqueModuleIds = Array.from(new Set(assignments.map((a) => a.moduleId)));

          await tx.professorTeaching.deleteMany({
            where: {
              profId: user!.id,
              moduleId: { notIn: uniqueModuleIds },
            },
          });

          const existingTeachings = await tx.professorTeaching.findMany({
            where: {
              profId: user!.id,
              moduleId: { in: uniqueModuleIds },
            },
            select: { moduleId: true },
          });

          const existingIds = new Set(existingTeachings.map((t) => t.moduleId));
          const toCreate = uniqueModuleIds.filter((id) => !existingIds.has(id));

          if (toCreate.length > 0) {
            await tx.professorTeaching.createMany({
              data: toCreate.map((moduleId) => ({
                profId: user!.id,
                moduleId,
              })),
              skipDuplicates: true,
            });
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
    });
  } catch (error) {
    console.error('Error importing professors:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'import' },
      { status: 500 }
    );
  }
}
