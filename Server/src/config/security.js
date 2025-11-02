const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security configuration
const securityConfig = {
  // Helmet configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    frameguard: { action: 'deny' }
  },

  // Rate limiting configuration
  rateLimit: {
    // General rate limiting
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },

    // Authentication rate limiting
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: {
        success: false,
        message: 'Too many authentication attempts, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    },

    // API rate limiting
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // limit each IP to 200 requests per windowMs
      message: {
        success: false,
        message: 'API rate limit exceeded, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false
    }
  },

  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400 // 24 hours
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    expiresIn: '24h',
    refreshExpiresIn: '7d',
    issuer: 'taskflow-api',
    audience: 'taskflow-client'
  },

  // Password configuration
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    saltRounds: 12
  },

  // File upload configuration
  fileUpload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif'],
    uploadPath: 'uploads/profiles',
    generateUniqueNames: true
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    }
  },

  // Database security
  database: {
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4'
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'combined',
    maxFiles: 5,
    maxSize: '10m'
  },

  // Environment-specific settings
  environment: {
    development: {
      cors: {
        origin: 'http://localhost:5173',
        credentials: true
      },
      logging: {
        level: 'debug'
      }
    },
    production: {
      cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
      },
      logging: {
        level: 'warn'
      },
      helmet: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
          }
        }
      }
    }
  }
};

// Create rate limiters
const createRateLimiters = () => {
  return {
    general: rateLimit(securityConfig.rateLimit.general),
    auth: rateLimit(securityConfig.rateLimit.auth),
    api: rateLimit(securityConfig.rateLimit.api)
  };
};

// Create helmet configuration
const createHelmetConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const config = securityConfig.environment[env]?.helmet || securityConfig.helmet;
  
  return helmet(config);
};

// Password validation
const validatePassword = (password) => {
  const { minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars } = securityConfig.password;
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// File validation
const validateFile = (file) => {
  const { maxFileSize, allowedMimeTypes, allowedExtensions } = securityConfig.fileUpload;
  
  const errors = [];
  
  if (file.size > maxFileSize) {
    errors.push(`File size must be less than ${maxFileSize / (1024 * 1024)}MB`);
  }
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    errors.push('File type not allowed');
  }
  
  const extension = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    errors.push('File extension not allowed');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generate secure filename
const generateSecureFilename = (originalname, userId) => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = originalname.substring(originalname.lastIndexOf('.'));
  return `profile-${userId}-${timestamp}-${random}${extension}`;
};

module.exports = {
  securityConfig,
  createRateLimiters,
  createHelmetConfig,
  validatePassword,
  validateFile,
  generateSecureFilename
};
