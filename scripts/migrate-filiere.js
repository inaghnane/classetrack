const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Kz8&3mPq@wR',
    database: 'classetrack',
    multipleStatements: true,
  });

  try {
    console.log('Exécution de la migration...');
    
    const sql = fs.readFileSync('./sql/08-add-filiere-to-seance.sql', 'utf8');
    await connection.query(sql);
    
    console.log('✅ Migration réussie!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
}

migrate();
