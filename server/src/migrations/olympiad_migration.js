/**
 * Olympiad Module — Database Migration Script
 * Run: node server/src/migrations/olympiad_migration.js
 *
 * Uses Sequelize sync({ alter: true }) to create/update all olympiad tables.
 * Safe to re-run — will only add new columns/tables, not drop existing ones.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');

// Import all olympiad models to register them
require('../models/OlympiadSubject.model');
require('../models/OlympiadClass.model');
require('../models/OlympiadChapter.model');
require('../models/OlympiadTopic.model');
require('../models/OlympiadQuestion.model');
require('../models/Olympiad.model');
require('../models/OlympiadRegistration.model');
require('../models/OlympiadExamSession.model');
require('../models/OlympiadResult.model');
require('../models/OlympiadCertificate.model');
require('../models/OlympiadStudyMaterial.model');

const olympiadTableNames = [
  'olympiad_subjects',
  'olympiad_classes',
  'olympiad_chapters',
  'olympiad_topics',
  'olympiad_questions',
  'olympiads',
  'olympiad_registrations',
  'olympiad_exam_sessions',
  'olympiad_results',
  'olympiad_certificates',
  'olympiad_study_materials',
];


async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Sync only the olympiad models
    await sequelize.sync({ alter: true });
    console.log('✅ All Olympiad tables created/updated');

    // Seed default subjects if not present
    const [OlympiadSubject] = await sequelize.query(
      "SELECT COUNT(*) as count FROM olympiad_subjects"
    );
    if (parseInt(OlympiadSubject[0].count) === 0) {
      await sequelize.query(`
        INSERT INTO olympiad_subjects (id, name, slug, description, color, isActive, createdAt, updatedAt) VALUES
        (UUID(), 'Mathematics', 'mathematics', 'Mathematical Olympiad for Class 6-12', '#6366f1', 1, NOW(), NOW()),
        (UUID(), 'Science',     'science',     'Science Olympiad for Class 6-12',      '#10b981', 1, NOW(), NOW()),
        (UUID(), 'Computer',    'computer',    'Computer Science Olympiad for Class 6-12', '#f59e0b', 1, NOW(), NOW())
      `);
      console.log('✅ Default subjects seeded (Mathematics, Science, Computer)');
    }

    // Seed default classes 6-12 if not present
    const [classCount] = await sequelize.query(
      "SELECT COUNT(*) as count FROM olympiad_classes"
    );
    if (parseInt(classCount[0].count) === 0) {
      for (let c = 6; c <= 12; c++) {
        await sequelize.query(`
          INSERT INTO olympiad_classes (id, classNumber, label, isActive, createdAt, updatedAt)
          VALUES (UUID(), ${c}, 'Class ${c}', 1, NOW(), NOW())
        `);
      }
      console.log('✅ Classes 6–12 seeded');
    }

    console.log('\n🎉 Olympiad migration complete!');
    console.log('Tables created:', olympiadTableNames.join(', '));
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
