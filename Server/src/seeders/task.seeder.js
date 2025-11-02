const { Task } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const taskData = [
  // E-Commerce Platform Redesign Tasks
  {
    title: 'Design System Implementation',
    description: 'Create and implement a comprehensive design system with reusable components, typography, and color schemes.',
    status: 'in_progress',
    priority: 'high',
    estimate_time: 40,
    actual_time: 25,
    dueDate: new Date('2024-03-15'),
    projectId: 1
  },
  {
    title: 'User Authentication System',
    description: 'Implement secure user authentication with JWT tokens, password hashing, and role-based access control.',
    status: 'completed',
    priority: 'high',
    estimate_time: 32,
    actual_time: 28,
    dueDate: new Date('2024-02-28'),
    projectId: 1
  },
  {
    title: 'Payment Gateway Integration',
    description: 'Integrate Stripe payment gateway with secure transaction processing and error handling.',
    status: 'in_progress',
    priority: 'critical',
    estimate_time: 48,
    actual_time: 20,
    dueDate: new Date('2024-04-30'),
    projectId: 1
  },
  {
    title: 'Mobile Responsive Design',
    description: 'Ensure all pages and components are fully responsive across different screen sizes and devices.',
    status: 'todo',
    priority: 'medium',
    estimate_time: 24,
    actual_time: 0,
    dueDate: new Date('2024-05-15'),
    projectId: 1
  },

  // Mobile App Development Tasks
  {
    title: 'Project Setup and Configuration',
    description: 'Set up React Native project with Expo, configure development environment, and establish project structure.',
    status: 'completed',
    priority: 'medium',
    estimate_time: 16,
    actual_time: 12,
    dueDate: new Date('2024-03-10'),
    projectId: 2
  },
  {
    title: 'Navigation System',
    description: 'Implement navigation system using React Navigation with stack and tab navigators.',
    status: 'in_progress',
    priority: 'high',
    estimate_time: 20,
    actual_time: 8,
    dueDate: new Date('2024-03-25'),
    projectId: 2
  },
  {
    title: 'State Management Setup',
    description: 'Configure Redux store with actions, reducers, and middleware for state management.',
    status: 'todo',
    priority: 'medium',
    estimate_time: 16,
    actual_time: 0,
    dueDate: new Date('2024-04-05'),
    projectId: 2
  },

  // Data Analytics Dashboard Tasks
  {
    title: 'Database Schema Design',
    description: 'Design and implement database schema for analytics data with proper indexing and relationships.',
    status: 'completed',
    priority: 'high',
    estimate_time: 24,
    actual_time: 20,
    dueDate: new Date('2023-11-15'),
    projectId: 3
  },
  {
    title: 'Data Visualization Components',
    description: 'Create reusable chart components using D3.js for various data visualizations.',
    status: 'completed',
    priority: 'high',
    estimate_time: 40,
    actual_time: 35,
    dueDate: new Date('2024-01-20'),
    projectId: 3
  },
  {
    title: 'Real-time Data Processing',
    description: 'Implement real-time data processing pipeline with Redis for caching and performance optimization.',
    status: 'completed',
    priority: 'medium',
    estimate_time: 32,
    actual_time: 30,
    dueDate: new Date('2024-02-10'),
    projectId: 3
  },

  // API Gateway Implementation Tasks
  {
    title: 'Kong Gateway Setup',
    description: 'Install and configure Kong API gateway with basic routing and authentication.',
    status: 'in_progress',
    priority: 'high',
    estimate_time: 24,
    actual_time: 16,
    dueDate: new Date('2024-03-31'),
    projectId: 4
  },
  {
    title: 'Service Discovery Integration',
    description: 'Implement service discovery mechanism for automatic service registration and health checks.',
    status: 'todo',
    priority: 'medium',
    estimate_time: 20,
    actual_time: 0,
    dueDate: new Date('2024-04-15'),
    projectId: 4
  },
  {
    title: 'Rate Limiting Configuration',
    description: 'Configure rate limiting policies and rules for different API endpoints and user tiers.',
    status: 'todo',
    priority: 'medium',
    estimate_time: 16,
    actual_time: 0,
    dueDate: new Date('2024-04-30'),
    projectId: 4
  },

  // Cloud Migration Project Tasks
  {
    title: 'Infrastructure Assessment',
    description: 'Conduct comprehensive assessment of current infrastructure and create migration roadmap.',
    status: 'in_progress',
    priority: 'high',
    estimate_time: 40,
    actual_time: 25,
    dueDate: new Date('2024-05-15'),
    projectId: 5
  },
  {
    title: 'AWS Account Setup',
    description: 'Set up AWS accounts, configure IAM roles, and establish security policies.',
    status: 'todo',
    priority: 'high',
    estimate_time: 16,
    actual_time: 0,
    dueDate: new Date('2024-05-30'),
    projectId: 5
  },
  {
    title: 'Database Migration Planning',
    description: 'Plan database migration strategy with minimal downtime and data integrity guarantees.',
    status: 'todo',
    priority: 'critical',
    estimate_time: 32,
    actual_time: 0,
    dueDate: new Date('2024-06-15'),
    projectId: 5
  },

  // Security Audit & Compliance Tasks
  {
    title: 'Vulnerability Assessment',
    description: 'Conduct comprehensive vulnerability assessment using automated tools and manual testing.',
    status: 'in_progress',
    priority: 'critical',
    estimate_time: 48,
    actual_time: 30,
    dueDate: new Date('2024-03-31'),
    projectId: 6
  },
  {
    title: 'Penetration Testing',
    description: 'Perform penetration testing on critical systems and applications to identify security weaknesses.',
    status: 'todo',
    priority: 'critical',
    estimate_time: 40,
    actual_time: 0,
    dueDate: new Date('2024-04-30'),
    projectId: 6
  },
  {
    title: 'Compliance Documentation',
    description: 'Prepare compliance documentation for GDPR, SOC 2, and industry-specific regulations.',
    status: 'todo',
    priority: 'high',
    estimate_time: 32,
    actual_time: 0,
    dueDate: new Date('2024-06-30'),
    projectId: 6
  },

  // Customer Support System Tasks
  {
    title: 'Ticket Management System',
    description: 'Develop ticket management system with status tracking, priority levels, and assignment capabilities.',
    status: 'completed',
    priority: 'high',
    estimate_time: 48,
    actual_time: 42,
    dueDate: new Date('2023-11-30'),
    projectId: 7
  },
  {
    title: 'Live Chat Integration',
    description: 'Integrate live chat functionality with real-time messaging and file sharing capabilities.',
    status: 'completed',
    priority: 'medium',
    estimate_time: 32,
    actual_time: 28,
    dueDate: new Date('2023-12-31'),
    projectId: 7
  },
  {
    title: 'Knowledge Base System',
    description: 'Create knowledge base system with search functionality and article management.',
    status: 'completed',
    priority: 'medium',
    estimate_time: 24,
    actual_time: 20,
    dueDate: new Date('2024-01-15'),
    projectId: 7
  },

  // Performance Optimization Tasks
  {
    title: 'Database Query Optimization',
    description: 'Analyze and optimize database queries for improved performance and reduced response times.',
    status: 'in_progress',
    priority: 'high',
    estimate_time: 40,
    actual_time: 25,
    dueDate: new Date('2024-04-30'),
    projectId: 8
  },
  {
    title: 'Caching Implementation',
    description: 'Implement Redis caching for frequently accessed data and API responses.',
    status: 'in_progress',
    priority: 'medium',
    estimate_time: 24,
    actual_time: 12,
    dueDate: new Date('2024-05-15'),
    projectId: 8
  },
  {
    title: 'Frontend Performance Audit',
    description: 'Conduct frontend performance audit and implement optimizations for faster loading times.',
    status: 'todo',
    priority: 'medium',
    estimate_time: 32,
    actual_time: 0,
    dueDate: new Date('2024-06-15'),
    projectId: 8
  },

  // DevOps Automation Tasks
  {
    title: 'CI/CD Pipeline Setup',
    description: 'Set up continuous integration and deployment pipelines using Jenkins and GitLab CI.',
    status: 'todo',
    priority: 'high',
    estimate_time: 40,
    actual_time: 0,
    dueDate: new Date('2024-07-31'),
    projectId: 9
  },
  {
    title: 'Infrastructure as Code',
    description: 'Implement infrastructure as code using Terraform for automated provisioning and management.',
    status: 'todo',
    priority: 'medium',
    estimate_time: 32,
    actual_time: 0,
    dueDate: new Date('2024-08-31'),
    projectId: 9
  },
  {
    title: 'Monitoring and Alerting',
    description: 'Set up comprehensive monitoring and alerting system for applications and infrastructure.',
    status: 'todo',
    priority: 'medium',
    estimate_time: 24,
    actual_time: 0,
    dueDate: new Date('2024-09-15'),
    projectId: 9
  },

  // Machine Learning Integration Tasks
  {
    title: 'Data Preprocessing Pipeline',
    description: 'Create data preprocessing pipeline for cleaning, transforming, and preparing data for ML models.',
    status: 'todo',
    priority: 'medium',
    estimate_time: 48,
    actual_time: 0,
    dueDate: new Date('2024-08-31'),
    projectId: 10
  },
  {
    title: 'Recommendation Engine Development',
    description: 'Develop recommendation engine using collaborative filtering and content-based approaches.',
    status: 'todo',
    priority: 'high',
    estimate_time: 56,
    actual_time: 0,
    dueDate: new Date('2024-10-31'),
    projectId: 10
  },
  {
    title: 'Model Deployment System',
    description: 'Create system for deploying and managing ML models in production environment.',
    status: 'todo',
    priority: 'medium',
    estimate_time: 40,
    actual_time: 0,
    dueDate: new Date('2024-11-30'),
    projectId: 10
  }
];

