const { Project } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const projectData = [
  {
    name: 'E-Commerce Platform Redesign',
    description: 'Complete redesign and modernization of the company\'s e-commerce platform with improved user experience, mobile responsiveness, and enhanced security features.',
    status: 'in_progress',
    priority: 'high',
    startDate: new Date('2024-01-15'),
    endDate: new Date('2024-06-30'),
    budget: 150000,
    technologies: ['React', 'Node.js', 'MongoDB', 'AWS', 'Stripe'],
    requirements: 'Modern UI/UX, mobile-first design, payment integration, inventory management, analytics dashboard'
  },
  {
    name: 'Mobile App Development',
    description: 'Development of a cross-platform mobile application for iOS and Android using React Native, featuring real-time notifications and offline capabilities.',
    status: 'planning',
    priority: 'medium',
    startDate: new Date('2024-03-01'),
    endDate: new Date('2024-08-15'),
    budget: 80000,
    technologies: ['React Native', 'Firebase', 'Redux', 'Expo'],
    requirements: 'Cross-platform compatibility, push notifications, offline sync, user authentication, social features'
  },
  {
    name: 'Data Analytics Dashboard',
    description: 'Comprehensive analytics dashboard for business intelligence, featuring real-time data visualization, custom reports, and predictive analytics.',
    status: 'completed',
    priority: 'high',
    startDate: new Date('2023-10-01'),
    endDate: new Date('2024-02-28'),
    budget: 120000,
    technologies: ['Python', 'Django', 'PostgreSQL', 'D3.js', 'Redis'],
    requirements: 'Real-time data processing, interactive charts, custom reporting, data export, user permissions'
  },
  {
    name: 'API Gateway Implementation',
    description: 'Implementation of a centralized API gateway to manage microservices, handle authentication, rate limiting, and provide unified API documentation.',
    status: 'in_progress',
    priority: 'medium',
    startDate: new Date('2024-02-01'),
    endDate: new Date('2024-05-31'),
    budget: 60000,
    technologies: ['Kong', 'Docker', 'Kubernetes', 'OpenAPI', 'JWT'],
    requirements: 'Service discovery, load balancing, authentication, rate limiting, monitoring, documentation'
  },
  {
    name: 'Cloud Migration Project',
    description: 'Migration of on-premise infrastructure to cloud-based solutions, including database migration, application deployment, and disaster recovery setup.',
    status: 'planning',
    priority: 'high',
    startDate: new Date('2024-04-01'),
    endDate: new Date('2024-12-31'),
    budget: 200000,
    technologies: ['AWS', 'Terraform', 'Docker', 'Kubernetes', 'Jenkins'],
    requirements: 'Zero-downtime migration, data integrity, backup strategies, monitoring, cost optimization'
  },
  {
    name: 'Security Audit & Compliance',
    description: 'Comprehensive security audit and implementation of compliance measures for GDPR, SOC 2, and industry-specific regulations.',
    status: 'in_progress',
    priority: 'critical',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-07-31'),
    budget: 100000,
    technologies: ['OWASP ZAP', 'SonarQube', 'Vault', 'Prometheus', 'Grafana'],
    requirements: 'Vulnerability assessment, penetration testing, compliance reporting, security monitoring, incident response'
  },
  {
    name: 'Customer Support System',
    description: 'Development of an integrated customer support system with ticket management, live chat, knowledge base, and customer feedback analytics.',
    status: 'completed',
    priority: 'medium',
    startDate: new Date('2023-08-01'),
    endDate: new Date('2024-01-31'),
    budget: 75000,
    technologies: ['Vue.js', 'Laravel', 'MySQL', 'WebSocket', 'Elasticsearch'],
    requirements: 'Ticket tracking, live chat, knowledge base, reporting, integration with existing systems'
  },
  {
    name: 'Performance Optimization',
    description: 'Comprehensive performance optimization of existing applications, including database query optimization, caching strategies, and frontend optimization.',
    status: 'in_progress',
    priority: 'medium',
    startDate: new Date('2024-02-15'),
    endDate: new Date('2024-06-30'),
    budget: 50000,
    technologies: ['Redis', 'CDN', 'Webpack', 'PostgreSQL', 'Nginx'],
    requirements: 'Database optimization, caching implementation, frontend optimization, monitoring, performance testing'
  },
  {
    name: 'DevOps Automation',
    description: 'Implementation of comprehensive DevOps automation including CI/CD pipelines, automated testing, deployment automation, and infrastructure as code.',
    status: 'planning',
    priority: 'medium',
    startDate: new Date('2024-05-01'),
    endDate: new Date('2024-09-30'),
    budget: 90000,
    technologies: ['Jenkins', 'GitLab CI', 'Terraform', 'Ansible', 'Docker'],
    requirements: 'Automated testing, deployment pipelines, infrastructure automation, monitoring, rollback capabilities'
  },
  {
    name: 'Machine Learning Integration',
    description: 'Integration of machine learning capabilities into existing applications, including recommendation systems, predictive analytics, and automated decision-making.',
    status: 'planning',
    priority: 'low',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-11-30'),
    budget: 110000,
    technologies: ['Python', 'TensorFlow', 'Scikit-learn', 'FastAPI', 'PostgreSQL'],
    requirements: 'Recommendation engine, predictive models, data preprocessing, model deployment, monitoring'
  }
];

