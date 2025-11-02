const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, checkOwnership } = require('../middleware/auth.middleware');
const { validateUser } = require('../middleware/validation.middleware');
const { validateQuery } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const userController = require('../controllers/user.controller');

// GET /api/users - Get all users (admin and manager can view)
router.get('/', authenticateToken, authorize('admin', 'manager'), validateQuery.users, asyncHandler(userController.getAllUsers.bind(userController)));

// GET /api/users/counts - Get overall user role counts (admin and manager can view)
router.get('/counts', authenticateToken, authorize('admin', 'manager'), asyncHandler(userController.getUserCounts.bind(userController)));

// GET /api/users/team/members - Get team members for current user's projects
router.get('/team/members', authenticateToken, asyncHandler(userController.getTeamMembers.bind(userController)));

// GET /api/users/managers - Get all potential managers (no admin required)
router.get('/managers', authenticateToken, asyncHandler(userController.getManagers.bind(userController)));

// GET /api/users/managers/list - Get all managers
router.get('/managers/list', authenticateToken, asyncHandler(userController.getManagersList.bind(userController)));

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, asyncHandler(userController.getUserById.bind(userController)));

// PUT /api/users/:id - Update user
router.put('/:id', authenticateToken, checkOwnership(require('../models').User), validateUser.update, asyncHandler(userController.updateUser.bind(userController)));

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(userController.deleteUser.bind(userController)));

// POST /api/users - Create new user (admin only)
router.post('/', authenticateToken, authorize('admin'), validateUser.create, asyncHandler(userController.createUser.bind(userController)));

module.exports = router;
