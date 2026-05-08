const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { validateUser } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/auth.controller');
const otpController = require('../controllers/otp.controller');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('📁 Multer destination called for:', file.originalname);
    const uploadDir = path.join(__dirname, '../public/uploads/profiles');
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    console.log('📝 Multer filename called for:', file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const userId = req.user ? req.user.user_id : 'unknown';
    cb(null, `profile-${userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 Multer fileFilter called:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });
    
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      console.log('✅ File accepted by multer');
      return cb(null, true);
    } else {
      console.log('❌ File rejected by multer:', { extname, mimetype });
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/auth/register
router.post('/register', validateUser.register, asyncHandler(authController.register.bind(authController)));

// POST /api/auth/login
router.post('/login', validateUser.login, asyncHandler(authController.login.bind(authController)));

// GET /api/auth/me
router.get('/me', authenticateToken, asyncHandler(authController.getMe.bind(authController)));

// PUT /api/auth/profile - Update user profile
router.put('/profile', authenticateToken, upload.single('profile_image'), asyncHandler(authController.updateProfile.bind(authController)));

// POST /api/auth/logout
router.post('/logout', authenticateToken, asyncHandler(authController.logout.bind(authController)));

// OTP Routes for Password Reset
// POST /api/auth/forgot-password - Send OTP to email
router.post('/forgot-password', otpController.sendOTP);

// POST /api/auth/verify-otp - Verify OTP code
router.post('/verify-otp', otpController.verifyOTP);

// POST /api/auth/reset-password - Reset password with verified OTP
router.post('/reset-password', otpController.resetPassword);

// POST /api/auth/resend-otp - Resend OTP
router.post('/resend-otp', otpController.resendOTP);

// POST /api/auth/refresh - Refresh token
router.post('/refresh', authenticateToken, asyncHandler(authController.refreshToken.bind(authController)));

// PUT /api/auth/profile-upload - Upload profile image
router.put('/profile-upload', authenticateToken, upload.single('profile_image'), asyncHandler(authController.uploadProfile.bind(authController)));

module.exports = router;
