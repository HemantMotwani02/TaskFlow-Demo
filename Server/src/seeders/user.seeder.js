const { User } = require('../models');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const userData = [
  {
    name: 'John Smith',
    email: 'john.smith@company.com',
    password: 'password123',
    role: 'admin',
    phone: '+15550101',
    address: '123 Main Street, New York, NY 10001',
    profile: 'Senior Project Manager with 8+ years of experience in software development and team leadership.',
    isActive: true
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    password: 'password123',
    role: 'manager',
    phone: '+15550102',
    address: '456 Oak Avenue, Los Angeles, CA 90210',
    profile: 'Product Manager specializing in agile methodologies and user experience design.',
    isActive: true
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    password: 'password123',
    role: 'manager',
    phone: '+15550103',
    address: '789 Pine Road, Chicago, IL 60601',
    profile: 'Technical Lead with expertise in full-stack development and system architecture.',
    isActive: true
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550104',
    address: '321 Elm Street, Boston, MA 02101',
    profile: 'Frontend Developer passionate about React, TypeScript, and modern web technologies.',
    isActive: true
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550105',
    address: '654 Maple Drive, Seattle, WA 98101',
    profile: 'Backend Developer specializing in Node.js, Python, and database optimization.',
    isActive: true
  },
  {
    name: 'Lisa Brown',
    email: 'lisa.brown@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550106',
    address: '987 Cedar Lane, Austin, TX 73301',
    profile: 'Full-stack Developer with experience in React, Node.js, and cloud technologies.',
    isActive: true
  },
  {
    name: 'Robert Taylor',
    email: 'robert.taylor@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550107',
    address: '147 Birch Court, Denver, CO 80201',
    profile: 'DevOps Engineer focused on CI/CD pipelines and infrastructure automation.',
    isActive: true
  },
  {
    name: 'Jennifer Garcia',
    email: 'jennifer.garcia@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550108',
    address: '258 Spruce Way, Miami, FL 33101',
    profile: 'UI/UX Designer and Frontend Developer with a passion for user-centered design.',
    isActive: true
  },
  {
    name: 'Christopher Martinez',
    email: 'christopher.martinez@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550109',
    address: '369 Willow Path, Portland, OR 97201',
    profile: 'Mobile Developer specializing in React Native and iOS development.',
    isActive: true
  },
  {
    name: 'Amanda Rodriguez',
    email: 'amanda.rodriguez@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550110',
    address: '741 Aspen Circle, Nashville, TN 37201',
    profile: 'QA Engineer with expertise in automated testing and quality assurance processes.',
    isActive: true
  },
  {
    name: 'James Anderson',
    email: 'james.anderson@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550111',
    address: '852 Poplar Street, Phoenix, AZ 85001',
    profile: 'Data Scientist with experience in machine learning and statistical analysis.',
    isActive: true
  },
  {
    name: 'Michelle Lee',
    email: 'michelle.lee@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550112',
    address: '963 Sycamore Avenue, San Diego, CA 92101',
    profile: 'Security Engineer focused on application security and penetration testing.',
    isActive: true
  },
  {
    name: 'Thomas White',
    email: 'thomas.white@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550113',
    address: '159 Magnolia Drive, Atlanta, GA 30301',
    profile: 'Database Administrator with expertise in MySQL, PostgreSQL, and data modeling.',
    isActive: true
  },
  {
    name: 'Jessica Thompson',
    email: 'jessica.thompson@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550114',
    address: '357 Redwood Road, San Francisco, CA 94101',
    profile: 'Cloud Architect specializing in AWS, Azure, and infrastructure as code.',
    isActive: true
  },
  {
    name: 'Daniel Clark',
    email: 'daniel.clark@company.com',
    password: 'password123',
    role: 'developer',
    phone: '+15550115',
    address: '486 Sequoia Lane, Dallas, TX 75201',
    profile: 'Performance Engineer focused on application optimization and monitoring.',
    isActive: true
  }
];

async function seedUsers() {
  try {
    const createdUsers = [];

    // Create all users first without createdBy field
    for (const userDataItem of userData) {
      // Use raw query to insert user data with correct column names
      const [user] = await sequelize.query(`
        INSERT INTO userinfos (
          name, email, password, role, phone, address, profile, isActive,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, {
        replacements: [
          userDataItem.name,
          userDataItem.email,
          await bcrypt.hash(userDataItem.password, 10),
          userDataItem.role,
          userDataItem.phone,
          userDataItem.address,
          userDataItem.profile,
          userDataItem.isActive,
          null // created_by set to null initially
        ],
        type: sequelize.QueryTypes.INSERT
      });

      // Get the inserted user data
      const [insertedUser] = await sequelize.query(`
        SELECT * FROM userinfos WHERE user_id = ?
      `, {
        replacements: [user],
        type: sequelize.QueryTypes.SELECT
      });
      
      createdUsers.push(insertedUser);
      logger.info(`Created user: ${userDataItem.name} (${userDataItem.email})`);
    }

    // Now update all users to set createdBy to the admin user (first user)
    const adminUser = createdUsers[0];
    for (const user of createdUsers) {
      await sequelize.query(`
        UPDATE userinfos SET created_by = ? WHERE user_id = ?
      `, {
        replacements: [adminUser.user_id, user.user_id],
        type: sequelize.QueryTypes.UPDATE
      });
    }

    logger.info(`Successfully created ${createdUsers.length} users`);
    return createdUsers;

  } catch (error) {
    logger.error('Error seeding users:', error);
    throw error;
  }
}

module.exports = seedUsers;
