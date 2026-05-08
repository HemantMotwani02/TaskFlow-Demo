#!/usr/bin/env node

const { runSeeders, clearDatabase } = require('../seeders');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const command = args[0];

    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    if (command === 'clear') {
      logger.info('Clearing database...');
      await clearDatabase();
      logger.info('Database cleared successfully!');
    } else if (command === 'seed') {
      logger.info('Starting database seeding...');
      await runSeeders();
      logger.info('Database seeding completed successfully!');
    } else if (command === 'reset') {
      logger.info('Resetting database (clear + seed)...');
      await clearDatabase();
      await runSeeders();
      logger.info('Database reset completed successfully!');
    } else {
      logger.info('Usage:');
      logger.info('  node seed.js seed    - Populate database with dummy data');
      logger.info('  node seed.js clear   - Clear all data from database');
      logger.info('  node seed.js reset   - Clear and then populate database');
      process.exit(0);
    }

    process.exit(0);
  } catch (error) {
    logger.error('Error:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

main();
