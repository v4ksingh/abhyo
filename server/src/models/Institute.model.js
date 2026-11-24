const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Institute = sequelize.define('Institute', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(200), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: true },
  mobile: { type: DataTypes.STRING(15), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  logo: { type: DataTypes.STRING(500), allowNull: true },
  // Address
  address: { type: DataTypes.TEXT, allowNull: true },
  city: { type: DataTypes.STRING(100), allowNull: true },
  state: { type: DataTypes.STRING(100), allowNull: true },
  pincode: { type: DataTypes.STRING(10), allowNull: true },
  website: { type: DataTypes.STRING(300), allowNull: true },
  // Status
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'), defaultValue: 'pending' },
  rejectionReason: { type: DataTypes.TEXT, allowNull: true },
  // Subscription
  subscriptionPlan: { type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'), defaultValue: 'free' },
  subscriptionStatus: { type: DataTypes.ENUM('trial', 'active', 'expired', 'cancelled'), defaultValue: 'trial' },
  subscriptionStartDate: { type: DataTypes.DATE, allowNull: true },
  subscriptionEndDate: { type: DataTypes.DATE, allowNull: true },
  maxStudents: { type: DataTypes.INTEGER, defaultValue: 50 },
  maxBatches: { type: DataTypes.INTEGER, defaultValue: 3 },
  // Invite
  inviteCode: { type: DataTypes.STRING(20), unique: true, allowNull: true },
  // Stats (denormalized for performance)
  totalStudents: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalBatches: { type: DataTypes.INTEGER, defaultValue: 0 },
  // Owner (FK set in index.js)
  ownerId: { type: DataTypes.UUID, allowNull: true },

  // ─── Landing Page Fields ───────────────────────────────────
  slug: { type: DataTypes.STRING(150), unique: true, allowNull: true },
  tagline: { type: DataTypes.STRING(300), allowNull: true },
  bannerImage: { type: DataTypes.STRING(500), allowNull: true },
  isLandingEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  landingBio: { type: DataTypes.TEXT, allowNull: true },
  // JSON: [{title, value, icon}] e.g. [{title:'Students',value:'5000+',icon:'users'}]
  achievements: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // JSON: {facebook, twitter, youtube, instagram, linkedin}
  socialLinks: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
  // JSON: [{name, description}]
  courses: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // JSON: [{name, designation, photo}]
  faculty: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // JSON: [{name, score, year, text}]
  testimonials: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  // JSON: [{url, caption}]
  gallery: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
  foundedYear: { type: DataTypes.INTEGER, allowNull: true },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  // Contact address (may differ from registered address)
  contactAddress: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'institutes',
});

module.exports = Institute;
