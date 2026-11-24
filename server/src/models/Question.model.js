const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Question = sequelize.define('Question', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },

  // ── Question type ────────────────────────────────────────────
  questionType: {
    type: DataTypes.ENUM('mcq', 'multi_correct', 'true_false', 'fill_blank', 'passage', 'match'),
    defaultValue: 'mcq',
    comment: 'mcq=single MCQ, multi_correct=multiple correct, true_false, fill_blank, passage=comprehension, match=match the column',
  },

  // ── Text ─────────────────────────────────────────────────────
  questionText: { type: DataTypes.TEXT, allowNull: false },
  questionTextHindi: { type: DataTypes.TEXT, allowNull: true },

  // For passage/comprehension questions: the reading passage
  passage: { type: DataTypes.TEXT, allowNull: true },
  passageHindi: { type: DataTypes.TEXT, allowNull: true },

  // ── Image support ─────────────────────────────────────────────
  image: { type: DataTypes.STRING(500), allowNull: true },

  // ── Options ───────────────────────────────────────────────────
  // JSON: [{ label:'A', text:'...', textHindi:'...', image: 'url' }, ...]
  options: {
    type: DataTypes.JSON, allowNull: false, defaultValue: [],
    get() {
      const v = this.getDataValue('options');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    }
  },

  // Single correct answer (for mcq / true_false / fill_blank)
  correctAnswer: {
    type: DataTypes.STRING(10), allowNull: true,
    comment: 'A/B/C/D/E for MCQ; True/False for T/F; the answer text for fill_blank',
  },

  // Multiple correct answers (for multi_correct) — stored as JSON array e.g. ["A","C"]
  correctAnswers: {
    type: DataTypes.JSON, allowNull: true, defaultValue: null,
    get() {
      const v = this.getDataValue('correctAnswers');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
      return v;
    }
  },

  // Match-the-column pairs — JSON: [{ left:'...', right:'...' }, ...]
  matchPairs: {
    type: DataTypes.JSON, allowNull: true, defaultValue: null,
    get() {
      const v = this.getDataValue('matchPairs');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return null; } }
      return v;
    }
  },

  // ── Explanation ───────────────────────────────────────────────
  explanation: { type: DataTypes.TEXT, allowNull: true },
  explanationHindi: { type: DataTypes.TEXT, allowNull: true },
  explanationImage: { type: DataTypes.STRING(500), allowNull: true },

  // ── Meta ──────────────────────────────────────────────────────
  subjectId: { type: DataTypes.UUID, allowNull: true, comment: 'References Subject model' },
  subject: { type: DataTypes.STRING(100), allowNull: true },
  topic: { type: DataTypes.STRING(150), allowNull: true },
  difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' },
  marks: { type: DataTypes.FLOAT, defaultValue: 1 },
  negativeMarks: { type: DataTypes.FLOAT, defaultValue: 0 },
  language: { type: DataTypes.ENUM('en', 'hi', 'bilingual'), defaultValue: 'en' },
  tags: {
    type: DataTypes.JSON, defaultValue: [],
    get() {
      const v = this.getDataValue('tags');
      if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
      return v || [];
    }
  },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },

  // ── Stats ─────────────────────────────────────────────────────
  totalAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  correctAttempts: { type: DataTypes.INTEGER, defaultValue: 0 },

  // ── FK ────────────────────────────────────────────────────────
  createdBy: { type: DataTypes.UUID, allowNull: true },
  categoryId: { type: DataTypes.UUID, allowNull: true, comment: 'Links question to a specific exam category' },
}, {
  tableName: 'questions',
  indexes: [
    { fields: ['subject'] },
    { fields: ['difficulty'] },
    { fields: ['isActive'] },
    { fields: ['questionType'] },
  ],
});

module.exports = Question;
