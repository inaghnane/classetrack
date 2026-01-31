const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const dbUrl = process.env.DATABASE_URL || '';
    const urlMatch = dbUrl.match(/mysql:\/\/([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!urlMatch) {
      console.log('❌ Invalid DATABASE_URL format');
      console.log('Expected: mysql://user@host:port/database');
      console.log('Got:', dbUrl);
      process.exit(1);
    }

    const [, user, host, port, database] = urlMatch;
    
    console.log('📊 Database Configuration:');
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   Database: ${database}`);
    console.log(`   User: ${user}`);
    console.log('');

    const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM user`;
    const count = result[0]?.count || 0;

    console.log('✅ Connected to MySQL WAMP');
    console.log(`✅ user in database: ${count}`);
    
    if (count === 0) {
      console.log('');
      console.log('⚠️  No user found. Run: npx prisma db seed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
