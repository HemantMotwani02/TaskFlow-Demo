'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('projects', 'deleted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('projects', 'deleted_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'userinfos',
        key: 'user_id'
      }
    });

    // Add index for better query performance
    await queryInterface.addIndex('projects', ['deleted_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('projects', ['deleted_at']);
    await queryInterface.removeColumn('projects', 'deleted_by');
    await queryInterface.removeColumn('projects', 'deleted_at');
  }
};