async function seedTasks(projects, users) {
  try {
    const createdTasks = [];
    const developers = users.filter(user => user.role === 'developer'); // developer role

    for (let i = 0; i < taskData.length; i++) {
      const taskInfo = taskData[i];
      const assignedUser = developers[i % developers.length]; // Distribute tasks among developers
      
      // Map task projectId to actual project_id from database
      const projectIndex = (taskInfo.projectId - 1) % projects.length;
      const actualProjectId = projects[projectIndex].project_id;

       // Use raw query to insert task data with correct column names
       const [task] = await sequelize.query(`
         INSERT INTO tasks (
           task_name, task_details, status, estimate_time,
           project_id, created_by, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
       `, {
         replacements: [
           taskInfo.title,
           taskInfo.description,
           taskInfo.status,
           taskInfo.estimate_time,
           actualProjectId,
           users[0].user_id
         ],
         type: sequelize.QueryTypes.INSERT
       });

      // Get the inserted task data
      const [insertedTask] = await sequelize.query(`
        SELECT * FROM tasks WHERE task_id = ?
      `, {
        replacements: [task],
        type: sequelize.QueryTypes.SELECT
      });
      
      createdTasks.push(insertedTask);
      logger.info(`Created task: ${taskInfo.title} (Assigned to: ${assignedUser.name})`);
    }

    logger.info(`Successfully created ${createdTasks.length} tasks`);
    return createdTasks;

  } catch (error) {
    logger.error('Error seeding tasks:', error);
    throw error;
  }
}

module.exports = seedTasks;
