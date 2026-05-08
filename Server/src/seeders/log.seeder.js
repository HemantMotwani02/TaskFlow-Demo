const { Log } = require('../models');
const { sequelize } = require('../config/database');
const logger = require('../utils/logger');

const logActivities = [
  'Code review and feedback implementation',
  'Bug fixing and debugging',
  'Feature development and implementation',
  'Testing and quality assurance',
  'Documentation writing and updates',
  'Meeting attendance and discussion',
  'Research and analysis',
  'Design and prototyping',
  'Deployment and configuration',
  'Performance optimization',
  'Security review and implementation',
  'Integration testing',
  'User acceptance testing',
  'Code refactoring',
  'Database optimization',
  'API development and testing',
  'Frontend component development',
  'Backend service implementation',
  'Infrastructure setup and configuration',
  'Monitoring and logging implementation'
];

const logDescriptions = [
  'Implemented user authentication system with JWT tokens and role-based access control.',
  'Fixed critical bug in payment processing that was causing transaction failures.',
  'Developed responsive design components for mobile and tablet compatibility.',
  'Conducted comprehensive testing of new features and identified edge cases.',
  'Updated API documentation with new endpoints and request/response examples.',
  'Attended sprint planning meeting and provided estimates for upcoming tasks.',
  'Researched best practices for implementing real-time notifications.',
  'Created wireframes and mockups for new user interface components.',
  'Deployed application to staging environment and configured monitoring.',
  'Optimized database queries to improve application performance by 40%.',
  'Implemented security measures including input validation and SQL injection prevention.',
  'Performed integration testing with third-party services and APIs.',
  'Conducted user acceptance testing with stakeholders and collected feedback.',
  'Refactored legacy code to improve maintainability and reduce technical debt.',
  'Optimized database schema and added proper indexing for better query performance.',
  'Developed RESTful API endpoints for user management and data retrieval.',
  'Built reusable React components with TypeScript and proper error handling.',
  'Implemented microservice architecture for better scalability and maintainability.',
  'Set up CI/CD pipeline with automated testing and deployment processes.',
  'Configured application monitoring and alerting for production environment.'
];

async function seedLogs(tasks, users) {
  try {
    const createdLogs = [];
    const developers = users.filter(user => user.role === 'developer'); // developer role

    // Generate logs for each task
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const assignedUser = developers[i % developers.length]; // Distribute among developers
      
      // Generate 2-5 logs per task
      const numLogs = Math.floor(Math.random() * 4) + 2; // 2-5 logs
      
      for (let j = 0; j < numLogs; j++) {
        const hours = Math.floor(Math.random() * 8) + 1; // 1-8 hours
        const minutes = Math.floor(Math.random() * 60); // 0-59 minutes
        
        const activity = logActivities[Math.floor(Math.random() * logActivities.length)];
        const description = logDescriptions[Math.floor(Math.random() * logDescriptions.length)];
        
        // Generate random start and end times for the day
        const startHour = Math.floor(Math.random() * 8) + 9; // 9 AM to 5 PM
        const startMinute = Math.floor(Math.random() * 60);
        const endHour = Math.min(startHour + hours, 18); // Don't go past 6 PM
        const endMinute = (startMinute + minutes) % 60;
        
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}:00`;
        const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;

        // Use raw query to insert log data with correct column names
        const [log] = await sequelize.query(`
          INSERT INTO logs (
            user_id, project_id, task_id, logdata, start_time, end_time, logstatus,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, {
          replacements: [
            assignedUser.user_id,
            task.project_id,
            task.task_id,
            `${activity}: ${description}`,
            startTime,
            endTime,
            'completed'
          ],
          type: sequelize.QueryTypes.INSERT
        });

        // Get the inserted log data
        const [insertedLog] = await sequelize.query(`
          SELECT * FROM logs WHERE log_id = ?
        `, {
          replacements: [log],
          type: sequelize.QueryTypes.SELECT
        });
        
        createdLogs.push(insertedLog);
        logger.info(`Created log: ${activity} (${hours}h ${minutes}m) for task: ${task.task_name}`);
      }
    }

    logger.info(`Successfully created ${createdLogs.length} work logs`);
    return createdLogs;

  } catch (error) {
    logger.error('Error seeding logs:', error);
    throw error;
  }
}

module.exports = seedLogs;
