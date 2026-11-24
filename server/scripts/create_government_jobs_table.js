/**
 * Migration script — creates the government_jobs table
 * Run: node scripts/create_government_jobs_table.js (inside server directory)
 */
require('dotenv').config();
const mysql2 = require('mysql2/promise');

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
    CREATE TABLE IF NOT EXISTS \`government_jobs\` (
      \`id\`                      VARCHAR(36)  NOT NULL,
      \`title\`                   VARCHAR(300) NOT NULL,
      \`shortName\`               VARCHAR(150) NULL,
      \`slug\`                    VARCHAR(300) NOT NULL,
      \`tagline\`                 VARCHAR(500) NULL,
      \`organization\`            VARCHAR(250) NOT NULL,
      \`category\`                VARCHAR(100) NOT NULL DEFAULT 'General',
      \`subcategory\`             VARCHAR(100) NULL,
      \`description\`             LONGTEXT     NULL,
      
      \`totalVacancies\`          INT          NULL DEFAULT 0,
      \`vacancyDetails\`          JSON         NULL,
      
      \`qualification\`           JSON         NULL,
      \`eligibilityDetails\`      TEXT         NULL,
      \`ageLimit\`                JSON         NULL,
      
      \`salary\`                  TEXT         NULL,
      \`salaryDetails\`           JSON         NULL,
      
      \`applicationMode\`         VARCHAR(50)  NOT NULL DEFAULT 'Online',
      \`applicationStartDate\`    DATE         NULL,
      \`applicationLastDate\`     DATE         NULL,
      \`applicationFee\`          JSON         NULL,
      \`howToApply\`              JSON         NULL,
      \`requiredDocuments\`       JSON         NULL,
      
      \`selectionProcess\`        JSON         NULL,
      \`examPattern\`             JSON         NULL,
      \`importantDates\`          JSON         NULL,
      
      \`officialNotificationUrl\` VARCHAR(500) NULL,
      \`officialWebsite\`         VARCHAR(500) NULL,
      \`applyLink\`               VARCHAR(500) NULL,
      \`source\`                  VARCHAR(100) NOT NULL DEFAULT 'FreeJobAlert',
      \`sourceUrl\`               VARCHAR(500) NULL,
      
      \`aiExtracted\`             TINYINT(1)   NOT NULL DEFAULT 1,
      \`extractedAt\`             DATETIME     NULL,
      \`verificationStatus\`      VARCHAR(50)  NOT NULL DEFAULT 'pending',
      \`reviewRequired\`          TINYINT(1)   NOT NULL DEFAULT 1,
      \`dataWarnings\`            JSON         NULL,
      \`validationStatus\`        VARCHAR(50)  NOT NULL DEFAULT 'passed',
      \`validationErrors\`        JSON         NULL,
      \`validationWarnings\`      JSON         NULL,
      
      \`status\`                  VARCHAR(50)  NOT NULL DEFAULT 'pending_review',
      \`isFeatured\`              TINYINT(1)   NOT NULL DEFAULT 0,
      \`publishedAt\`             DATETIME     NULL,
      \`publishedBy\`             VARCHAR(36)  NULL,
      \`reviewedBy\`              VARCHAR(36)  NULL,
      \`reviewedAt\`              DATETIME     NULL,
      \`rejectionReason\`         TEXT         NULL,
      \`adminNotes\`              TEXT         NULL,
      
      \`createdAt\`                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\`                DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`uniq_government_jobs_slug\` (\`slug\`),
      INDEX \`idx_government_jobs_status\` (\`status\`),
      INDEX \`idx_government_jobs_category\` (\`category\`),
      INDEX \`idx_government_jobs_applicationLastDate\` (\`applicationLastDate\`),
      INDEX \`idx_government_jobs_organization\` (\`organization\`),
      INDEX \`idx_government_jobs_sourceUrl\` (\`sourceUrl\`),
      INDEX \`idx_government_jobs_isFeatured\` (\`isFeatured\`),
      INDEX \`idx_government_jobs_reviewRequired\` (\`reviewRequired\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('✅ government_jobs table created successfully (or already exists)');
  await conn.end();
  console.log('Done!');
}

run().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
