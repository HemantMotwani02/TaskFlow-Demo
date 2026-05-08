const { Project, User, Task, Assignment, Log } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notification.service');

/**
 * Project Controller
 * Handles all project-related business logic
 */
class ProjectController {
  /**
   * Get all projects with pagination and filtering
   * @route GET /api/projects
   */
  async getAllProjects(req, res) {
    const { page = 1, limit = 10, status, managerId, search } = req.query;
    const offset = (page - 1) * limit;

    const where = { deleted_at: null };
    if (status) where.status = status;
    if (managerId) where.manager_id = managerId;
    if (search) {
      where[Op.or] = [
        { project_name: { [Op.like]: `%${search}%` } },
        { project_details: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: projects } = await Project.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['task_id', 'task_name', 'task_details', 'status', 'assigned_to'],
          include: [
            {
              model: User,
              as: 'assignedUser',
              attributes: ['user_id', 'name', 'email']
            }
          ]
        },
        {
          model: Assignment,
          as: 'assignments',
          where: { is_active: true },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              where: { role: 'developer' },
              required: false,
              attributes: ['user_id', 'name', 'email', 'role']
            }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    logger.info(`📋 Fetching projects - Found ${count} total projects`);
    projects.forEach(p => {
      logger.info(`   Project: "${p.project_name}" (ID: ${p.project_id}, manager_id: ${p.manager_id})`);
    });

    res.json({
      success: true,
      data: {
        projects,
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
   * Get project by ID
   * @route GET /api/projects/:id
   */
  async getProjectById(req, res) {
    const project = await Project.findOne({
      where: { 
        project_id: req.params.id,
        deleted_at: null 
      },
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['user_id', 'name', 'email', 'phone']
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['task_id', 'task_name', 'task_details', 'status', 'assigned_to', 'priority', 'dueDate', 'estimate_time'],
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
            }
          ]
        },
        {
          model: Assignment,
          as: 'assignments',
          where: { is_active: true },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'name', 'email', 'role']
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Transform assignments into team array for frontend compatibility
    const projectData = project.toJSON();
    logger.info(`🔍 Project ${req.params.id} - Found ${project.assignments?.length || 0} assignments`);
    logger.info(`📋 Project ${req.params.id} - Found ${project.tasks?.length || 0} tasks`);
    
    if (project.assignments) {
      projectData.team = project.assignments.map(assignment => ({
        user_id: assignment.user.user_id,
        id: assignment.user.user_id,
        name: assignment.user.name,
        email: assignment.user.email,
        role: assignment.user.role,
        assigned_at: assignment.assigned_at,
        assignment_id: assignment.assignment_id
      }));
      logger.info(`👥 Transformed ${projectData.team.length} assignments into team array:`, projectData.team);
    } else {
      projectData.team = [];
      logger.info('👥 No assignments found, setting empty team array');
    }
    
    if (project.tasks) {
      logger.info(`📋 Tasks data:`, project.tasks.map(task => ({
        id: task.task_id,
        name: task.task_name,
        status: task.status
      })));
    } else {
      logger.info('📋 No tasks found in project data');
    }

    res.json({
      success: true,
      data: { project: projectData }
    });
  }

  /**
   * Create new project
   * @route POST /api/projects
   */
  async createProject(req, res) {
    const { project_name, project_details, status, managerId } = req.body;

    // Verify manager exists
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager || !['admin', 'manager'].includes(manager.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager ID'
        });
      }
    }

    const project = await Project.create({
      project_name,
      project_details,
      status,
      manager_id: managerId || req.user.user_id,
      created_by: req.user.user_id
    });

    logger.info(`Project "${project.project_name}" created by ${req.user.email}`);

    // Notify the manager if creator assigned another manager
    if (managerId && managerId !== req.user.user_id) {
      try {
        await createNotification({
          recipientId: managerId,
          actorId: req.user.user_id,
          projectId: project.project_id,
          type: 'manager_assigned',
          title: 'Assigned as project manager',
          message: `You were assigned as manager to project ${project.project_name}`
        });
      } catch (e) { logger.error('Failed to notify manager assignment', e); }
    }

    // Fetch the full project with relationships
    const fullProject = await Project.findByPk(project.project_id, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: Task,
          as: 'tasks',
          attributes: ['task_id', 'task_name', 'task_details', 'status', 'assigned_to']
        },
        {
          model: Assignment,
          as: 'assignments',
          where: { is_active: true },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'name', 'email', 'role']
            }
          ]
        }
      ]
    });

    const projectJson = fullProject.toJSON();
    logger.info(`✅ Created project "${project.project_name}" (ID: ${project.project_id})`);
    logger.info(`   Manager ID: ${projectJson.manager_id}`);
    logger.info(`   Manager: ${projectJson.manager?.name} (${projectJson.manager?.email})`);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: { project: fullProject }
    });
  }

  /**
   * Update project
   * @route PUT /api/projects/:id
   */
  async updateProject(req, res) {
    const { project_name, project_details, status, managerId } = req.body;

    const project = await Project.findOne({
      where: { 
        project_id: req.params.id,
        deleted_at: null 
      }
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Verify manager exists if provided
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager || !['admin', 'manager'].includes(manager.role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid manager ID'
        });
      }
    }

    await project.update({
      project_name,
      project_details,
      status,
      manager_id: managerId,
      updated_by: req.user.user_id
    });

    logger.info(`Project "${project.project_name}" updated by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: { project }
    });
  }

  /**
   * Soft delete project
   * @route DELETE /api/projects/:id
   */
  async deleteProject(req, res) {
    const project = await Project.findOne({
      where: { 
        project_id: req.params.id,
        deleted_at: null 
      }
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.softDelete(req.user.user_id);

    logger.info(`Project "${project.project_name}" soft deleted by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  }

  /**
   * Get tasks for a specific project
   * @route GET /api/projects/:id/tasks
   */
  async getProjectTasks(req, res) {
    const projectId = req.params.id;
    const { status } = req.query;

    const where = { project_id: projectId };
    if (status) where.status = status;

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'name', 'email']
        },
        {
          model: Log,
          as: 'logs',
          attributes: ['log_id', 'start_time', 'end_time', 'logdata']
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
   * Get project analytics
   * @route GET /api/projects/:id/analytics
   */
  async getProjectAnalytics(req, res) {
    const projectId = req.params.id;

    const project = await Project.findOne({
      where: { 
        project_id: projectId,
        deleted_at: null 
      },
      include: [
        {
          model: Task,
          as: 'tasks',
          attributes: ['task_id', 'task_name', 'task_details', 'status', 'assigned_to', 'priority', 'dueDate', 'estimate_time'],
          include: [
            {
              model: User,
              as: 'assignedUser',
              attributes: ['user_id', 'name', 'email']
            },
            {
              model: Log,
              as: 'logs'
            }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Calculate analytics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(task => task.status === 'completed').length;
    const inProgressTasks = project.tasks.filter(task => task.status === 'in_progress').length;
    const pendingTasks = project.tasks.filter(task => task.status === 'todo').length;

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

    const totalEstimatedHours = project.tasks.reduce((sum, task) => sum + (task.estimate_time || 0), 0);

    const analytics = {
      projectId,
      projectName: project.project_name,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalHours,
      totalEstimatedHours,
      timeVariance: totalEstimatedHours > 0 ? ((totalHours - totalEstimatedHours) / totalEstimatedHours) * 100 : 0
    };

    res.json({
      success: true,
      data: { analytics }
    });
  }

  /**
   * Get developers not assigned to this project
   * @route GET /api/projects/:id/available-members
   */
  async getAvailableMembers(req, res) {
    const projectId = req.params.id;

    logger.info(`🔍 Fetching available developers for project ${projectId}...`);

    const assignedDeveloperIds = await Assignment.findAll({
      where: { 
        project_id: projectId,
        is_active: true
      },
      include: [
        {
          model: User,
          as: 'user',
          where: { role: 'developer' },
          attributes: ['user_id']
        }
      ],
      attributes: ['user_id']
    });

    const assignedDeveloperUserIds = assignedDeveloperIds.map(assignment => assignment.user_id);
    logger.info(`👥 Found ${assignedDeveloperUserIds.length} actively assigned developers`);

    const availableUsers = await User.findAll({
      where: {
        user_id: { [Op.notIn]: assignedDeveloperUserIds },
        isActive: true,
        role: 'developer'
      },
      attributes: ['user_id', 'name', 'email', 'role'],
      order: [['name', 'ASC']]
    });

    logger.info(`👥 Found ${availableUsers.length} available developers for assignment`);

    res.json({
      success: true,
      data: { users: availableUsers }
    });
  }

  /**
   * Get project members
   * @route GET /api/projects/:id/members
   */
  async getProjectMembers(req, res) {
    const { id } = req.params;
    
    const assignments = await Assignment.findAll({
      where: { 
        project_id: id,
        is_active: true
      },
      include: [
        {
          model: User,
          as: 'user',
          where: { role: 'developer' },
          required: false,
          attributes: ['user_id', 'name', 'email', 'role', 'phone', 'address']
        }
      ]
    });

    const members = assignments.map(assignment => ({
      ...assignment.user.dataValues,
      assignment_id: assignment.assignment_id,
      role_in_project: assignment.role
    }));

    res.json({
      success: true,
      data: { members }
    });
  }

  /**
   * Search tasks in project
   * @route GET /api/projects/:id/tasks/query
   */
  async searchProjectTasks(req, res) {
    const { id } = req.params;
    const { query, status } = req.query;
    
    const where = { project_id: id };
    if (status) where.status = status;
    if (query) {
      where[Op.or] = [
        { task_name: { [Op.like]: `%${query}%` } },
        { task_details: { [Op.like]: `%${query}%` } }
      ];
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['user_id', 'name', 'email']
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
   * Get project logs
   * @route GET /api/projects/:id/logs
   */
  async getProjectLogs(req, res) {
    const { id } = req.params;
    const { status, taskId } = req.query;
    
    const where = { project_id: id };
    if (status) where.logstatus = status;
    if (taskId) where.task_id = taskId;

    const logs = await Log.findAll({
      where,
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['task_id', 'task_name', 'task_details']
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
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
   * Get logs by task in project
   * @route GET /api/projects/:id/logs/task/:taskId
   */
  async getProjectLogsByTask(req, res) {
    const { id, taskId } = req.params;
    const { status } = req.query;
    
    const where = { 
      project_id: id,
      task_id: taskId
    };
    if (status) where.logstatus = status;

    const logs = await Log.findAll({
      where,
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['task_id', 'task_name', 'task_details']
        },
        {
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: { logs }
    });
  }
}

module.exports = new ProjectController();

