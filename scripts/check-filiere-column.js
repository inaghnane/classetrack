const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFiliereColumn() {
  try {
    const result = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'seance' 
        AND COLUMN_NAME = 'filiereId'
    `;
    
    if (result.length > 0) {
      console.log('✅ Column filiereId exists in seance table');
    } else {
      console.log('❌ Column filiereId does NOT exist in seance table');
      console.log('Creating column...');
      
      await prisma.$executeRaw`
        ALTER TABLE seance 
        ADD COLUMN filiereId VARCHAR(25) NULL,
        ADD CONSTRAINT fk_seance_filiere 
          FOREIGN KEY (filiereId) REFERENCES filiere(id) ON DELETE CASCADE
      `;
      
      console.log('✅ Column filiereId created successfully');
      
      // Remplir les valeurs existantes via le module
      await prisma.$executeRaw`
        UPDATE seance s
        INNER JOIN module m ON s.moduleId = m.id
        SET s.filiereId = m.filiereId
      `;
      
      console.log('✅ Existing seances updated with filiereId');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFiliereColumn();
