'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, update existing numeric roles to string values
    await queryInterface.sequelize.query(`
      UPDATE userinfos 
      SET role = CASE 
        WHEN role = 1 THEN 'admin'
        WHEN role = 2 THEN 'manager'
        WHEN role = 3 THEN 'developer'
        ELSE 'developer'
      END
      WHERE role IN (1, 2, 3)
    `);

    // Then change the column type to ENUM
    await queryInterface.changeColumn('userinfos', 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'developer'),
      allowNull: true,
      defaultValue: 'developer'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to INTEGER
    await queryInterface.changeColumn('userinfos', 'role', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 3
    });

    // Convert string roles back to numeric
    await queryInterface.sequelize.query(`
      UPDATE userinfos 
      SET role = CASE 
        WHEN role = 'admin' THEN 1
        WHEN role = 'manager' THEN 2
        WHEN role = 'developer' THEN 3
        ELSE 3
      END
      WHERE role IN ('admin', 'manager', 'developer')
    `);
  }
};
