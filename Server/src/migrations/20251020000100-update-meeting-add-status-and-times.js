'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add missing columns to meetings table
    await queryInterface.addColumn('meetings', 'status', {
      type: Sequelize.ENUM('scheduled', 'started', 'completed', 'discarded'),
      allowNull: false,
      defaultValue: 'scheduled'
    });

    await queryInterface.addColumn('meetings', 'start_time', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('meetings', 'end_time', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('meetings', 'participants', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('meetings', 'participants');
    await queryInterface.removeColumn('meetings', 'end_time');
    await queryInterface.removeColumn('meetings', 'start_time');
    await queryInterface.removeColumn('meetings', 'status');
  }
};


