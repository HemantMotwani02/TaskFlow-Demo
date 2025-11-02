module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('meeting_notes', {
      note_id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      meeting_id: { type: Sequelize.INTEGER, allowNull: false },
      author_id: { type: Sequelize.INTEGER, allowNull: false },
      note: { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE },
      updated_at: { type: Sequelize.DATE }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('meeting_notes');
  }
};
