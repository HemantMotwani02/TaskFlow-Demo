const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const analyticsController = require('../controllers/analytics.controller');

// GET /api/analytics/dashboard - Get dashboard analytics
router.get('/dashboard', authenticateToken, asyncHandler(analyticsController.getDashboardAnalytics.bind(analyticsController)));

// GET /api/analytics/projects - Get project analytics
router.get('/projects', authenticateToken, asyncHandler(analyticsController.getProjectAnalytics.bind(analyticsController)));

// GET /api/analytics/users - Get user analytics
router.get('/users', authenticateToken, asyncHandler(analyticsController.getUserAnalytics.bind(analyticsController)));

// GET /api/analytics/timeline - Get timeline analytics
router.get('/timeline', authenticateToken, asyncHandler(analyticsController.getTimelineAnalytics.bind(analyticsController)));

// GET /api/analytics/performance - Get performance analytics
router.get('/performance', authenticateToken, asyncHandler(analyticsController.getPerformanceAnalytics.bind(analyticsController)));

module.exports = router;
