const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating professor assignments...');

  try {
    // Find all professors
    const professors = await prisma.user.findMany({
      where: { role: 'PROF' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        professorTeachings: { 
          include: { module: true }
        },
      },
    });

    console.log(`Found ${professors.length} professors\n`);

    let migrated = 0;

    for (const prof of professors) {
      const hasTeachings = prof.professorTeachings.length > 0;

      if (hasTeachings) {
        console.log(`📝 Processing ${prof.firstName} ${prof.lastName} (${prof.email})`);

        // For each module the professor teaches, create assignments for all groupes in that module's filière
        const assignments = [];

        for (const teaching of prof.professorTeachings) {
          const module = teaching.module;
          
          // Get all groupes for this module's filière
          const groupes = await prisma.groupe.findMany({
            where: { filiereId: module.filiereId },
          });

          console.log(`  - Module: ${module.name} (${groupes.length} groupes)`);

          for (const groupe of groupes) {
            assignments.push({
              profId: prof.id,
              moduleId: module.id,
              groupeId: groupe.id,
            });
          }
        }

        if (assignments.length > 0) {
          try {
            await prisma.professorAssignment.createMany({
              data: assignments,
              skipDuplicates: true,
            });
            console.log(`✅ Created ${assignments.length} assignments\n`);
            migrated += 1;
          } catch (e) {
            console.log(`⚠️  Could not create assignments: ${e.message}\n`);
          }
        }
      } else {
        console.log(`⚠️  ${prof.firstName} ${prof.lastName} has no modules assigned\n`);
      }
    }

    console.log(`✅ Migration complete! ${migrated} professors processed.`);
  } catch (e) {
    console.error('❌ Error during migration:', e.message);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Fatal error:', e);
  process.exit(1);
});
