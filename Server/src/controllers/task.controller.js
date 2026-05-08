const { Task, Project, User, Log } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notification.service');

/**
 * Task Controller
 * Handles all task-related business logic
 */
class TaskController {
  /**
   * Get all tasks with pagination and filtering
   * @route GET /api/tasks
   */
  async getAllTasks(req, res) {
    const { page = 1, limit = 10, status, projectId, search, userId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (projectId) where.project_id = projectId;
    if (userId) where.created_by = userId;
    if (search) {
      where[Op.or] = [
        { task_name: { [Op.like]: `%${search}%` } },
        { task_details: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['user_id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        tasks,
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
   * Get tasks by project
   * @route GET /api/tasks/project/:projectId
   */
  async getTasksByProject(req, res) {
    const { projectId } = req.params;
    const { status, search } = req.query;

    const where = { project_id: projectId };
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { task_name: { [Op.like]: `%${search}%` } },
        { task_details: { [Op.like]: `%${search}%` } }
      ];
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: Log,
          as: 'logs',
          attributes: ['log_id', 'start_time', 'end_time', 'logdata', 'logstatus']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { tasks }
    });
  }

  /**
   * Get tasks created by current user
   * @route GET /api/tasks/user/created
   */
  async getUserCreatedTasks(req, res) {
    const { status, projectId } = req.query;

    const where = { created_by: req.user.user_id };
    if (status) where.status = status;
    if (projectId) where.project_id = projectId;

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'status']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: Log,
          as: 'logs',
          attributes: ['log_id', 'start_time', 'end_time', 'logdata', 'logstatus']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { tasks }
    });
  }

  /**
   * Get task by ID
   * @route GET /api/tasks/:id
   */
  async getTaskById(req, res) {
    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['project_id', 'project_name', 'status']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: Log,
          as: 'logs',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'name', 'email']
            }
          ],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  }

  /**
   * Create new task
   * @route POST /api/tasks
   */
  async createTask(req, res) {
    const { task_name, task_details, status, priority, estimate_time, projectId, assigned_to, due_date } = req.body;
    
    const processedDueDate = due_date === '' ? null : due_date;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project not found'
      });
    }

    const task = await Task.create({
      task_name,
      task_details,
      status,
      priority,
      estimate_time,
      assigned_to,
      dueDate: processedDueDate,
      project_id: projectId,
      created_by: req.user.user_id
    });

    logger.info(`Task "${task.task_name}" created by ${req.user.email}`);

    // Notify assigned user if present
    if (assigned_to) {
      try {
        await createNotification({
          recipientId: assigned_to,
          actorId: req.user.user_id,
          projectId: projectId,
          taskId: task.task_id,
          type: 'task_assigned',
          title: 'Task assigned',
          message: `You were assigned task ${task.task_name}`
        });
      } catch (e) { logger.error('Failed to notify task assignment', e); }
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  }

  /**
   * Update task
   * @route PUT /api/tasks/:id
   */
  async updateTask(req, res) {
    const { task_name, task_details, status, priority, estimate_time, assigned_to, due_date } = req.body;
    
    const processedDueDate = due_date === '' ? null : due_date;

    const task = await Task.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['user_id', 'name', 'email']
        }
      ]
    });
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.update({
      task_name,
      task_details,
      status,
      priority,
      estimate_time,
      assigned_to,
      dueDate: processedDueDate,
      updated_by: req.user.user_id
    });

    // Reload the task with associations
    await task.reload({
      include: [
        {
          model: User,
          as: 'assignedUser',
          attributes: ['user_id', 'name', 'email']
        }
      ]
    });

    logger.info(`Task "${task.task_name}" updated by ${req.user.email}`);

    // If assignment changed, notify new assignee
    if (assigned_to) {
      try {
        await createNotification({
          recipientId: assigned_to,
          actorId: req.user.user_id,
          projectId: task.project_id,
          taskId: task.task_id,
          type: 'task_reassigned',
          title: 'Task assigned/updated',
          message: `You were assigned on task ${task.task_name}`
        });
      } catch (e) { logger.error('Failed to notify task reassignment', e); }
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  }

  /**
   * Delete task
   * @route DELETE /api/tasks/:id
   */
  async deleteTask(req, res) {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.destroy();

    logger.info(`Task "${task.task_name}" deleted by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  }

  /**
   * Update task status
   * @route PATCH /api/tasks/:id/status
   */
  async updateTaskStatus(req, res) {
    const { status } = req.body;

    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.update({ 
      status,
      updated_by: req.user.user_id
    });

    logger.info(`Task "${task.task_name}" status updated to ${status} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Task status updated successfully',
      data: { task }
    });
  }

  /**
   * Bulk create tasks
   * @route POST /api/tasks/bulk
   */
  async bulkCreateTasks(req, res) {
    const { tasks, projectId } = req.body;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project not found'
      });
    }

    const createdTasks = [];
    const errors = [];

    for (const taskData of tasks) {
      try {
        const { task_name, task_details, status, estimate_time } = taskData;

        const task = await Task.create({
          task_name,
          task_details,
          status: status || 'pending',
          estimate_time,
          project_id: projectId,
          created_by: req.user.user_id
        });

        createdTasks.push(task);
      } catch (error) {
        errors.push(`Failed to create task "${taskData.task_name}": ${error.message}`);
      }
    }

    logger.info(`Bulk task creation for project "${project.project_name}" by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Bulk task creation completed',
      data: {
        tasks: createdTasks,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  }

  /**
   * Get task analytics
   * @route GET /api/tasks/analytics/overview
   */
  async getTaskAnalytics(req, res) {
    const { projectId, startDate, endDate } = req.query;

    const where = {};
    if (projectId) where.project_id = projectId;
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [startDate, endDate]
      };
    }

    const tasks = await Task.findAll({ where });

    const analytics = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0
    };

    res.json({
      success: true,
      data: { analytics }
    });
  }

  /**
   * Search tasks
   * @route GET /api/tasks/search
   */
  async searchTasks(req, res) {
    const { q, projectId, status, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const where = {
      [Op.or]: [
        { task_name: { [Op.like]: `%${q}%` } },
        { task_details: { [Op.like]: `%${q}%` } }
      ]
    };

    if (projectId) where.project_id = projectId;
    if (status) where.status = status;

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['project_id', 'project_name']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['user_id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { tasks }
    });
  }
}

module.exports = new TaskController();

