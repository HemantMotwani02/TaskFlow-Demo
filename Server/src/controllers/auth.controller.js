const { User, PermissionGroup } = require('../models');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs').promises;
const { SYSTEM_GROUPS } = require('../constants/permissions');

/**
 * Auth Controller
 * Handles all authentication-related business logic
 */
class AuthController {
  /**
   * Register new user
   * @route POST /api/auth/register
   */
  async register(req, res) {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing or invalid'
      });
    }

    const { name, email, password, role = 3, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const defaultGroup = await PermissionGroup.findOne({ where: { is_default: true } });
    const adminGroup = await PermissionGroup.findOne({ where: { name: SYSTEM_GROUPS.ADMIN_FULL_ACCESS } });
    const resolvedRole = role || 'developer';

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: resolvedRole,
      phone,
      address,
      created_by: 1,
      permission_group_id: resolvedRole === 'admin'
        ? (adminGroup ? adminGroup.permission_group_id : null)
        : (defaultGroup ? defaultGroup.permission_group_id : null)
    });

    // Generate token
    const token = user.generateAuthToken();

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });
  }

  /**
   * Login user
   * @route POST /api/auth/login
   */
  async login(req, res) {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing or invalid'
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Generate token
    const token = user.generateAuthToken();

    logger.info(`User ${user.email} logged in successfully`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toJSON(),
        token
      }
    });
  }

  /**
   * Get current user profile
   * @route GET /api/auth/me
   */
  async getMe(req, res) {
    const user = await User.findByPk(req.user.user_id, {
      attributes: { exclude: ['password'] }
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
   * Update user profile
   * @route PUT /api/auth/profile
   */
  async updateProfile(req, res) {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is missing or invalid'
      });
    }

    let formData = {};
    
    logger.info('Profile update request body:', {
      hasFile: !!req.file,
      bodyKeys: Object.keys(req.body),
      contentType: req.get('Content-Type')
    });
    
    if (req.body.updates) {
      try {
        formData = JSON.parse(req.body.updates);
        logger.info('Parsed updates data:', formData);
      } catch (error) {
        logger.error('Failed to parse updates JSON:', error);
        return res.status(400).json({
          success: false,
          message: 'Invalid updates data format'
        });
      }
    }
    
    const { name, email, phone, address, password, confirmPassword } = {
      ...req.body,
      ...formData
    };
    
    const user = await User.findByPk(req.user.user_id);
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

    // Validate password if provided
    if (password) {
      if (!confirmPassword || password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password and confirm password do not match'
        });
      }
    }

    // Handle profile image upload
    let profileImagePath = user.profile;
    if (req.file) {
      if (user.profile) {
        try {
          const oldImagePath = path.join(__dirname, '../public/uploads/profiles', path.basename(user.profile));
          await fs.unlink(oldImagePath);
        } catch (error) {
          logger.warn(`Failed to delete old profile image: ${error.message}`);
        }
      }
      
      profileImagePath = `/uploads/profiles/${req.file.filename}`;
    }

    // Update user
    const userUpdateData = {
      name: name || user.name,
      email: email || user.email,
      phone: phone || user.phone,
      address: address || user.address,
      profile: profileImagePath
    };

    if (password) {
      userUpdateData.password = password;
    }

    logger.info('Updating user with data:', userUpdateData);

    await user.update(userUpdateData);

    // Refresh user data
    const updatedUser = await User.findByPk(user.user_id, {
      attributes: { exclude: ['password'] }
    });

    logger.info(`User ${user.email} updated their profile successfully`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toJSON()
      }
    });
  }

  /**
   * Upload profile image
   * @route PUT /api/auth/profile-upload
   */
  async uploadProfile(req, res) {
    console.log('🚀 AUTH ROUTE UPLOAD HIT!');
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('File:', req.file);
    console.log('Body:', req.body);
    console.log('Body keys:', Object.keys(req.body || {}));

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
      
      if (profileImagePath && profileImagePath !== 'No File' && profileImagePath !== '') {
        const oldImagePath = path.join(__dirname, '../public', profileImagePath);
        try {
          await fs.access(oldImagePath);
          await fs.unlink(oldImagePath);
        } catch (error) {
          console.log('Old image not found or already deleted:', error.message);
        }
      }
      
      profileImagePath = `/uploads/profiles/${req.file.filename}`;
    }

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
  }

  /**
   * Logout user
   * @route POST /api/auth/logout
   */
  async logout(req, res) {
    logger.info(`User ${req.user.email} logged out`);

    res.json({
      success: true,
      message: 'Logout successful'
    });
  }

  /**
   * Refresh token
   * @route POST /api/auth/refresh
   */
  async refreshToken(req, res) {
    const user = await User.findByPk(req.user.user_id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Generate new token
    const token = user.generateAuthToken();

    logger.info(`Token refreshed for user ${user.email}`);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: user.toJSON(),
        token
      }
    });
  }
}

module.exports = new AuthController();

