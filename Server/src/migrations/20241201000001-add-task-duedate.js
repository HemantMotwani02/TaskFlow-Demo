'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tasks', 'dueDate', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'estimate_time'
    });

    await queryInterface.addColumn('tasks', 'assigned_to', {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: 'dueDate',
      references: {
        model: 'userinfos',
        key: 'user_id'
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tasks', 'dueDate');
    await queryInterface.removeColumn('tasks', 'assigned_to');
  }
};
