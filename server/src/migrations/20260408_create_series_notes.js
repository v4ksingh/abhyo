'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('series_notes', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      seriesId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'exam_series', key: 'id' },
        onDelete: 'CASCADE',
      },
      title: {
        type: Sequelize.STRING(300),
        allowNull: false,
      },
      subject: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      content: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      },
      fileUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      fileType: {
        type: Sequelize.ENUM('pdf', 'doc', 'image', 'link', 'none'),
        defaultValue: 'none',
        allowNull: false,
      },
      externalLink: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      isFree: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Indexes
    await queryInterface.addIndex('series_notes', ['seriesId']);
    await queryInterface.addIndex('series_notes', ['subject']);
    await queryInterface.addIndex('series_notes', ['isActive']);
    await queryInterface.addIndex('series_notes', ['seriesId', 'subject']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('series_notes');
  },
};
