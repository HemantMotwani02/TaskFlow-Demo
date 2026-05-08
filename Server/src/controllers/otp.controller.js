const { User, OTP } = require('../models');
const { asyncHandler } = require('../middleware/error.middleware');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * Send OTP to user's email for password reset
 * POST /api/auth/forgot-password
 */
const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Check if user exists
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email address'
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account is deactivated. Please contact support.'
    });
  }

  // Generate 6-digit OTP
  const otpCode = OTP.generateOTPCode();

  // Set expiry time to 10 minutes from now
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Delete any existing OTPs for this email
  await OTP.destroy({ where: { email } });

  // Create new OTP record
  await OTP.create({
    email,
    otp_code: otpCode,
    expires_at: expiresAt,
    is_verified: false
  });

  // Send OTP via email
  try {
    await emailService.sendOTPEmail(email, otpCode, 10);
    
    logger.info(`OTP sent to ${email}`);
    
    res.json({
      success: true,
      message: 'OTP sent successfully to your email',
      data: {
        email,
        expiresIn: '10 minutes'
      }
    });
  } catch (error) {
    logger.error('Failed to send OTP email:', error);
    
    // Delete the OTP if email sending failed
    await OTP.destroy({ where: { email, otp_code: otpCode } });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please check your email configuration or try again later.'
    });
  }
});

/**
 * Verify OTP code
 * POST /api/auth/verify-otp
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp_code } = req.body;

  // Validate input
  if (!email || !otp_code) {
    return res.status(400).json({
      success: false,
      message: 'Email and OTP code are required'
    });
  }

  // Validate OTP format (6 digits)
  if (!/^\d{6}$/.test(otp_code)) {
    return res.status(400).json({
      success: false,
      message: 'OTP must be a 6-digit number'
    });
  }

  // Find valid OTP
  const otp = await OTP.findValidOTP(email, otp_code);

  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP code'
    });
  }

  // Mark OTP as verified (but don't delete it yet - we'll delete it after password reset)
  await otp.update({ is_verified: true });

  logger.info(`OTP verified for ${email}`);

  res.json({
    success: true,
    message: 'OTP verified successfully',
    data: {
      email,
      verified: true
    }
  });
});

/**
 * Reset password after OTP verification
 * POST /api/auth/reset-password
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp_code, new_password, confirm_password } = req.body;

  // Validate input
  if (!email || !otp_code || !new_password || !confirm_password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }

  // Check if passwords match
  if (new_password !== confirm_password) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  // Validate password length
  if (new_password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  // Find the OTP
  const otp = await OTP.findOne({
    where: {
      email,
      otp_code,
      is_verified: true
    },
    order: [['created_at', 'DESC']]
  });

  if (!otp) {
    return res.status(400).json({
      success: false,
      message: 'Invalid OTP or OTP not verified. Please verify OTP first.'
    });
  }

  // Check if OTP is expired
  if (otp.isExpired()) {
    await OTP.destroy({ where: { email } });
    return res.status(400).json({
      success: false,
      message: 'OTP has expired. Please request a new one.'
    });
  }

  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Update user's password
  await user.update({ password: new_password });

  // Delete all OTPs for this email
  await OTP.destroy({ where: { email } });

  // Send confirmation email
  try {
    await emailService.sendPasswordResetConfirmation(email, user.name);
  } catch (error) {
    logger.warn(`Failed to send password reset confirmation to ${email}:`, error);
    // Don't fail the request if confirmation email fails
  }

  logger.info(`Password reset successful for ${email}`);

  res.json({
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.'
  });
});

/**
 * Resend OTP
 * POST /api/auth/resend-otp
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Check if user exists
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'No account found with this email address'
    });
  }

  // Check if there's a recent OTP (within last 1 minute)
  const recentOTP = await OTP.findOne({
    where: {
      email,
      created_at: {
        [require('sequelize').Op.gte]: new Date(Date.now() - 60000) // 1 minute ago
      }
    }
  });

  if (recentOTP) {
    return res.status(429).json({
      success: false,
      message: 'Please wait 1 minute before requesting a new OTP'
    });
  }

  // Generate new OTP
  const otpCode = OTP.generateOTPCode();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // Delete old OTPs
  await OTP.destroy({ where: { email } });

  // Create new OTP
  await OTP.create({
    email,
    otp_code: otpCode,
    expires_at: expiresAt,
    is_verified: false
  });

  // Send OTP via email
  try {
    await emailService.sendOTPEmail(email, otpCode, 10);
    
    logger.info(`OTP resent to ${email}`);
    
    res.json({
      success: true,
      message: 'New OTP sent successfully to your email',
      data: {
        email,
        expiresIn: '10 minutes'
      }
    });
  } catch (error) {
    logger.error('Failed to resend OTP email:', error);
    
    await OTP.destroy({ where: { email, otp_code: otpCode } });
    
    return res.status(500).json({
      success: false,
      message: 'Failed to send OTP. Please try again later.'
    });
  }
});

module.exports = {
  sendOTP,
  verifyOTP,
  resetPassword,
  resendOTP
};

