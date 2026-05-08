const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth.middleware');
const { validateLog } = require('../middleware/validation.middleware');
const { validateQuery } = require('../middleware/validation.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const logController = require('../controllers/log.controller');

// GET /api/logs - Get all logs
router.get('/', authenticateToken, validateQuery.pagination, asyncHandler(logController.getAllLogs.bind(logController)));

// GET /api/logs/:id - Get log by ID
router.get('/:id', authenticateToken, asyncHandler(logController.getLogById.bind(logController)));

// POST /api/logs - Create new log
router.post('/', authenticateToken, validateLog.create, asyncHandler(logController.createLog.bind(logController)));

// PUT /api/logs/:id - Update log
router.put('/:id', authenticateToken, validateLog.update, asyncHandler(logController.updateLog.bind(logController)));

// DELETE /api/logs/:id - Delete log
router.delete('/:id', authenticateToken, asyncHandler(logController.deleteLog.bind(logController)));

// GET /api/logs/task/:taskId - Get logs by task
router.get('/task/:taskId', authenticateToken, asyncHandler(logController.getLogsByTask.bind(logController)));

// GET /api/logs/user/me - Get current user's logs
router.get('/user/me', authenticateToken, asyncHandler(logController.getUserLogs.bind(logController)));

// POST /api/logs/:id/approve - Approve log (admin/manager only)
router.post('/:id/approve', authenticateToken, authorize('admin', 'manager'), asyncHandler(logController.approveLog.bind(logController)));

// POST /api/logs/:id/reject - Reject log (admin/manager only)
router.post('/:id/reject', authenticateToken, authorize('admin', 'manager'), asyncHandler(logController.rejectLog.bind(logController)));

// PATCH /api/logs/:id/status - Update log status
router.patch('/:id/status', authenticateToken, asyncHandler(logController.updateLogStatus.bind(logController)));

// GET /api/logs/analytics/overview - Get log analytics
router.get('/analytics/overview', authenticateToken, asyncHandler(logController.getLogAnalytics.bind(logController)));

// POST /api/logs/bulk - Bulk create logs
router.post('/bulk', authenticateToken, asyncHandler(logController.bulkCreateLogs.bind(logController)));

module.exports = router;
