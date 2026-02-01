import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

async function requireAdmin() {
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
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const assignments = Array.isArray(body.assignments) ? body.assignments : [];

    // Vérifier que l'utilisateur est bien un professeur
    const prof = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true },
    });

    if (!prof || prof.role !== 'PROF') {
      return NextResponse.json({ error: 'Professeur introuvable' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      const normalized = assignments
        .filter((a: any) => a && a.moduleId && a.groupeId)
        .map((a: any) => ({ moduleId: a.moduleId, groupeId: a.groupeId }));

      await tx.professorAssignment.deleteMany({
        where: {
          profId: params.id,
        },
      });

      if (normalized.length > 0) {
        await tx.professorAssignment.createMany({
          data: normalized.map((a: any) => ({
            profId: params.id,
            moduleId: a.moduleId,
            groupeId: a.groupeId,
          })),
          skipDuplicates: true,
        });
      }

      const moduleIds = Array.from(new Set(normalized.map((a: any) => a.moduleId))) as string[];

      await tx.professorTeaching.deleteMany({
        where: {
          profId: params.id,
          moduleId: { notIn: moduleIds },
        },
      });

      const existingTeachings = await tx.professorTeaching.findMany({
        where: {
          profId: params.id,
          moduleId: { in: moduleIds },
        },
        select: { moduleId: true },
      });

      const existingTeachingIds = new Set(existingTeachings.map((e) => e.moduleId));
      const toCreateTeachings = moduleIds.filter((id: string) => !existingTeachingIds.has(id));

      if (toCreateTeachings.length > 0) {
        await tx.professorTeaching.createMany({
          data: toCreateTeachings.map((moduleId: string) => ({
            profId: params.id,
            moduleId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error assigning modules to professor:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
