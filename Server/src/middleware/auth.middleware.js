const jwt = require('jsonwebtoken');
const { AuthenticationError, AuthorizationError, NotFoundError } = require('./error.middleware');
const { User } = require('../models');
const logger = require('../utils/logger');

// JWT token verification
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database - handle both userId and user_id
    const userId = decoded.userId || decoded.user_id;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    if (!user.isActive) {
      throw new AuthenticationError('User account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('Authentication required'));
    }

    // Check if user role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      logger.warn({
        message: 'Unauthorized access attempt',
        userId: req.user.user_id,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.originalUrl,
        method: req.method
      });
      
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

// Resource ownership check
const checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const resource = await model.findByPk(resourceId);

      if (!resource) {
        return next(new NotFoundError('Resource not found'));
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource or is assigned to it
      const isOwner = resource.userId === req.user.user_id || 
                     resource.createdBy === req.user.user_id ||
                     resource.assignedTo === req.user.user_id;

      if (!isOwner) {
        logger.warn({
          message: 'Unauthorized resource access attempt',
          userId: req.user.user_id,
          resourceId,
          resourceType: model.name,
          url: req.originalUrl,
          method: req.method
        });

        return next(new AuthorizationError('Access denied to this resource'));
      }

      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Project access check
const checkProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId || req.params.project_id;
    
    if (!projectId) {
      return next();
    }

    const { Project, Assignment } = require('../models');
    
    const project = await Project.findByPk(projectId, {
      include: [{
        model: Assignment,
        as: 'assignments',
        include: [{
          model: User,
          as: 'user',
          attributes: ['user_id', 'name', 'email']
        }]
      }]
    });

    if (!project) {
      return next(new NotFoundError('Project not found'));
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      req.project = project;
      return next();
    }

    // Manager can access their own projects
    if (req.user.role === 'manager' && project.manager_id === req.user.user_id) {
      req.project = project;
      return next();
    }

    // Check if user is assigned to the project
    const isAssigned = project.assignments.some(
      assignment => assignment.user.user_id === req.user.user_id
    );

    if (!isAssigned) {
      logger.warn({
        message: 'Unauthorized project access attempt',
        userId: req.user.user_id,
        projectId,
        url: req.originalUrl,
        method: req.method
      });

      return next(new AuthorizationError('Access denied to this project'));
    }

    req.project = project;
    next();
  } catch (error) {
    next(error);
  }
};

// Optional authentication (for public routes that can work with or without auth)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId || decoded.user_id;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Check if user is manager
const isManager = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'manager') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Manager privileges required.'
    });
  }
};

// Check if user is developer
const isDeveloper = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'developer') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Developer privileges required.'
    });
  }
};

module.exports = {
  authenticateToken,
  authorize,
  checkOwnership,
  checkProjectAccess,
  optionalAuth,
  isAdmin,
  isManager,
  isDeveloper
};
