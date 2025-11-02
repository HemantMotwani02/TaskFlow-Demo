const { User, Project, Task, Assignment } = require('../models');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

/**
 * User Controller
 * Handles all user-related business logic
 */
class UserController {
  /**
   * Get all users with pagination and filtering
   * @route GET /api/users
   */
  async getAllUsers(req, res) {
    const { page = 1, limit = 10, role, isActive, q } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    if (q) {
      where[Op.or] = [
        { name: { [Op.like]: `%${q}%` } },
        { email: { [Op.like]: `%${q}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users,
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
   * Get user role counts
   * @route GET /api/users/counts
   */
  async getUserCounts(req, res) {
    try {
      const totalCount = await User.count();
      const adminCount = await User.count({ where: { role: 'admin' } });
      const managerCount = await User.count({ where: { role: 'manager' } });
      const developerCount = await User.count({ where: { role: 'developer' } });
      
      res.json({
        success: true,
        data: {
          total: totalCount,
          admins: adminCount,
          managers: managerCount,
          developers: developerCount
        }
      });
    } catch (error) {
      logger.error('❌ Error fetching user counts:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching user counts',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get team members for current user's projects
   * @route GET /api/users/team/members
   */
  async getTeamMembers(req, res) {
    const user = await User.findByPk(req.user.user_id, {
      include: [
        {
          model: Assignment,
          as: 'assignments',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'name', 'email', 'role', 'phone']
            }
          ]
        }
      ]
    });

    const teamMembers = user.assignments.map(assignment => assignment.user);
    const uniqueTeamMembers = [...new Map(teamMembers.map(member => [member.user_id, member])).values()];

    res.json({
      success: true,
      data: {
        teamMembers: uniqueTeamMembers
      }
    });
  }

  /**
   * Get all managers
   * @route GET /api/users/managers
   */
  async getManagers(req, res) {
    try {
      logger.info('🔍 Fetching potential managers...');
      
      let managers = await User.findAll({ 
        where: { role: 'manager', isActive: true },
        attributes: ['user_id', 'name', 'email', 'role']
      });
      
      logger.info(`👥 Found ${managers.length} users with role 'manager'`);
      
      if (managers.length === 0) {
        logger.info('🔍 No managers found, including developers as potential managers...');
        const developers = await User.findAll({ 
          where: { role: 'developer', isActive: true },
          attributes: ['user_id', 'name', 'email', 'role']
        });
        
        logger.info(`👥 Found ${developers.length} users with role 'developer'`);
        managers = [...managers, ...developers];
      }
      
      if (managers.length === 0) {
        logger.info('🔍 No potential managers found, getting all active users...');
        managers = await User.findAll({ 
          where: { isActive: true },
          attributes: ['user_id', 'name', 'email', 'role']
        });
        logger.info(`👥 Found ${managers.length} total active users`);
      }
      
      logger.info(`👥 Final managers list:`, managers.map(m => ({ 
        id: m.user_id, 
        name: m.name, 
        email: m.email, 
        role: m.role 
      })));
      
      res.json({
        success: true,
        data: { managers }
      });
    } catch (error) {
      logger.error('❌ Error in managers endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching managers',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get managers list
   * @route GET /api/users/managers/list
   */
  async getManagersList(req, res) {
    const managers = await User.findManagers();

    res.json({
      success: true,
      data: { managers }
    });
  }

  /**
   * Get user by ID
   * @route GET /api/users/:id
   */
  async getUserById(req, res) {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Project,
          as: 'managedProjects',
          attributes: ['project_id', 'project_name', 'status']
        },
        {
          model: Task,
          as: 'createdTasks',
          attributes: ['task_id', 'task_name', 'status', 'estimate_time']
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  }

  /**
   * Update user
   * @route PUT /api/users/:id
   */
  async updateUser(req, res) {
    const { name, email, phone, address, role } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email is already taken'
        });
      }
    }

    await user.update({
      name,
      email,
      phone,
      address,
      role
    });

    logger.info(`User ${user.email} updated by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: user.toJSON()
      }
    });
  }

  /**
   * Delete user
   * @route DELETE /api/users/:id
   */
  async deleteUser(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await user.destroy();

    logger.info(`User ${user.email} deleted by ${req.user.email}`);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  }

  /**
   * Create new user
   * @route POST /api/users
   */
  async createUser(req, res) {
    const { name, email, password, role, phone, address, isActive } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email is already taken'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'developer',
      phone,
      address,
      isActive: isActive !== undefined ? isActive : true,
      created_by: req.user.user_id
    });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    logger.info(`User ${user.email} created by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user: userResponse }
    });
  }
}

module.exports = new UserController();

