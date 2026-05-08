module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('meetings', {
      meeting_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      type: { type: Sequelize.ENUM('in-person', 'online'), allowNull: false },
      scheduled_at: { type: Sequelize.DATE, allowNull: false },
      organizer_id: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE },
      updated_at: { type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('meetings');
  }
};
