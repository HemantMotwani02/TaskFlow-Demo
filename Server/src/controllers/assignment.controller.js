const { Assignment, Project, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const { createNotification } = require('../utils/notification.service');

/**
 * Assignment Controller
 * Handles all assignment-related business logic
 */
class AssignmentController {
  /**
   * Get all assignments with pagination and filtering
   * @route GET /api/assignments
   */
  async getAllAssignments(req, res) {
    const { page = 1, limit = 10, projectId, userId, role, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows: assignments } = await Assignment.findAndCountAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['assignedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        assignments,
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
   * Get assignment by ID
   * @route GET /api/assignments/:id
   */
  async getAssignmentById(req, res) {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'priority']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'phone']
        }
      ]
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    res.json({
      success: true,
      data: { assignment }
    });
  }

  /**
   * Create new assignment
   * @route POST /api/assignments
   */
  async createAssignment(req, res) {
    const { projectId, userId, role } = req.body;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Only allow assigning developers to projects
    if (user.role !== 'developer') {
      return res.status(400).json({
        success: false,
        message: 'Only developers can be assigned to projects'
      });
    }

    // Check if assignment already exists and is active
    const existingAssignment = await Assignment.findOne({
      where: {
        project_id: projectId,
        user_id: userId,
        is_active: true
      }
    });

    if (existingAssignment) {
      return res.status(409).json({
        success: false,
        message: 'User is already assigned to this project'
      });
    }

    const assignment = await Assignment.create({
      project_id: projectId,
      user_id: userId,
      manager_id: project.manager_id || req.user.user_id,
      assigned_at: new Date(),
      is_active: true
    });

    logger.info(`User ${user.email} assigned to project "${project.name}" by ${req.user.email}`);

    // Notify the assigned developer
    try {
      const notification = await createNotification({
        recipientId: user.user_id,
        actorId: req.user.user_id,
        projectId: project.project_id || project.id,
        type: 'project_assigned',
        title: 'Added to project',
        message: `You were added to project ${project.project_name || project.name}`
      });
      logger.info(`Notification created successfully for user ${user.user_id}:`, notification.notification_id);
    } catch (e) { 
      logger.error('Failed to create assignment notification:', e.message, e.stack); 
    }

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: { assignment }
    });
  }

  /**
   * Update assignment
   * @route PUT /api/assignments/:id
   */
  async updateAssignment(req, res) {
    const { role, isActive } = req.body;

    const assignment = await Assignment.findByPk(req.params.id);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    await assignment.update({
      role,
      isActive
    });

    logger.info(`Assignment updated by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      data: { assignment }
    });
  }

  /**
   * Remove assignment
   * @route DELETE /api/assignments/:id
   */
  async deleteAssignment(req, res) {
    const assignment = await Assignment.findByPk(req.params.id, {
      include: [{
        model: Project,
        as: 'project',
        attributes: ['project_id', 'manager_id']
      }]
    });
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if user is admin, manager of the project, or the assigned user themselves
    const isAdmin = req.user.role === 'admin';
    const isProjectManager = req.user.role === 'manager' && assignment.project.manager_id === req.user.user_id;
    const isAssignedUser = assignment.user_id === req.user.user_id;

    if (!isAdmin && !isProjectManager && !isAssignedUser) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to remove this assignment'
      });
    }

    await assignment.update({ is_active: false });

    logger.info(`Assignment deactivated by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Assignment removed successfully'
    });
  }

  /**
   * Get assignments by project
   * @route GET /api/assignments/project/:projectId
   */
  async getAssignmentsByProject(req, res) {
    const { projectId } = req.params;
    const { role, isActive } = req.query;

    const where = { projectId };
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const assignments = await Assignment.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'phone']
        }
      ],
      order: [['assignedAt', 'ASC']]
    });

    res.json({
      success: true,
      data: { assignments }
    });
  }

  /**
   * Get current user's assignments
   * @route GET /api/assignments/user/me
   */
  async getUserAssignments(req, res) {
    const { isActive } = req.query;

    const where = { userId: req.user.id };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const assignments = await Assignment.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'status', 'priority', 'startDate', 'endDate']
        }
      ],
      order: [['assignedAt', 'DESC']]
    });

    res.json({
      success: true,
      data: { assignments }
    });
  }

  /**
   * Bulk assign users to project
   * @route POST /api/assignments/bulk
   */
  async bulkAssign(req, res) {
    const { projectId, assignments } = req.body;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: 'Project not found'
      });
    }

    const createdAssignments = [];
    const errors = [];

    for (const assignmentData of assignments) {
      try {
        const { userId, role } = assignmentData;

        // Verify user exists
        const user = await User.findByPk(userId);
        if (!user) {
          errors.push(`User with ID ${userId} not found`);
          continue;
        }

        // Only allow assigning developers to projects
        if (user.role !== 'developer') {
          errors.push(`User ${user.email} cannot be assigned to projects (only developers allowed)`);
          continue;
        }

        // Check if assignment already exists
        const existingAssignment = await Assignment.findOne({
          where: {
            project_id: projectId,
            user_id: userId
          }
        });

        if (existingAssignment) {
          errors.push(`User ${user.email} is already assigned to this project`);
          continue;
        }

        const assignment = await Assignment.create({
          project_id: projectId,
          user_id: userId,
          manager_id: project.manager_id || req.user.user_id,
          assigned_at: new Date()
        });

        createdAssignments.push(assignment);
      } catch (error) {
        errors.push(`Failed to assign user: ${error.message}`);
      }
    }

    logger.info(`Bulk assignment to project "${project.name}" by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Bulk assignment completed',
      data: {
        createdAssignments,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  }
}

module.exports = new AssignmentController();

