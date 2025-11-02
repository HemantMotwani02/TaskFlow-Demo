const { Project, Task, Log, User, Assignment } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Analytics Controller
 * Handles all analytics-related business logic
 */
class AnalyticsController {
  /**
   * Get dashboard analytics
   * @route GET /api/analytics/dashboard
   */
  async getDashboardAnalytics(req, res) {
    const { startDate, endDate } = req.query;

    // Get ALL projects (current state)
    const projects = await Project.findAll({});
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in_progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;

    // Get ALL tasks (current state)
    const tasks = await Task.findAll({});
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'todo').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

    // Get logs filtered by date range
    const logWhere = {};
    if (startDate && endDate) {
      logWhere.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }
    const logs = await Log.findAll({ where: logWhere });
    const totalLogs = logs.length;
    const approvedLogs = logs.filter(l => l.logstatus === 'approved' || l.logstatus === 'completed').length;
    const pendingLogs = logs.filter(l => l.logstatus === 'pending').length;

    // Calculate total hours from logs
    const totalHours = logs.reduce((sum, log) => {
      if (log.start_time && log.end_time) {
        const start = new Date(`2000-01-01T${log.start_time}`);
        const end = new Date(`2000-01-01T${log.end_time}`);
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);
        return sum + diffHours;
      }
      return sum;
    }, 0);

    // Get team members count
    const teamMembers = await User.count({ where: { isActive: true } });

    const analytics = {
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
      },
      logs: {
        total: totalLogs,
        approved: approvedLogs,
        pending: pendingLogs,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHoursPerLog: totalLogs > 0 ? Math.round((totalHours / totalLogs) * 100) / 100 : 0
      },
      team: {
        totalMembers: teamMembers
      }
    };

    res.json({
      success: true,
      data: { analytics }
    });
  }

  /**
   * Get project analytics
   * @route GET /api/analytics/projects
   */
  async getProjectAnalytics(req, res) {
    const { startDate, endDate, managerId } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    }
    if (managerId) where.manager_id = managerId;

    const projects = await Project.findAll({
      where,
      include: [
        {
          model: Task,
          as: 'tasks',
          include: [
            {
              model: Log,
              as: 'logs'
            }
          ]
        },
        {
          model: Assignment,
          as: 'assignments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'name', 'email']
            }
          ]
        }
      ]
    });

    const projectAnalytics = projects.map(project => {
      const totalTasks = project.tasks.length;
      const completedTasks = project.tasks.filter(t => t.status === 'completed').length;
      const totalHours = project.tasks.reduce((sum, task) => {
        return sum + task.logs.reduce((taskSum, log) => {
          if (log.start_time && log.end_time) {
            const start = new Date(`2000-01-01T${log.start_time}`);
            const end = new Date(`2000-01-01T${log.end_time}`);
            const diffMs = end - start;
            const diffHours = diffMs / (1000 * 60 * 60);
            return taskSum + diffHours;
          }
          return taskSum;
        }, 0);
      }, 0);

      return {
        project_id: project.project_id,
        project_name: project.project_name,
        status: project.status,
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        totalHours: Math.round(totalHours * 100) / 100,
        teamSize: project.assignments.length,
        createdAt: project.createdAt
      };
    });

    res.json({
      success: true,
      data: { projects: projectAnalytics }
    });
  }

  /**
   * Get user analytics
   * @route GET /api/analytics/users
   */
  async getUserAnalytics(req, res) {
    const { startDate, endDate, role } = req.query;

    const where = { isActive: true };
    if (role) where.role = role;

    const users = await User.findAll({
      where,
      include: [
        {
          model: Task,
          as: 'createdTasks',
          where: startDate && endDate ? {
            createdAt: {
              [Op.between]: [startDate, endDate]
            }
          } : undefined,
          required: false
        },
        {
          model: Log,
          as: 'logs',
          where: startDate && endDate ? {
            created_at: {
              [Op.between]: [startDate, endDate]
            }
          } : undefined,
          required: false
        }
      ]
    });

    const userAnalytics = users.map(user => {
      const totalTasks = user.createdTasks.length;
      const completedTasks = user.createdTasks.filter(t => t.status === 'completed').length;
      const totalLogs = user.logs.length;
      const totalHours = user.logs.reduce((sum, log) => {
        if (log.start_time && log.end_time) {
          const start = new Date(`2000-01-01T${log.start_time}`);
          const end = new Date(`2000-01-01T${log.end_time}`);
          const diffMs = end - start;
          const diffHours = diffMs / (1000 * 60 * 60);
          return sum + diffHours;
        }
        return sum;
      }, 0);

      return {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalTasks,
        completedTasks,
        taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        totalLogs,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHoursPerLog: totalLogs > 0 ? Math.round((totalHours / totalLogs) * 100) / 100 : 0
      };
    });

    res.json({
      success: true,
      data: { users: userAnalytics }
    });
  }

  /**
   * Get timeline analytics
   * @route GET /api/analytics/timeline
   */
  async getTimelineAnalytics(req, res) {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeline = [];

    let current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      const dayStart = new Date(current);
      const dayEnd = new Date(current);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const [projects, tasks, logs] = await Promise.all([
        Project.count({
          where: {
            createdAt: {
              [Op.between]: [dayStart, dayEnd]
            }
          }
        }),
        Task.count({
          where: {
            createdAt: {
              [Op.between]: [dayStart, dayEnd]
            }
          }
        }),
        Log.count({
          where: {
            created_at: {
              [Op.between]: [dayStart, dayEnd]
            }
          }
        })
      ]);

      timeline.push({
        date: dateStr,
        projects,
        tasks,
        logs
      });

      current.setDate(current.getDate() + 1);
    }

    res.json({
      success: true,
      data: { timeline }
    });
  }

  /**
   * Get performance analytics
   * @route GET /api/analytics/performance
   */
  async getPerformanceAnalytics(req, res) {
    const { projectId, startDate, endDate } = req.query;

    const where = {};
    if (projectId) where.project_id = projectId;
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: Log,
          as: 'logs'
        }
      ]
    });

    const performanceData = tasks.map(task => {
      const totalHours = task.logs.reduce((sum, log) => {
        if (log.start_time && log.end_time) {
          const start = new Date(`2000-01-01T${log.start_time}`);
          const end = new Date(`2000-01-01T${log.end_time}`);
          const diffMs = end - start;
          const diffHours = diffMs / (1000 * 60 * 60);
          return sum + diffHours;
        }
        return sum;
      }, 0);

      const estimatedHours = task.estimate_time ? 
        parseInt(task.estimate_time.split(':')[0]) + parseInt(task.estimate_time.split(':')[1]) / 60 : 0;

      return {
        task_id: task.task_id,
        task_name: task.task_name,
        status: task.status,
        estimatedHours,
        actualHours: Math.round(totalHours * 100) / 100,
        variance: estimatedHours > 0 ? ((totalHours - estimatedHours) / estimatedHours) * 100 : 0,
        efficiency: estimatedHours > 0 ? (estimatedHours / totalHours) * 100 : 0
      };
    });

    const overallPerformance = {
      totalTasks: performanceData.length,
      completedTasks: performanceData.filter(t => t.status === 'completed').length,
      averageVariance: performanceData.length > 0 ? 
        performanceData.reduce((sum, t) => sum + t.variance, 0) / performanceData.length : 0,
      averageEfficiency: performanceData.length > 0 ? 
        performanceData.filter(t => t.efficiency > 0).reduce((sum, t) => sum + t.efficiency, 0) / 
        performanceData.filter(t => t.efficiency > 0).length : 0
    };

    res.json({
      success: true,
      data: {
        tasks: performanceData,
        overall: overallPerformance
      }
    });
  }
}

module.exports = new AnalyticsController();

