const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, checkProjectAccess } = require('../middleware/auth.middleware');
const { validateTask } = require('../middleware/validation.middleware');
const { validateQuery } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const taskController = require('../controllers/task.controller');

// GET /api/tasks - Get all tasks
router.get('/', authenticateToken, validateQuery.pagination, asyncHandler(taskController.getAllTasks.bind(taskController)));

// GET /api/tasks/project/:projectId - Get tasks by project
router.get('/project/:projectId', authenticateToken, checkProjectAccess, asyncHandler(taskController.getTasksByProject.bind(taskController)));

// GET /api/tasks/user/created - Get tasks created by current user
router.get('/user/created', authenticateToken, asyncHandler(taskController.getUserCreatedTasks.bind(taskController)));

// GET /api/tasks/:id - Get task by ID
router.get('/:id', authenticateToken, asyncHandler(taskController.getTaskById.bind(taskController)));

// POST /api/tasks - Create new task
router.post('/', authenticateToken, authorize('admin', 'manager'), validateTask.create, asyncHandler(taskController.createTask.bind(taskController)));

// PUT /api/tasks/:id - Update task
router.put('/:id', authenticateToken, validateTask.update, asyncHandler(taskController.updateTask.bind(taskController)));

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', authenticateToken, authorize('admin', 'manager'), asyncHandler(taskController.deleteTask.bind(taskController)));

// PATCH /api/tasks/:id/status - Update task status
router.patch('/:id/status', authenticateToken, asyncHandler(taskController.updateTaskStatus.bind(taskController)));

// POST /api/tasks/bulk - Bulk create tasks
router.post('/bulk', authenticateToken, authorize('admin', 'manager'), asyncHandler(taskController.bulkCreateTasks.bind(taskController)));

// GET /api/tasks/analytics/overview - Get task analytics
router.get('/analytics/overview', authenticateToken, asyncHandler(taskController.getTaskAnalytics.bind(taskController)));

// GET /api/tasks/search - Search tasks
router.get('/search', authenticateToken, asyncHandler(taskController.searchTasks.bind(taskController)));

module.exports = router;
