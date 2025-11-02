const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const projectRoutes = require('./routes/project.routes');
const taskRoutes = require('./routes/task.routes');
const logRoutes = require('./routes/log.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const notificationRoutes = require('./routes/notification.routes');
const meetingRoutes = require('./routes/meeting.routes');

// Import middleware
const { authenticateToken } = require('./middleware/auth.middleware');
const { asyncHandler, errorHandler, notFoundHandler } = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/logger.middleware');

// Import database connection
const { sequelize } = require('./config/database');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:7007"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// Environment-based rate limiting configuration
const isDevelopment = process.env.NODE_ENV === 'development';

// Skip rate limiting in development if DISABLE_RATE_LIMIT is set
if (isDevelopment && process.env.DISABLE_RATE_LIMIT === 'true') {
  console.log('⚠️ Rate limiting disabled for development');
} else {
  // Rate limiting - Environment-aware configuration
  const limiter = rateLimit({
    windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
    max: isDevelopment ? 500 : 100, // 500 requests dev, 100 requests prod
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests to avoid blocking legitimate users
    skipSuccessfulRequests: true,
    // Allow some failed requests to avoid blocking during errors
    skipFailedRequests: false
  });

  // Apply rate limiting to all routes
  app.use(limiter);

  // Stricter rate limiting for auth routes - Environment-aware
  const authLimiter = rateLimit({
    windowMs: isDevelopment ? 1 * 60 * 1000 : 15 * 60 * 1000, // 1 min dev, 15 min prod
    max: isDevelopment ? 50 : 5, // 50 requests dev, 5 requests prod
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  });

  // Store authLimiter for later use (after body parsing middleware)
  app.locals.authLimiter = authLimiter;
}

// Compression middleware
app.use(compression());

// Simple file upload setup
const multer = require('multer');
const fs = require('fs');
const fsPromises = require('fs').promises;

// Simple multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public/uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `profile-${req.user.user_id}-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : (process.env.FRONTEND_URL || 'http://localhost:5173'),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Mount auth routes with JSON parsing for login/register, but before global JSON parsing
if (app.locals.authLimiter) {
  app.use('/api/auth', app.locals.authLimiter, express.json({ limit: '10mb' }), authRoutes);
} else {
  app.use('/api/auth', express.json({ limit: '10mb' }), authRoutes);
}

// Special route for file uploads that bypasses JSON parsing
// File upload configuration
const uploadStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'public/uploads/profiles');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user ? req.user.user_id : 'unknown';
    cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadHandler = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    console.log('🔍 MULTER FILTER - File info:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    console.log('🔍 MULTER FILTER - Validation:', { extname, mimetype });
    
    if (mimetype && extname) {
      console.log('✅ File accepted by multer');
      return cb(null, true);
    } else {
      console.log('❌ File rejected by multer');
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Test route to see if requests are reaching the server
app.put('/api/test-upload', authenticateToken, (req, res) => {
  console.log('🧪 TEST ROUTE HIT!');
  console.log('Content-Type:', req.get('Content-Type'));
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  res.json({ success: true, message: 'Test route reached' });
});

// Direct file upload route that bypasses all other middleware
app.put('/api/upload-profile', authenticateToken, (req, res, next) => {
  console.log('🔍 BEFORE MULTER - Content-Type:', req.get('Content-Type'));
  console.log('🔍 BEFORE MULTER - Headers:', req.headers);
  console.log('🔍 BEFORE MULTER - Method:', req.method);
  console.log('🔍 BEFORE MULTER - URL:', req.url);
  next();
}, uploadHandler.single('profile_image'), async (req, res) => {
  try {
    console.log('🚀 DIRECT UPLOAD ROUTE HIT!');
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('File:', req.file);
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    console.log('Body keys:', Object.keys(req.body || {}));
    console.log('User ID:', req.user ? req.user.user_id : 'No user');
    console.log('Request headers:', req.headers);
    
    const { User } = require('./models');
    const user = await User.findByPk(req.user.user_id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let profileImagePath = user.profile;
    
    if (req.file) {
      console.log('📁 File uploaded:', req.file.filename);
      console.log('📁 File path:', req.file.path);
      console.log('📁 File size:', req.file.size);
      
      // Delete old profile image if exists
      if (profileImagePath && profileImagePath !== 'No File' && profileImagePath !== '') {
        const oldImagePath = path.join(__dirname, 'public', profileImagePath);
        try {
          await fsPromises.access(oldImagePath);
          await fsPromises.unlink(oldImagePath);
          console.log('🗑️ Old image deleted:', oldImagePath);
        } catch (error) {
          console.log('Old image not found or already deleted:', error.message);
        }
      }
      
      profileImagePath = `/uploads/profiles/${req.file.filename}`;
      console.log('📁 New profile path:', profileImagePath);
    } else {
      console.log('❌ No file uploaded');
    }

    // Parse form data
    let updateData = {};
    if (req.body && req.body.updates) {
      try {
        updateData = JSON.parse(req.body.updates);
      } catch (error) {
        console.error('Failed to parse updates:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid updates data format'
        });
      }
    }

    // Update user
    const userUpdateData = {
      name: updateData.name || user.name,
      email: updateData.email || user.email,
      profile: profileImagePath
    };

    await user.update(userUpdateData);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        success: true,
        data: {
          user: user.toJSON()
        }
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// JSON parsing middleware (after file upload routes)
app.use(express.json({ limit: '10mb' }));

// URL-encoded parsing
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Create a separate multer instance for parsing form fields
const formParser = multer();

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/uploads/profiles', express.static(path.join(__dirname, 'public/uploads/profiles')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/meetings', meetingRoutes);

// Legacy endpoint support for old frontend URLs
app.get('/project-details-members/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    // Redirect to new API endpoint
    res.redirect(`/api/projects/${projectId}/members`);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/project-details-project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    // Redirect to new API endpoint
    res.redirect(`/api/projects/${projectId}`);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/project-details-task/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { val } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    // Redirect to new API endpoint
    const url = val ? `/api/projects/${projectId}/tasks?status=${val}` : `/api/projects/${projectId}/tasks`;
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/project-details-task/query/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { query } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    // Redirect to new API endpoint
    res.redirect(`/api/projects/${projectId}/tasks/query?query=${query}`);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/project-details-log/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    // Redirect to new API endpoint
    res.redirect(`/api/projects/${projectId}/logs`);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/project-details-logByTask/:projectId/:taskId', async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    const { selectedVal } = req.query;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }

    // Redirect to new API endpoint
    const url = selectedVal ? `/api/projects/${projectId}/logs/task/${taskId}?status=${selectedVal}` : `/api/projects/${projectId}/logs/task/${taskId}`;
    res.redirect(url);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  sequelize.close().then(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  sequelize.close().then(() => {
    console.log('Database connection closed');
    process.exit(0);
  });
});

module.exports = app;
