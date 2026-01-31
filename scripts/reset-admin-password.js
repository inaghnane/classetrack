const { PrismaClient, Prisma } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    const email = 'admin@gmail.com';
    const newPassword = 'Admin@12345';
    
    console.log('🔐 Resetting admin password...');
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log('');

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$executeRaw(
      Prisma.sql`UPDATE user SET passwordHash = ${hashedPassword} WHERE email = ${email}`
    );

    const result = await prisma.$queryRaw(
      Prisma.sql`SELECT id, firstName, lastName, email, role FROM user WHERE email = ${email} LIMIT 1`
    );

    const user = result[0];
    
    if (!user) {
      console.log('❌ User not found:', email);
      process.exit(1);
    }

    console.log('✅ Admin password reset successfully');
    console.log(`   User: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password: ${newPassword}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();
