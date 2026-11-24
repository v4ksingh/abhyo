/**
 * One-time migration: add selectionProcess, salaryDetails, howToApply, importantLinks
 * to the exam_series table.
 *
 * Run once:  node migrate-new-fields.js
 */
require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { QueryTypes } = require('sequelize');

(async () => {
  const qi = sequelize.getQueryInterface();

  const newCols = [
    { name: 'selectionProcess', comment: 'Array of {stage, description}' },
    { name: 'salaryDetails',    comment: 'Array of {label, value}' },
    { name: 'howToApply',       comment: 'Array of step strings' },
    { name: 'importantLinks',   comment: 'Array of {label, url}' },
  ];

  // Detect dialect
  const dialect = sequelize.getDialect(); // 'mysql' | 'postgres' | 'sqlite'

  for (const col of newCols) {
    try {
      // Check if column already exists
      let exists = false;
      if (dialect === 'mysql') {
        const rows = await sequelize.query(
          `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
           WHERE TABLE_NAME = 'exam_series' AND COLUMN_NAME = '${col.name}'`,
          { type: QueryTypes.SELECT }
        );
        exists = rows.length > 0;
      } else if (dialect === 'postgres') {
        const rows = await sequelize.query(
          `SELECT column_name FROM information_schema.columns
           WHERE table_name = 'exam_series' AND column_name = '${col.name}'`,
          { type: QueryTypes.SELECT }
        );
        exists = rows.length > 0;
      }

      if (exists) {
        console.log(`  ⏭  ${col.name} already exists — skipped`);
        continue;
      }

      // Add the column (JSON / LONGTEXT depending on dialect)
      if (dialect === 'mysql') {
        await sequelize.query(
          `ALTER TABLE exam_series ADD COLUMN \`${col.name}\` LONGTEXT NULL COMMENT '${col.comment}'`
        );
      } else if (dialect === 'postgres') {
        await sequelize.query(
          `ALTER TABLE exam_series ADD COLUMN "${col.name}" JSONB DEFAULT '[]'`
        );
      } else {
        // SQLite — no type enforcement needed, just add TEXT
        await sequelize.query(
          `ALTER TABLE exam_series ADD COLUMN "${col.name}" TEXT`
        );
      }

      console.log(`  ✅  Added column: ${col.name}`);
    } catch (err) {
      console.error(`  ❌  Error adding ${col.name}:`, err.message);
    }
  }

  await sequelize.close();
  console.log('\nDone.');
})();
