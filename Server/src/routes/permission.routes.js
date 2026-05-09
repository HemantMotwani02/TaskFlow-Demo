const express = require('express');
const router = express.Router();
const { authenticateToken, authorize } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const permissionController = require('../controllers/permission.controller');

router.get('/definitions', authenticateToken, authorize('admin'), asyncHandler(permissionController.getDefinitions.bind(permissionController)));
router.get('/groups', authenticateToken, authorize('admin'), asyncHandler(permissionController.getGroups.bind(permissionController)));
router.post('/groups', authenticateToken, authorize('admin'), asyncHandler(permissionController.createGroup.bind(permissionController)));
router.put('/groups/:id', authenticateToken, authorize('admin'), asyncHandler(permissionController.updateGroup.bind(permissionController)));
router.patch('/groups/:id/default', authenticateToken, authorize('admin'), asyncHandler(permissionController.setDefaultGroup.bind(permissionController)));
router.delete('/groups/:id', authenticateToken, authorize('admin'), asyncHandler(permissionController.deleteGroup.bind(permissionController)));

module.exports = router;
