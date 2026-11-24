/**
 * Migration: Add institute landing page columns
 * Run with: node server/migrations/add_institute_landing_columns.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../server/.env') });
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'mocktest_lms',
  });

  console.log('🔗 Connected to MySQL:', process.env.DB_NAME || 'mocktest_lms');

  const columns = [
    { name: 'slug',            type: 'VARCHAR(150)',  after: 'ownerId',      extra: '' },
    { name: 'tagline',         type: 'VARCHAR(300)',  after: 'slug',         extra: '' },
    { name: 'bannerImage',     type: 'VARCHAR(500)',  after: 'tagline',      extra: '' },
    { name: 'isLandingEnabled',type: 'TINYINT(1)',    after: 'bannerImage',  extra: 'DEFAULT 0' },
    { name: 'isFeatured',      type: 'TINYINT(1)',    after: 'isLandingEnabled', extra: 'DEFAULT 0' },
    { name: 'landingBio',      type: 'TEXT',          after: 'isFeatured',   extra: '' },
    { name: 'achievements',    type: 'JSON',          after: 'landingBio',   extra: '' },
    { name: 'socialLinks',     type: 'JSON',          after: 'achievements', extra: '' },
    { name: 'courses',         type: 'JSON',          after: 'socialLinks',  extra: '' },
    { name: 'faculty',         type: 'JSON',          after: 'courses',      extra: '' },
    { name: 'testimonials',    type: 'JSON',          after: 'faculty',      extra: '' },
    { name: 'foundedYear',     type: 'INT',           after: 'testimonials', extra: '' },
    { name: 'phone',           type: 'VARCHAR(20)',   after: 'foundedYear',  extra: '' },
    { name: 'contactAddress',  type: 'TEXT',          after: 'phone',        extra: '' },
  ];

  for (const col of columns) {
    try {
      // Check if column already exists
      const [rows] = await connection.execute(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'institutes' AND COLUMN_NAME = ?
      `, [process.env.DB_NAME || 'mocktest_lms', col.name]);

      if (rows.length > 0) {
        console.log(`  ⏭  Column '${col.name}' already exists, skipping.`);
        continue;
      }

      const sql = `ALTER TABLE institutes ADD COLUMN \`${col.name}\` ${col.type} ${col.extra} AFTER \`${col.after}\``;
      await connection.execute(sql);
      console.log(`  ✅ Added column: ${col.name}`);
    } catch (err) {
      console.error(`  ❌ Failed to add column '${col.name}':`, err.message);
    }
  }

  // Add unique index for slug
  try {
    const [rows] = await connection.execute(`
      SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'institutes' AND INDEX_NAME = 'institutes_slug'
    `, [process.env.DB_NAME || 'mocktest_lms']);
    if (rows.length === 0) {
      await connection.execute(`CREATE UNIQUE INDEX institutes_slug ON institutes (slug)`);
      console.log('  ✅ Added unique index on slug');
    } else {
      console.log('  ⏭  Index on slug already exists');
    }
  } catch (err) {
    console.error('  ⚠️  Index creation:', err.message);
  }

  await connection.end();
  console.log('\n🎉 Migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
