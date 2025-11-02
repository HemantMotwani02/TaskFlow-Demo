const express = require('express');
const router = express.Router();
const { authenticateToken, authorize, checkProjectAccess } = require('../middleware/auth.middleware');
const { validateProject } = require('../middleware/validation.middleware');
const { validateQuery } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const projectController = require('../controllers/project.controller');

// GET /api/projects - Get all projects
router.get('/', authenticateToken, validateQuery.pagination, asyncHandler(projectController.getAllProjects.bind(projectController)));

// GET /api/projects/:id - Get project by ID
router.get('/:id', authenticateToken, checkProjectAccess, asyncHandler(projectController.getProjectById.bind(projectController)));

// POST /api/projects - Create new project
router.post('/', authenticateToken, authorize('admin', 'manager'), validateProject.create, asyncHandler(projectController.createProject.bind(projectController)));

// PUT /api/projects/:id - Update project
router.put('/:id', authenticateToken, checkProjectAccess, validateProject.update, asyncHandler(projectController.updateProject.bind(projectController)));

// DELETE /api/projects/:id - Soft delete project
router.delete('/:id', authenticateToken, authorize('admin'), asyncHandler(projectController.deleteProject.bind(projectController)));

// GET /api/projects/:id/tasks - Get tasks for a specific project
router.get('/:id/tasks', authenticateToken, checkProjectAccess, asyncHandler(projectController.getProjectTasks.bind(projectController)));

// GET /api/projects/:id/analytics - Get project analytics
router.get('/:id/analytics', authenticateToken, checkProjectAccess, asyncHandler(projectController.getProjectAnalytics.bind(projectController)));

// GET /api/projects/:id/available-members - Get developers not assigned to this project
router.get('/:id/available-members', authenticateToken, asyncHandler(projectController.getAvailableMembers.bind(projectController)));

// GET /api/projects/:id/members - Get project members (legacy endpoint support)
router.get('/:id/members', authenticateToken, asyncHandler(projectController.getProjectMembers.bind(projectController)));

// GET /api/projects/:id/tasks/query - Search tasks in project (legacy endpoint support)
router.get('/:id/tasks/query', authenticateToken, asyncHandler(projectController.searchProjectTasks.bind(projectController)));

// GET /api/projects/:id/logs - Get project logs (legacy endpoint support)
router.get('/:id/logs', authenticateToken, asyncHandler(projectController.getProjectLogs.bind(projectController)));

// GET /api/projects/:id/logs/task/:taskId - Get logs by task in project (legacy endpoint support)
router.get('/:id/logs/task/:taskId', authenticateToken, asyncHandler(projectController.getProjectLogsByTask.bind(projectController)));

module.exports = router;
