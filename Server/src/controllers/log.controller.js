const { Log, Task, Project, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notification.service');

/**
 * Log Controller
 * Handles all log-related business logic
 */
class LogController {
  /**
   * Get all logs with pagination and filtering
   * @route GET /api/logs
   */
  async getAllLogs(req, res) {
    const { page = 1, limit = 10, taskId, projectId, userId, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (taskId) where.task_id = taskId;
    if (projectId) where.project_id = projectId;
    if (userId) where.user_id = userId;
    if (status) where.logstatus = status;
    if (search) {
      where[Op.or] = [
        { logdata: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: logs } = await Log.findAndCountAll({
      where,
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['task_id', 'task_name', 'status']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    const serializedLogs = logs.map(log => log.toJSON());

    res.json({
      success: true,
      data: {
        logs: serializedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  }

  /**
   * Get log by ID
   * @route GET /api/logs/:id
   */
  async getLogById(req, res) {
    const log = await Log.findByPk(req.params.id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['task_id', 'task_name', 'status']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
        }
      ]
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.json({
      success: true,
      data: { log }
    });
  }

  /**
   * Create new log
   * @route POST /api/logs
   */
  async createLog(req, res) {
    const { taskId, projectId, logdata, start_time, end_time, hours, minutes, date } = req.body;

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(400).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Calculate time if not provided
    let calculatedStartTime = start_time;
    let calculatedEndTime = end_time;
    
    if (hours !== undefined && minutes !== undefined && !start_time && !end_time) {
      const now = new Date();
      calculatedStartTime = now.toTimeString().slice(0, 8);
      
      const endDate = new Date(now.getTime() + (hours * 60 + minutes) * 60 * 1000);
      calculatedEndTime = endDate.toTimeString().slice(0, 8);
    }

    const log = await Log.create({
      task_id: taskId,
      project_id: projectId,
      user_id: req.user.user_id,
      logdata,
      start_time: calculatedStartTime,
      end_time: calculatedEndTime,
      logstatus: 'pending'
    });

    logger.info(`Log created for task "${task.task_name}" by ${req.user.email}`);

    // Notify project manager when a log is added
    try {
      const projectFull = await Project.findByPk(projectId);
      if (projectFull && projectFull.manager_id) {
        await createNotification({
          recipientId: projectFull.manager_id,
          actorId: req.user.user_id,
          projectId: projectId,
          taskId: taskId,
          type: 'log_created',
          title: 'New work log added',
          message: `${req.user.email} added a log on task ${task.task_name}`
        });
      }
    } catch (e) { logger.error('Failed to notify manager about log', e); }

    res.status(201).json({
      success: true,
      message: 'Log created successfully',
      data: { log }
    });
  }

  /**
   * Update log
   * @route PUT /api/logs/:id
   */
  async updateLog(req, res) {
    const { logdata, start_time, end_time, logstatus } = req.body;

    const log = await Log.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    // Only allow users to update their own logs or admins/managers
    if (log.user_id !== req.user.user_id && ![1, 2].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own logs'
      });
    }

    await log.update({
      logdata,
      start_time,
      end_time,
      logstatus
    });

    logger.info(`Log updated by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Log updated successfully',
      data: { log }
    });
  }

  /**
   * Delete log
   * @route DELETE /api/logs/:id
   */
  async deleteLog(req, res) {
    const log = await Log.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    // Only allow users to delete their own logs or admins
    if (log.user_id !== req.user.user_id && req.user.role !== 1) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own logs'
      });
    }

    await log.destroy();

    logger.info(`Log deleted by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Log deleted successfully'
    });
  }

  /**
   * Get logs by task
   * @route GET /api/logs/task/:taskId
   */
  async getLogsByTask(req, res) {
    const { taskId } = req.params;
    const { status } = req.query;

    console.log('=== LOGS API DEBUG ===');
    console.log('Task ID from params:', taskId);
    console.log('Status from query:', status);
    console.log('User from token:', req.user);

    const where = { task_id: taskId };
    if (status) where.logstatus = status;

    console.log('Where clause:', where);

    const totalLogs = await Log.count({ where: { task_id: taskId } });
    console.log('Total logs for task_id', taskId, ':', totalLogs);

    const logs = await Log.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    console.log('Found logs count:', logs.length);
    
    if (logs.length > 0) {
      console.log('Log listing API - first log raw:', logs[0].get());
      console.log('Log listing API - first log toJSON:', logs[0].toJSON());
    } else {
      console.log('No logs found for task_id:', taskId);
    }

    const serializedLogs = logs.map(log => log.toJSON());
    console.log('=== END LOGS API DEBUG ===');

    res.json({
      success: true,
      data: { logs: serializedLogs }
    });
  }

  /**
   * Get current user's logs
   * @route GET /api/logs/user/me
   */
  async getUserLogs(req, res) {
    const { startDate, endDate, projectId, taskId, status } = req.query;

    const where = { user_id: req.user.user_id };
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }
    if (projectId) where.project_id = projectId;
    if (taskId) where.task_id = taskId;
    if (status) where.logstatus = status;

    const logs = await Log.findAll({
      where,
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['task_id', 'task_name', 'status']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'status']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { logs }
    });
  }

  /**
   * Approve log
   * @route POST /api/logs/:id/approve
   */
  async approveLog(req, res) {
    const log = await Log.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    await log.update({
      approved_by: req.user.user_id,
      logstatus: 'approved'
    });

    logger.info(`Log approved by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Log approved successfully',
      data: { log }
    });
  }

  /**
   * Reject log
   * @route POST /api/logs/:id/reject
   */
  async rejectLog(req, res) {
    const { reason } = req.body;
    
    const log = await Log.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    await log.update({
      approved_by: req.user.user_id,
      logstatus: 'rejected',
      rejection_reason: reason
    });

    logger.info(`Log rejected by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Log rejected successfully',
      data: { log }
    });
  }

  /**
   * Update log status
   * @route PATCH /api/logs/:id/status
   */
  async updateLogStatus(req, res) {
    const { logstatus } = req.body;

    const log = await Log.findByPk(req.params.id);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    // Only allow users to update their own logs or admins/managers
    if (log.user_id !== req.user.user_id && ![1, 2].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own logs'
      });
    }

    await log.update({
      logstatus,
      updated_by: req.user.user_id
    });

    logger.info(`Log status updated to ${logstatus} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Log status updated successfully',
      data: { log }
    });
  }

  /**
   * Get log analytics
   * @route GET /api/logs/analytics/overview
   */
  async getLogAnalytics(req, res) {
    const { projectId, taskId, startDate, endDate, userId } = req.query;

    const where = {};
    if (projectId) where.project_id = projectId;
    if (taskId) where.task_id = taskId;
    if (userId) where.user_id = userId;
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [startDate, endDate]
      };
    }

    const logs = await Log.findAll({ where });

    // Calculate total hours
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

    const analytics = {
      total: logs.length,
      pending: logs.filter(l => l.logstatus === 'pending').length,
      approved: logs.filter(l => l.logstatus === 'approved').length,
      rejected: logs.filter(l => l.logstatus === 'rejected').length,
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerLog: logs.length > 0 ? Math.round((totalHours / logs.length) * 100) / 100 : 0
    };

    res.json({
      success: true,
      data: { analytics }
    });
  }

  /**
   * Bulk create logs
   * @route POST /api/logs/bulk
   */
  async bulkCreateLogs(req, res) {
    const { logs } = req.body;

    const createdLogs = [];
    const errors = [];

    for (const logData of logs) {
      try {
        const { taskId, projectId, logdata, start_time, end_time, hours, minutes, date } = logData;

        // Verify task exists
        const task = await Task.findByPk(taskId);
        if (!task) {
          errors.push(`Task with ID ${taskId} not found`);
          continue;
        }

        // Verify project exists
        const project = await Project.findByPk(projectId);
        if (!project) {
          errors.push(`Project with ID ${projectId} not found`);
          continue;
        }

        const log = await Log.create({
          task_id: taskId,
          project_id: projectId,
          user_id: req.user.user_id,
          logdata,
          start_time,
          end_time,
          logstatus: 'pending',
          date: date || new Date().toISOString().split('T')[0]
        });

        createdLogs.push(log);
      } catch (error) {
        errors.push(`Failed to create log: ${error.message}`);
      }
    }

    logger.info(`Bulk log creation by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Bulk log creation completed',
      data: {
        logs: createdLogs,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  }
}

module.exports = new LogController();

