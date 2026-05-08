'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tasks', 'priority', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'medium',
      after: 'status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('tasks', 'priority');
  }
};
