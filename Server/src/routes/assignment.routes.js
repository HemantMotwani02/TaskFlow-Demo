const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth.middleware');
const { validateAssignment } = require('../middleware/validation.middleware');
const { validateQuery } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const assignmentController = require('../controllers/assignment.controller');

// GET /api/assignments - Get all assignments
router.get('/', authenticateToken, validateQuery.pagination, asyncHandler(assignmentController.getAllAssignments.bind(assignmentController)));

// GET /api/assignments/:id - Get assignment by ID
router.get('/:id', authenticateToken, asyncHandler(assignmentController.getAssignmentById.bind(assignmentController)));

// POST /api/assignments - Create new assignment
router.post('/', authenticateToken, authorize('admin', 'manager'), validateAssignment.create, asyncHandler(assignmentController.createAssignment.bind(assignmentController)));

// PUT /api/assignments/:id - Update assignment
router.put('/:id', authenticateToken, authorize('admin', 'manager'), validateAssignment.create, asyncHandler(assignmentController.updateAssignment.bind(assignmentController)));

// DELETE /api/assignments/:id - Remove assignment
router.delete('/:id', authenticateToken, asyncHandler(assignmentController.deleteAssignment.bind(assignmentController)));

// GET /api/assignments/project/:projectId - Get assignments by project
router.get('/project/:projectId', authenticateToken, asyncHandler(assignmentController.getAssignmentsByProject.bind(assignmentController)));

// GET /api/assignments/user/me - Get current user's assignments
router.get('/user/me', authenticateToken, asyncHandler(assignmentController.getUserAssignments.bind(assignmentController)));

// POST /api/assignments/bulk - Bulk assign users to project
router.post('/bulk', authenticateToken, authorize('admin', 'manager'), asyncHandler(assignmentController.bulkAssign.bind(assignmentController)));

module.exports = router;
