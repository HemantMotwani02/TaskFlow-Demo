const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meeting.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All meeting routes require authentication
router.use(authenticateToken);

router.post('/', meetingController.createMeeting);
router.get('/', meetingController.getMeetings);
router.get('/:id', meetingController.getMeetingById);
router.put('/:id', meetingController.updateMeeting);
router.delete('/:id', meetingController.deleteMeeting);

// Status change convenience route
router.patch('/:id/status', meetingController.updateMeeting);

module.exports = router;
