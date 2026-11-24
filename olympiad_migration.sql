-- ============================================================
-- OLYMPIAD MODULE - COMPLETE SQL MIGRATION FOR LIVE SERVER
-- Run these statements IN ORDER on your live MySQL/MariaDB DB
-- ============================================================


-- 1. olympiad_subjects
CREATE TABLE IF NOT EXISTS `olympiad_subjects` (
  `id`          CHAR(36)      NOT NULL PRIMARY KEY,
  `name`        VARCHAR(100)  NOT NULL UNIQUE,
  `slug`        VARCHAR(100)  NOT NULL UNIQUE,
  `description` TEXT          NULL,
  `icon`        VARCHAR(500)  NULL,
  `color`       VARCHAR(30)   NOT NULL DEFAULT '#6366f1',
  `isActive`    TINYINT(1)    NOT NULL DEFAULT 1,
  `createdAt`   DATETIME      NOT NULL,
  `updatedAt`   DATETIME      NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. olympiad_classes
CREATE TABLE IF NOT EXISTS `olympiad_classes` (
  `id`          CHAR(36)    NOT NULL PRIMARY KEY,
  `classNumber` INT         NOT NULL UNIQUE,
  `label`       VARCHAR(30) NOT NULL,
  `isActive`    TINYINT(1)  NOT NULL DEFAULT 1,
  `createdAt`   DATETIME    NOT NULL,
  `updatedAt`   DATETIME    NOT NULL,
  INDEX `idx_classNumber` (`classNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Classes 6-12
INSERT IGNORE INTO `olympiad_classes` (`id`, `classNumber`, `label`, `createdAt`, `updatedAt`) VALUES
  (UUID(), 6,  'Class 6',  NOW(), NOW()),
  (UUID(), 7,  'Class 7',  NOW(), NOW()),
  (UUID(), 8,  'Class 8',  NOW(), NOW()),
  (UUID(), 9,  'Class 9',  NOW(), NOW()),
  (UUID(), 10, 'Class 10', NOW(), NOW()),
  (UUID(), 11, 'Class 11', NOW(), NOW()),
  (UUID(), 12, 'Class 12', NOW(), NOW());


-- 3. olympiads
CREATE TABLE IF NOT EXISTS `olympiads` (
  `id`                    CHAR(36)      NOT NULL PRIMARY KEY,
  `title`                 VARCHAR(200)  NOT NULL,
  `slug`                  VARCHAR(250)  NOT NULL UNIQUE,
  `description`           TEXT          NULL,
  `syllabusPdfUrl`        VARCHAR(1000) NULL,
  `bannerImage`           VARCHAR(500)  NULL,
  `tagline`               VARCHAR(300)  NULL,
  `certificateTemplate`   VARCHAR(500)  NULL,
  `registrationStartDate` DATE          NOT NULL,
  `registrationEndDate`   DATE          NOT NULL,
  `examDate`              DATE          NOT NULL,
  `examStartTime`         VARCHAR(10)   NOT NULL DEFAULT '10:00',
  `examDurationMinutes`   INT           NOT NULL DEFAULT 60,
  `resultDate`            DATE          NULL,
  `eligibleClasses`       JSON          NOT NULL,
  `totalQuestions`        INT           NOT NULL DEFAULT 40,
  `marksPerQuestion`      FLOAT         NOT NULL DEFAULT 1,
  `negativeMarks`         FLOAT         NOT NULL DEFAULT 0,
  `passingMarks`          FLOAT         NOT NULL DEFAULT 0,
  `registrationFee`       FLOAT         NOT NULL DEFAULT 150,
  `status`                ENUM('draft','open','closed','ongoing','completed','cancelled') NOT NULL DEFAULT 'draft',
  `prizeDetails`          JSON          NULL,
  `totalRegistrations`    INT           NOT NULL DEFAULT 0,
  `subjectId`             CHAR(36)      NOT NULL,
  `createdBy`             CHAR(36)      NULL,
  `createdAt`             DATETIME      NOT NULL,
  `updatedAt`             DATETIME      NOT NULL,
  INDEX `idx_slug`      (`slug`),
  INDEX `idx_status`    (`status`),
  INDEX `idx_subjectId` (`subjectId`),
  INDEX `idx_examDate`  (`examDate`),
  CONSTRAINT `fk_olympiad_subject` FOREIGN KEY (`subjectId`)
    REFERENCES `olympiad_subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. olympiad_chapters
CREATE TABLE IF NOT EXISTS `olympiad_chapters` (
  `id`         CHAR(36)     NOT NULL PRIMARY KEY,
  `name`       VARCHAR(200) NOT NULL,
  `orderIndex` INT          NOT NULL DEFAULT 0,
  `isActive`   TINYINT(1)   NOT NULL DEFAULT 1,
  `subjectId`  CHAR(36)     NOT NULL,
  `classId`    CHAR(36)     NOT NULL,
  `createdAt`  DATETIME     NOT NULL,
  `updatedAt`  DATETIME     NOT NULL,
  INDEX `idx_subjectId` (`subjectId`),
  INDEX `idx_classId`   (`classId`),
  UNIQUE KEY `uq_name_subject_class` (`name`, `subjectId`, `classId`),
  CONSTRAINT `fk_chapter_subject` FOREIGN KEY (`subjectId`)
    REFERENCES `olympiad_subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_chapter_class` FOREIGN KEY (`classId`)
    REFERENCES `olympiad_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. olympiad_topics
CREATE TABLE IF NOT EXISTS `olympiad_topics` (
  `id`         CHAR(36)     NOT NULL PRIMARY KEY,
  `name`       VARCHAR(200) NOT NULL,
  `orderIndex` INT          NOT NULL DEFAULT 0,
  `isActive`   TINYINT(1)   NOT NULL DEFAULT 1,
  `chapterId`  CHAR(36)     NOT NULL,
  `subjectId`  CHAR(36)     NOT NULL,
  `classId`    CHAR(36)     NOT NULL,
  `createdAt`  DATETIME     NOT NULL,
  `updatedAt`  DATETIME     NOT NULL,
  INDEX `idx_chapterId` (`chapterId`),
  INDEX `idx_subjectId` (`subjectId`),
  INDEX `idx_classId`   (`classId`),
  CONSTRAINT `fk_topic_chapter` FOREIGN KEY (`chapterId`)
    REFERENCES `olympiad_chapters`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 6. olympiad_questions
CREATE TABLE IF NOT EXISTS `olympiad_questions` (
  `id`               CHAR(36)                     NOT NULL PRIMARY KEY,
  `questionText`     TEXT                         NOT NULL,
  `image`            VARCHAR(500)                 NULL,
  `options`          JSON                         NOT NULL,
  `correctAnswer`    VARCHAR(10)                  NOT NULL,
  `explanation`      TEXT                         NULL,
  `explanationImage` VARCHAR(500)                 NULL,
  `difficulty`       ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
  `marks`            FLOAT                        NOT NULL DEFAULT 1,
  `negativeMarks`    FLOAT                        NOT NULL DEFAULT 0,
  `isActive`         TINYINT(1)                   NOT NULL DEFAULT 1,
  `totalAttempts`    INT                          NOT NULL DEFAULT 0,
  `correctAttempts`  INT                          NOT NULL DEFAULT 0,
  `subjectId`        CHAR(36)                     NOT NULL,
  `classId`          CHAR(36)                     NOT NULL,
  `chapterId`        CHAR(36)                     NULL,
  `topicId`          CHAR(36)                     NULL,
  `createdBy`        CHAR(36)                     NULL,
  `createdAt`        DATETIME                     NOT NULL,
  `updatedAt`        DATETIME                     NOT NULL,
  INDEX `idx_subjectId`  (`subjectId`),
  INDEX `idx_classId`    (`classId`),
  INDEX `idx_chapterId`  (`chapterId`),
  INDEX `idx_difficulty` (`difficulty`),
  INDEX `idx_isActive`   (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 7. olympiad_study_materials
CREATE TABLE IF NOT EXISTS `olympiad_study_materials` (
  `id`          CHAR(36)                                          NOT NULL PRIMARY KEY,
  `title`       VARCHAR(300)                                      NOT NULL,
  `description` TEXT                                              NULL,
  `type`        ENUM('pdf','video','notes','practice','syllabus') NOT NULL DEFAULT 'pdf',
  `fileUrl`     VARCHAR(1000)                                     NULL,
  `videoUrl`    VARCHAR(1000)                                     NULL,
  `externalUrl` VARCHAR(1000)                                     NULL,
  `classLevel`  INT                                               NULL,
  `orderIndex`  INT                                               NOT NULL DEFAULT 0,
  `isActive`    TINYINT(1)                                        NOT NULL DEFAULT 1,
  `isFree`      TINYINT(1)                                        NOT NULL DEFAULT 1,
  `subjectId`   CHAR(36)                                          NOT NULL,
  `chapterId`   CHAR(36)                                          NULL,
  `createdBy`   CHAR(36)                                          NULL,
  `createdAt`   DATETIME                                          NOT NULL,
  `updatedAt`   DATETIME                                          NOT NULL,
  INDEX `idx_subjectId`  (`subjectId`),
  INDEX `idx_classLevel` (`classLevel`),
  INDEX `idx_type`       (`type`),
  INDEX `idx_isActive`   (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 8. olympiad_registrations
CREATE TABLE IF NOT EXISTS `olympiad_registrations` (
  `id`                  CHAR(36)                                   NOT NULL PRIMARY KEY,
  `rollNumber`          VARCHAR(30)                                NULL,
  `classSelected`       INT                                        NOT NULL,
  `dob`                 VARCHAR(30)                                NULL,
  `gender`              VARCHAR(20)                                NULL,
  `fatherName`          VARCHAR(150)                               NULL,
  `address`             TEXT                                       NULL,
  `board`               VARCHAR(100)                               NULL,
  `medium`              VARCHAR(50)                                NULL,
  `schoolType`          VARCHAR(20)                                NOT NULL DEFAULT 'private',
  `schoolName`          VARCHAR(255)                               NULL,
  `schoolAddress`       TEXT                                       NULL,
  `documentType`        VARCHAR(100)                               NULL,
  `documentNumber`      VARCHAR(100)                               NULL,
  `documentUrl`         VARCHAR(500)                               NULL,
  `schoolIdCardUrl`     VARCHAR(500)                               NULL,
  `studentPhotoUrl`     VARCHAR(500)                               NULL,
  `verificationStatus`  ENUM('pending','approved','rejected')      NOT NULL DEFAULT 'pending',
  `verificationRemarks` TEXT                                       NULL,
  `verifiedAt`          DATETIME                                   NULL,
  `verifiedBy`          CHAR(36)                                   NULL,
  `paymentId`           CHAR(36)                                   NULL,
  `paymentStatus`       ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `amountPaid`          FLOAT                                      NOT NULL DEFAULT 0,
  `admitCardGenerated`  TINYINT(1)                                 NOT NULL DEFAULT 0,
  `admitCardUrl`        VARCHAR(500)                               NULL,
  `status`              ENUM('pending','confirmed','cancelled')    NOT NULL DEFAULT 'pending',
  `olympiadId`          CHAR(36)                                   NOT NULL,
  `userId`              CHAR(36)                                   NOT NULL,
  `createdAt`           DATETIME                                   NOT NULL,
  `updatedAt`           DATETIME                                   NOT NULL,
  INDEX `idx_olympiadId`    (`olympiadId`),
  INDEX `idx_userId`        (`userId`),
  INDEX `idx_paymentStatus` (`paymentStatus`),
  INDEX `idx_rollNumber`    (`rollNumber`),
  UNIQUE KEY `uq_olympiad_user` (`olympiadId`, `userId`),
  CONSTRAINT `fk_reg_olympiad` FOREIGN KEY (`olympiadId`)
    REFERENCES `olympiads`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 9. olympiad_exam_sessions
CREATE TABLE IF NOT EXISTS `olympiad_exam_sessions` (
  `id`                   CHAR(36)                                                                      NOT NULL PRIMARY KEY,
  `startedAt`            DATETIME                                                                      NULL,
  `submittedAt`          DATETIME                                                                      NULL,
  `status`               ENUM('not_started','in_progress','submitted','auto_submitted','disqualified') NOT NULL DEFAULT 'not_started',
  `tabSwitchCount`       INT                                                                           NOT NULL DEFAULT 0,
  `fullScreenViolations` INT                                                                           NOT NULL DEFAULT 0,
  `answers`              JSON                                                                          NULL,
  `markedForReview`      JSON                                                                          NULL,
  `questionOrder`        JSON                                                                          NULL,
  `olympiadId`           CHAR(36)                                                                      NOT NULL,
  `userId`               CHAR(36)                                                                      NOT NULL,
  `registrationId`       CHAR(36)                                                                      NOT NULL,
  `createdAt`            DATETIME                                                                      NOT NULL,
  `updatedAt`            DATETIME                                                                      NOT NULL,
  INDEX `idx_olympiadId` (`olympiadId`),
  INDEX `idx_userId`     (`userId`),
  INDEX `idx_status`     (`status`),
  UNIQUE KEY `uq_session_olympiad_user` (`olympiadId`, `userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 10. olympiad_results
CREATE TABLE IF NOT EXISTS `olympiad_results` (
  `id`               CHAR(36)     NOT NULL PRIMARY KEY,
  `totalMarks`       FLOAT        NOT NULL DEFAULT 0,
  `obtainedMarks`    FLOAT        NOT NULL DEFAULT 0,
  `correctAnswers`   INT          NOT NULL DEFAULT 0,
  `wrongAnswers`     INT          NOT NULL DEFAULT 0,
  `skippedAnswers`   INT          NOT NULL DEFAULT 0,
  `accuracy`         FLOAT        NOT NULL DEFAULT 0,
  `timeTakenSeconds` INT          NOT NULL DEFAULT 0,
  `percentile`       FLOAT        NOT NULL DEFAULT 0,
  `nationalRank`     INT          NULL,
  `stateRank`        INT          NULL,
  `districtRank`     INT          NULL,
  `schoolRank`       INT          NULL,
  `classRank`        INT          NULL,
  `studentState`     VARCHAR(100) NULL,
  `studentDistrict`  VARCHAR(100) NULL,
  `studentClass`     INT          NULL,
  `answerReview`     JSON         NULL,
  `rankPublished`    TINYINT(1)   NOT NULL DEFAULT 0,
  `grade`            VARCHAR(10)  NULL,
  `isPassed`         TINYINT(1)   NOT NULL DEFAULT 1,
  `olympiadId`       CHAR(36)     NOT NULL,
  `userId`           CHAR(36)     NOT NULL,
  `registrationId`   CHAR(36)     NOT NULL,
  `sessionId`        CHAR(36)     NOT NULL,
  `createdAt`        DATETIME     NOT NULL,
  `updatedAt`        DATETIME     NOT NULL,
  INDEX `idx_olympiadId`    (`olympiadId`),
  INDEX `idx_userId`        (`userId`),
  INDEX `idx_nationalRank`  (`nationalRank`),
  INDEX `idx_rankPublished` (`rankPublished`),
  UNIQUE KEY `uq_result_olympiad_user` (`olympiadId`, `userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 11. olympiad_certificates
CREATE TABLE IF NOT EXISTS `olympiad_certificates` (
  `id`             CHAR(36)     NOT NULL PRIMARY KEY,
  `certificateId`  VARCHAR(30)  NOT NULL UNIQUE,
  `certificateUrl` VARCHAR(500) NULL,
  `issuedAt`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `studentName`    VARCHAR(150) NULL,
  `olympiadTitle`  VARCHAR(200) NULL,
  `subjectName`    VARCHAR(100) NULL,
  `className`      VARCHAR(30)  NULL,
  `grade`          VARCHAR(30)  NULL,
  `nationalRank`   INT          NULL,
  `obtainedMarks`  FLOAT        NULL,
  `totalMarks`     FLOAT        NULL,
  `examDate`       DATE         NULL,
  `olympiadId`     CHAR(36)     NOT NULL,
  `userId`         CHAR(36)     NOT NULL,
  `resultId`       CHAR(36)     NOT NULL,
  `registrationId` CHAR(36)     NOT NULL,
  `createdAt`      DATETIME     NOT NULL,
  `updatedAt`      DATETIME     NOT NULL,
  INDEX `idx_certificateId` (`certificateId`),
  INDEX `idx_olympiadId`    (`olympiadId`),
  INDEX `idx_userId`        (`userId`),
  UNIQUE KEY `uq_cert_olympiad_user` (`olympiadId`, `userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
-- ALTER STATEMENTS
-- Run ONLY if the tables already existed on live and are
-- missing the new columns/enum values added during development.
-- These use IF NOT EXISTS / MODIFY so they are safe to re-run.
-- ============================================================

-- A. Add syllabusPdfUrl column to olympiads (safe if already exists)
ALTER TABLE `olympiads`
  ADD COLUMN IF NOT EXISTS `syllabusPdfUrl` VARCHAR(1000) NULL AFTER `description`;

-- B. Expand type ENUM in olympiad_study_materials to add 'practice' and 'syllabus'
ALTER TABLE `olympiad_study_materials`
  MODIFY COLUMN `type`
    ENUM('pdf','video','notes','practice','syllabus')
    NOT NULL DEFAULT 'pdf';

-- ============================================================
-- END OF MIGRATION
-- ============================================================