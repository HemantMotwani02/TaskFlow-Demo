const express = require('express');
const router = express.Router();
const meetingNoteController = require('../controllers/meetingNote.controller');

router.post('/', meetingNoteController.createNote);
router.get('/:meetingId', meetingNoteController.getNotesByMeeting);

module.exports = router;