async function seedProjects(users) {
  try {
    logger.info(`🔍 Starting project seeding with ${users.length} users`);
    logger.info('👥 Users received:', users.map(u => ({ 
      id: u.user_id, 
      name: u.name, 
      email: u.email, 
      role: u.role 
    })));
    
    const createdProjects = [];
    // Fix: Use string-based roles instead of numeric ones
    const managers = users.filter(user => user.role === 'manager' || user.role === 'admin');
    
    logger.info(`👑 Found ${managers.length} managers:`, managers.map(m => ({ 
      id: m.user_id, 
      name: m.name, 
      role: m.role 
    })));

    // Check if we have any managers
    if (managers.length === 0) {
      logger.warn('⚠️ No managers found, using first user as manager for all projects');
      // Use the first user as a fallback manager
      const fallbackManager = users[0];
      if (!fallbackManager) {
        throw new Error('No users available to assign as project managers');
      }
      
      logger.info(`🔄 Using fallback manager: ${fallbackManager.name} (ID: ${fallbackManager.user_id})`);
      
      for (let i = 0; i < projectData.length; i++) {
        const projectInfo = projectData[i];

        // Use raw query to insert project data with correct column names
        const [project] = await sequelize.query(`
          INSERT INTO projects (
            project_name, project_details, status,
            manager_id, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [
            projectInfo.name,
            projectInfo.description,
            projectInfo.status,
            fallbackManager.user_id,
            fallbackManager.user_id
          ],
          type: sequelize.QueryTypes.INSERT
        });

        // Get the inserted project data
        const [insertedProject] = await sequelize.query(`
          SELECT * FROM projects WHERE project_id = ?
        `, {
          replacements: [project],
          type: sequelize.QueryTypes.SELECT
        });
        
        createdProjects.push(insertedProject);
        logger.info(`Created project: ${projectInfo.name} (Manager: ${fallbackManager.name})`);
      }
    } else {
      // Normal flow with managers
      for (let i = 0; i < projectData.length; i++) {
        const projectInfo = projectData[i];
        const manager = managers[i % managers.length]; // Distribute projects among managers

        if (!manager || !manager.user_id) {
          logger.error(`Invalid manager for project ${projectInfo.name}:`, manager);
          throw new Error(`Invalid manager for project ${projectInfo.name}`);
        }

        // Use raw query to insert project data with correct column names
        const [project] = await sequelize.query(`
          INSERT INTO projects (
            project_name, project_details, status,
            manager_id, created_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [
            projectInfo.name,
            projectInfo.description,
            projectInfo.status,
            manager.user_id,
            users[0].user_id
          ],
          type: sequelize.QueryTypes.INSERT
        });

        // Get the inserted project data
        const [insertedProject] = await sequelize.query(`
          SELECT * FROM projects WHERE project_id = ?
        `, {
          replacements: [project],
          type: sequelize.QueryTypes.SELECT
        });
        
        createdProjects.push(insertedProject);
        logger.info(`Created project: ${projectInfo.name} (Manager: ${manager.name})`);
      }
    }

    logger.info(`Successfully created ${createdProjects.length} projects`);
    return createdProjects;

  } catch (error) {
    logger.error('Error seeding projects:', error);
    throw error;
  }
}

module.exports = seedProjects;
