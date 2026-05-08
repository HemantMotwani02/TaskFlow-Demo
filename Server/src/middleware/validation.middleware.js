const Joi = require('joi');
const { ValidationError } = require('./error.middleware');

// Custom Joi error messages
const customMessages = {
  'string.empty': '{{#label}} cannot be empty',
  'string.min': '{{#label}} must be at least {{#limit}} characters long',
  'string.max': '{{#label}} must not exceed {{#limit}} characters',
  'string.email': '{{#label}} must be a valid email address',
  'string.pattern.base': '{{#label}} format is invalid',
  'number.base': '{{#label}} must be a number',
  'number.min': '{{#label}} must be at least {{#limit}}',
  'number.max': '{{#label}} must not exceed {{#limit}}',
  'any.required': '{{#label}} is required',
  'any.only': '{{#label}} must be one of: {{#valids}}',
  'date.base': '{{#label}} must be a valid date',
  'date.future': '{{#label}} must be a future date',
  'date.past': '{{#label}} must be a past date'
};

// Validation schemas
const schemas = {
  // User validation
  user: {
    register: Joi.object({
      name: Joi.string().min(2).max(50).required().messages(customMessages),
      email: Joi.string().email().required().messages(customMessages),
      password: Joi.string().min(6).max(100).required().messages(customMessages),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        ...customMessages,
        'any.only': 'Passwords do not match'
      }),
      role: Joi.string().valid('admin', 'manager', 'developer').default('developer').messages(customMessages),
      phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().messages(customMessages),
      address: Joi.string().max(500).optional().messages(customMessages)
    }),

    create: Joi.object({
      name: Joi.string().min(2).max(50).required().messages(customMessages),
      email: Joi.string().email().required().messages(customMessages),
      password: Joi.string().min(6).max(100).required().messages(customMessages),
      role: Joi.string().valid('admin', 'manager', 'developer').default('developer').messages(customMessages),
      phone: Joi.string().max(500).optional().messages(customMessages),
      address: Joi.string().max(500).optional().messages(customMessages),
      isActive: Joi.boolean().default(true).messages(customMessages)
    }),

    login: Joi.object({
      email: Joi.string().email().required().messages(customMessages),
      password: Joi.string().required().messages(customMessages)
    }),

    update: Joi.object({
      name: Joi.string().min(2).max(50).optional().messages(customMessages),
      email: Joi.string().email().optional().messages(customMessages),
      phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional().messages(customMessages),
      address: Joi.string().max(500).optional().messages(customMessages),
      password: Joi.string().min(6).max(100).optional().messages(customMessages),
      confirmPassword: Joi.string().valid(Joi.ref('password')).optional().messages({
        ...customMessages,
        'any.only': 'Passwords do not match'
      })
    })
  },

  // Project validation
  project: {
    create: Joi.object({
      project_name: Joi.string().min(3).max(100).required().messages(customMessages),
      project_details: Joi.string().min(10).max(2000).required().messages(customMessages),
      managerId: Joi.number().integer().positive().optional().messages(customMessages),
      status: Joi.string().valid('planning', 'in_progress', 'completed', 'on_hold', 'cancelled').default('planning').messages(customMessages)
    }),

    update: Joi.object({
      project_name: Joi.string().min(3).max(100).optional().messages(customMessages),
      project_details: Joi.string().min(10).max(2000).optional().messages(customMessages),
      managerId: Joi.number().integer().positive().optional().messages(customMessages),
      status: Joi.string().valid('planning', 'in_progress', 'completed', 'on_hold', 'cancelled').optional().messages(customMessages)
    })
  },

  // Task validation
  task: {
    create: Joi.object({
      projectId: Joi.number().integer().positive().required().messages(customMessages),
      task_name: Joi.string().min(3).max(100).required().messages(customMessages),
      task_details: Joi.string().min(10).max(1000).required().messages(customMessages),
      status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').default('pending').messages(customMessages),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium').messages(customMessages),
      estimate_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required().messages(customMessages),
      assigned_to: Joi.number().integer().positive().allow(null).optional().messages(customMessages),
      due_date: Joi.date().allow('').optional().messages(customMessages)
    }),

    update: Joi.object({
      task_name: Joi.string().min(3).max(100).optional().messages(customMessages),
      task_details: Joi.string().min(10).max(1000).optional().messages(customMessages),
      status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').optional().messages(customMessages),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional().messages(customMessages),
      estimate_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages(customMessages),
      assigned_to: Joi.number().integer().positive().allow(null).optional().messages(customMessages),
      due_date: Joi.date().allow('').optional().messages(customMessages)
    })
  },

  // Log validation
  log: {
    create: Joi.object({
      taskId: Joi.number().integer().positive().required().messages(customMessages),
      projectId: Joi.number().integer().positive().required().messages(customMessages),
      logdata: Joi.string().min(3).max(1000).required().messages(customMessages),
      start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages(customMessages),
      end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages(customMessages),
      hours: Joi.number().integer().min(0).max(24).optional().messages(customMessages),
      minutes: Joi.number().integer().min(0).max(59).optional().messages(customMessages),
      date: Joi.string().optional().messages(customMessages)
    }).custom((value, helpers) => {
      const hasTimeFields = value.start_time && value.end_time;
      const hasDurationFields = value.hours !== undefined && value.minutes !== undefined;
      
      if (!hasTimeFields && !hasDurationFields) {
        return helpers.error('object.missing', {
          message: 'Either start_time/end_time or hours/minutes must be provided'
        });
      }
      
      return value;
    }),

    update: Joi.object({
      logdata: Joi.string().min(3).max(1000).optional().messages(customMessages),
      start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages(customMessages),
      end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional().messages(customMessages),
      logstatus: Joi.string().valid('pending', 'approved', 'rejected').optional().messages(customMessages)
    })
  },

  // Assignment validation
  assignment: {
    create: Joi.object({
      projectId: Joi.number().integer().positive().required().messages(customMessages),
      userId: Joi.number().integer().positive().required().messages(customMessages),
      role: Joi.string().valid('developer', 'designer', 'tester', 'reviewer').required().messages(customMessages)
    })
  },

  // Query parameters validation
  query: {
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1).messages(customMessages),
      limit: Joi.number().integer().min(1).max(100).default(10).messages(customMessages),
      sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'status').default('createdAt').messages(customMessages),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages(customMessages)
    }),

    search: Joi.object({
      q: Joi.string().min(1).max(100).optional().messages(customMessages),
      status: Joi.string().optional().messages(customMessages),
      role: Joi.string().valid('admin', 'manager', 'developer').optional().messages(customMessages),
      dateFrom: Joi.date().optional().messages(customMessages),
      dateTo: Joi.date().min(Joi.ref('dateFrom')).optional().messages(customMessages)
    }),

    users: Joi.object({
      page: Joi.number().integer().min(1).default(1).messages(customMessages),
      limit: Joi.number().integer().min(1).max(100).default(10).messages(customMessages),
      sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'status').default('createdAt').messages(customMessages),
      sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages(customMessages),
      q: Joi.string().min(1).max(100).optional().messages(customMessages),
      status: Joi.string().optional().messages(customMessages),
      role: Joi.string().valid('admin', 'manager', 'developer').optional().messages(customMessages),
      isActive: Joi.boolean().optional().messages(customMessages),
      dateFrom: Joi.date().optional().messages(customMessages),
      dateTo: Joi.date().min(Joi.ref('dateFrom')).optional().messages(customMessages)
    })
  }
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      const validationError = new ValidationError(errorMessage, error.details);
      return next(validationError);
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

// Specific validation middlewares
const validateUser = {
  register: validate(schemas.user.register),
  create: validate(schemas.user.create),
  login: validate(schemas.user.login),
  update: validate(schemas.user.update)
};

const validateProject = {
  create: validate(schemas.project.create),
  update: validate(schemas.project.update)
};

const validateTask = {
  create: validate(schemas.task.create),
  update: validate(schemas.task.update)
};

const validateLog = {
  create: validate(schemas.log.create),
  update: validate(schemas.log.update)
};

const validateAssignment = {
  create: validate(schemas.assignment.create)
};

const validateQuery = {
  pagination: validate(schemas.query.pagination, 'query'),
  search: validate(schemas.query.search, 'query'),
  users: validate(schemas.query.users, 'query')
};

module.exports = {
  validate,
  validateUser,
  validateProject,
  validateTask,
  validateLog,
  validateAssignment,
  validateQuery,
  schemas
};
