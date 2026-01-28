import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.attendance.deleteMany();
  await prisma.seance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.module.deleteMany();
  await prisma.groupe.deleteMany();
  await prisma.filiere.deleteMany();
  await prisma.user.deleteMany();

  // Hash passwords
  const adminPassword = await bcryptjs.hash('admin123', 10);
  const profPassword = await bcryptjs.hash('amine123', 10);
  const studentPassword = await bcryptjs.hash('student123', 10);

  // Create users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const prof = await prisma.user.create({
    data: {
      email: 'aminerghioui@gmail.com',
      passwordHash: profPassword,
      firstName: 'Amine',
      lastName: 'Rghioui',
      role: 'PROF',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student1@example.com',
      passwordHash: studentPassword,
      firstName: 'Alice',
      lastName: 'Dupont',
      role: 'STUDENT',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@example.com',
      passwordHash: studentPassword,
      firstName: 'Bob',
      lastName: 'Martin',
      role: 'STUDENT',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@example.com',
      passwordHash: studentPassword,
      firstName: 'Carol',
      lastName: 'Bernard',
      role: 'STUDENT',
    },
  });

  // Create filiere
  const filiere = await prisma.filiere.create({
    data: {
      name: 'Informatique',
    },
  });

  // Create groupes
  const groupe1 = await prisma.groupe.create({
    data: {
      name: 'Groupe A',
      filiereId: filiere.id,
    },
  });

  const groupe2 = await prisma.groupe.create({
    data: {
      name: 'Groupe B',
      filiereId: filiere.id,
    },
  });

  // Create modules
  const module1 = await prisma.module.create({
    data: {
      name: 'Programmation Web',
      filiereId: filiere.id,
    },
  });

  const module2 = await prisma.module.create({
    data: {
      name: 'Bases de Données',
      filiereId: filiere.id,
    },
  });

  // Enroll students
  await prisma.enrollment.create({
    data: {
      studentId: student1.id,
      groupeId: groupe1.id,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student2.id,
      groupeId: groupe1.id,
    },
  });

  await prisma.enrollment.create({
    data: {
      studentId: student3.id,
      groupeId: groupe2.id,
    },
  });

  // Create seances
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const seance1 = await prisma.seance.create({
    data: {
      moduleId: module1.id,
      professorId: prof.id,
      groupeId: groupe1.id,
      startsAt: tomorrow,
      endsAt: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000),
      room: 'A101',
      status: 'PLANNED',
    },
  });

  const seance2 = await prisma.seance.create({
    data: {
      moduleId: module2.id,
      professorId: prof.id,
      groupeId: groupe2.id,
      startsAt: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000),
      endsAt: new Date(tomorrow.getTime() + 5 * 60 * 60 * 1000),
      room: 'B205',
      status: 'PLANNED',
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log('Users created:', {
    admin: admin.email,
    prof: prof.email,
    students: [student1.email, student2.email, student3.email],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
