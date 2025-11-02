const { Assignment } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

async function seedAssignments(projects, users) {
  try {
    const createdAssignments = [];
    const developers = users.filter(user => user.role === 'developer');
    const managers = users.filter(user => user.role === 'manager' || user.role === 'admin');

    // Create assignments for each project
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      
      // Assign 3-6 developers to each project
      const numDevelopers = Math.floor(Math.random() * 4) + 3; // 3-6 developers
      const projectDevelopers = developers.slice(0, numDevelopers);
      
      for (const developer of projectDevelopers) {
        // Use raw query to insert assignment data with correct column names
        const [assignment] = await sequelize.query(`
          INSERT INTO assignments (
            project_id, user_id, manager_id, created_at, updated_at
          ) VALUES (?, ?, ?, NOW(), NOW())
        `, {
          replacements: [
            project.project_id,
            developer.user_id,
            users[0].user_id // Admin as manager
          ],
          type: sequelize.QueryTypes.INSERT
        });

        createdAssignments.push(assignment);
        logger.info(`Assigned ${developer.name} to project: ${project.project_name}`);
      }

      // Assign 1-2 managers to each project
      const numManagers = Math.floor(Math.random() * 2) + 1; // 1-2 managers
      const projectManagers = managers.slice(0, numManagers);
      
      for (const manager of projectManagers) {
        // Use raw query to insert assignment data with correct column names
        const [assignment] = await sequelize.query(`
          INSERT INTO assignments (
            project_id, user_id, manager_id, created_at, updated_at
          ) VALUES (?, ?, ?, NOW(), NOW())
        `, {
          replacements: [
            project.project_id,
            manager.user_id,
            users[0].user_id // Admin as manager
          ],
          type: sequelize.QueryTypes.INSERT
        });

        createdAssignments.push(assignment);
        logger.info(`Assigned ${manager.name} as manager to project: ${project.project_name}`);
      }
    }

    logger.info(`Successfully created ${createdAssignments.length} assignments`);
    return createdAssignments;

  } catch (error) {
    logger.error('Error seeding assignments:', error);
    throw error;
  }
}

module.exports = seedAssignments;
