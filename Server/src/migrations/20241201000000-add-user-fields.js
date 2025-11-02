'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('userinfos', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
      after: 'email'
    });

    await queryInterface.addColumn('userinfos', 'address', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'phone'
    });

    await queryInterface.addColumn('userinfos', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      after: 'address'
    });

    await queryInterface.addColumn('userinfos', 'lastLoginAt', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'isActive'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('userinfos', 'phone');
    await queryInterface.removeColumn('userinfos', 'address');
    await queryInterface.removeColumn('userinfos', 'isActive');
    await queryInterface.removeColumn('userinfos', 'lastLoginAt');
  }
};
