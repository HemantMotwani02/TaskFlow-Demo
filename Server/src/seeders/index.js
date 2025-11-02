const { User, Project, Task, Log, Assignment } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const seedUsers = require('./user.seeder');
const seedProjects = require('./project.seeder');
const seedTasks = require('./task.seeder');
const seedLogs = require('./log.seeder');
const seedAssignments = require('./assignment.seeder');

async function runSeeders() {
  try {
    logger.info('Starting database seeding...');

    // Clear existing data (in reverse order of dependencies)
    logger.info('Clearing existing data...');
    
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    await Assignment.destroy({ where: {}, force: true });
    await Log.destroy({ where: {}, force: true });
    await Task.destroy({ where: {}, force: true });
    await Project.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Seed in order of dependencies
    logger.info('Seeding users...');
    const users = await seedUsers();

    logger.info('Seeding projects...');
    const projects = await seedProjects(users);

    logger.info('Seeding tasks...');
    const tasks = await seedTasks(projects, users);

    logger.info('Seeding assignments...');
    await seedAssignments(projects, users);

    logger.info('Seeding logs...');
    await seedLogs(tasks, users);

    logger.info('Database seeding completed successfully!');
    logger.info(`Created: ${users.length} users, ${projects.length} projects, ${tasks.length} tasks`);

  } catch (error) {
    logger.error('Error during seeding:', error);
    throw error;
  }
}

async function clearDatabase() {
  try {
    logger.info('Clearing all data from database...');
    
    await Assignment.destroy({ where: {}, force: true });
    await Log.destroy({ where: {}, force: true });
    await Task.destroy({ where: {}, force: true });
    await Project.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });

    logger.info('Database cleared successfully!');
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
}

module.exports = {
  runSeeders,
  clearDatabase
};
