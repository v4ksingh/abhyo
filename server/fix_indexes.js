const mysql = require('mysql2/promise');
require('dotenv').config();

async function fix() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mocktest_lms',
  });
  
  const [tables] = await conn.query("SHOW TABLES");
  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [indexes] = await conn.query(`SHOW INDEXES FROM ${tableName}`);
    console.log(`Table ${tableName} has ${indexes.length} index entries.`);
    // If a table has too many indexes, let's drop ones that look like random Sequelize duplicates
    if (indexes.length > 30) {
      console.log(`Dropping dupes from ${tableName}`);
      // Find indexes that start with the table name (classic sequelize alter dupes: `results_testId`, `results_test_id_1`, etc)
      const nonPrimary = indexes.filter(i => i.Key_name !== 'PRIMARY');
      for (const idx of nonPrimary) {
        if (idx.Key_name.match(/_\d+$/) || idx.Seq_in_index === 1) {
            try {
                await conn.query(`ALTER TABLE ${tableName} DROP INDEX \`${idx.Key_name}\``);
                console.log(`Dropped index ${idx.Key_name} from ${tableName}`);
            } catch (e) { }
        }
      }
    }
  }
  process.exit(0);
}
fix().catch(console.error);
