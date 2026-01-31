import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1️⃣ Create user
  console.log("📝 Creating user...");
  const user = [
    { email: "admin@gmail.com", password: "Admin@12345", firstName: "Admin", lastName: "System", role: "ADMIN" as const },
    { email: "prof@classetrack.com", password: "Prof@12345", firstName: "Jean", lastName: "Dupont", role: "PROF" as const },
    { email: "student@classetrack.com", password: "Student@12345", firstName: "Marie", lastName: "Martin", role: "STUDENT" as const },
  ];

  const createduser = [];
  for (const u of user) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, firstName: u.firstName, lastName: u.lastName, role: u.role },
      create: { email: u.email, passwordHash, firstName: u.firstName, lastName: u.lastName, name: `${u.firstName} ${u.lastName}`, role: u.role },
    });
    createduser.push(user);
    console.log(`  ✅ ${u.role}: ${u.email}`);
  }

  // 2️⃣ Create filiere
  console.log("\n📚 Creating filiere...");
  const filiere = [
    { name: "Informatique", code: "INFO" },
    { name: "Gestion", code: "GEST" },
  ];

  const createdfiliere = [];
  for (const f of filiere) {
    const filiere = await prisma.filiere.upsert({
      where: { code: f.code },
      update: { name: f.name },
      create: { name: f.name, code: f.code },
    });
    createdfiliere.push(filiere);
    console.log(`  ✅ ${f.name}`);
  }

  // 3️⃣ Create groupe
  console.log("\n👥 Creating groupe...");
  const groupe = [
    { name: "INFO-L2-A", code: "IL2A", filiereId: createdfiliere[0].id },
    { name: "INFO-L2-B", code: "IL2B", filiereId: createdfiliere[0].id },
    { name: "GEST-L2-A", code: "GL2A", filiereId: createdfiliere[1].id },
  ];

  const createdgroupe = [];
  for (const g of groupe) {
    const groupe = await prisma.groupe.upsert({
      where: { code: g.code },
      update: { name: g.name, filiereId: g.filiereId },
      create: { name: g.name, code: g.code, filiereId: g.filiereId },
    });
    createdgroupe.push(groupe);
    console.log(`  ✅ ${g.name}`);
  }

  // 4️⃣ Create module
  console.log("\n📖 Creating module...");
  const module = [
    { name: "Web Development", code: "WEB101", filiereId: createdfiliere[0].id },
    { name: "Database Design", code: "DB101", filiereId: createdfiliere[0].id },
    { name: "Accounting Basics", code: "ACC101", filiereId: createdfiliere[1].id },
  ];

  const createdmodule = [];
  for (const m of module) {
    const module = await prisma.module.upsert({
      where: { code: m.code },
      update: { name: m.name, filiereId: m.filiereId },
      create: { name: m.name, code: m.code, filiereId: m.filiereId },
    });
    createdmodule.push(module);
    console.log(`  ✅ ${m.name}`);
  }

  // 5️⃣ Create Professor Teachings
  console.log("\n👨‍🏫 Creating professor teachings...");
  const prof = createduser.find(u => u.role === "PROF");
  if (prof) {
    for (const module of createdmodule) {
      await prisma.professorTeaching.upsert({
        where: { profId_moduleId: { profId: prof.id, moduleId: module.id } },
        update: {},
        create: { profId: prof.id, moduleId: module.id },
      });
      console.log(`  ✅ Prof teaches ${module.name}`);
    }
  }

  // 6️⃣ Create seance
  console.log("\n📅 Creating seance...");
  const now = new Date();
  const seanceData = [
    { date: new Date(now.getTime() + 86400000), startTime: "09:00", endTime: "11:00", moduleId: createdmodule[0].id, groupeId: createdgroupe[0].id },
    { date: new Date(now.getTime() + 172800000), startTime: "14:00", endTime: "16:00", moduleId: createdmodule[1].id, groupeId: createdgroupe[1].id },
    { date: new Date(now.getTime() + 259200000), startTime: "10:00", endTime: "12:00", moduleId: createdmodule[2].id, groupeId: createdgroupe[2].id },
  ];

  const createdseance = [];
  for (let i = 0; i < seanceData.length; i++) {
    const s = seanceData[i];
    const seance = await prisma.seance.create({
      data: { date: s.date, startTime: s.startTime, endTime: s.endTime, moduleId: s.moduleId, groupeId: s.groupeId },
    });
    createdseance.push(seance);
    console.log(`  ✅ Seance ${i + 1}: ${s.startTime}-${s.endTime}`);
  }

  // 7️⃣ Create enrollment
  console.log("\n📋 Creating enrollment...");
  const student = createduser.find(u => u.role === "STUDENT");
  if (student) {
    for (const groupe of createdgroupe) {
      await prisma.enrollment.upsert({
        where: { studentId_groupeId: { studentId: student.id, groupeId: groupe.id } },
        update: {},
        create: { studentId: student.id, groupeId: groupe.id },
      });
      console.log(`  ✅ Student enrolled in ${groupe.name}`);
    }
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📋 Test Credentials:");
  console.log("   Admin:   admin@gmail.com / Admin@12345");
  console.log("   Prof:    prof@classetrack.com / Prof@12345");
  console.log("   Student: student@classetrack.com / Student@12345");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
