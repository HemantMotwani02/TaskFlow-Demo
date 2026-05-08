const { sequelize } = require('../config/database');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

// Global test setup
beforeAll(async () => {
  // Sync test database
  await sequelize.sync({ force: true });
});

// Global test teardown
afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Reset database between tests
beforeEach(async () => {
  // Clear all tables
  const models = sequelize.models;
  for (const modelName in models) {
    await models[modelName].destroy({ 
      where: {},
      force: true,
      truncate: true
    });
  }
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
