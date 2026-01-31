const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInnoDB() {
  try {
    console.log('🔍 Checking table engines...\n');

    const tables = await prisma.$queryRaw`
      SELECT TABLE_NAME, ENGINE 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
    `;

    let allInnoDB = true;
    const nonInnoDB = [];

    for (const table of tables) {
      const status = table.ENGINE === 'InnoDB' ? '✅' : '❌';
      console.log(`${status} ${table.TABLE_NAME}: ${table.ENGINE}`);
      
      if (table.ENGINE !== 'InnoDB') {
        allInnoDB = false;
        nonInnoDB.push(table.TABLE_NAME);
      }
    }

    console.log('');

    if (!allInnoDB) {
      console.log('⚠️  Found non-InnoDB tables. To convert:');
      for (const tableName of nonInnoDB) {
        console.log(`   ALTER TABLE \`${tableName}\` ENGINE=InnoDB;`);
      }
    } else {
      console.log('✅ All tables are using InnoDB');
    }

    process.exit(allInnoDB ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkInnoDB();
