/**
 * Migration script — creates the series_notes table
 * Run: node server/create_series_notes_table.js
 */
require('dotenv').config({ path: './server/.env' });
const mysql2 = require('./server/node_modules/mysql2/promise');

async function run() {
  const conn = await mysql2.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mocktest_lms',
  });

  console.log('✅ Connected to MySQL');

  await conn.execute(`
    CREATE TABLE IF NOT EXISTS \`series_notes\` (
      \`id\`           VARCHAR(36)  NOT NULL,
      \`seriesId\`     VARCHAR(36)  NOT NULL,
      \`title\`        VARCHAR(300) NOT NULL,
      \`subject\`      VARCHAR(200) NOT NULL,
      \`description\`  TEXT         NULL,
      \`content\`      LONGTEXT     NULL,
      \`fileUrl\`      VARCHAR(500) NULL,
      \`fileType\`     ENUM('pdf','doc','image','link','none') NOT NULL DEFAULT 'none',
      \`externalLink\` VARCHAR(500) NULL,
      \`isFree\`       TINYINT(1)   NOT NULL DEFAULT 1,
      \`isActive\`     TINYINT(1)   NOT NULL DEFAULT 1,
      \`sortOrder\`    INT          NOT NULL DEFAULT 0,
      \`createdBy\`    VARCHAR(36)  NULL,
      \`createdAt\`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`),
      INDEX \`idx_series_notes_seriesId\` (\`seriesId\`),
      INDEX \`idx_series_notes_subject\`  (\`subject\`),
      INDEX \`idx_series_notes_isActive\` (\`isActive\`),
      INDEX \`idx_series_notes_series_subject\` (\`seriesId\`, \`subject\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ series_notes table created (or already exists)');
  await conn.end();
  console.log('Done!');
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
