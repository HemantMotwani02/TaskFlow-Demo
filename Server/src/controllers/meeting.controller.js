const Meeting = require('../models/meeting.model');
const { createNotification } = require('../utils/notification.service');

exports.createMeeting = async (req, res) => {
  try {
    const { title, type, scheduledAt, startTime, endTime, participants } = req.body;
    
    // Validation
    if (!title || !scheduledAt || !startTime || !endTime || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Meeting name, date, time, and at least one participant are required.' 
      });
    }

    // Store date as provided (YYYY-MM-DD) without timezone conversion
    // Use local noon time to avoid any timezone shift issues
    const [year, month, day] = scheduledAt.split('-').map(Number);
    const normalizedScheduledAt = new Date(year, month - 1, day, 12, 0, 0);

    const meeting = await Meeting.create({
      title,
      type: type || 'in-person',
      scheduled_at: normalizedScheduledAt,
      start_time: startTime,
      end_time: endTime,
      status: 'scheduled',
      organizer_id: req.user.user_id,
      participants: JSON.stringify(participants)
    });

    // Send notifications to all participants
    for (const participantId of participants) {
      try {
        await createNotification({
          recipientId: participantId,
          actorId: req.user.user_id,
          type: 'meeting_scheduled',
          title: 'Meeting Scheduled',
          message: `You have been invited to a meeting: "${title}" on ${scheduledAt} at ${startTime}`
        });
      } catch (notificationError) {
        console.error('Failed to send notification to participant:', participantId, notificationError);
      }
    }

    const json = meeting.toJSON();
    const responseMeeting = {
      ...json,
      participants,
      // Provide a normalized date-only field used by the client calendar
      // Extract date components directly to avoid timezone conversion
      scheduledAt: json.scheduled_at ? (() => {
        const d = new Date(json.scheduled_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })() : scheduledAt
    };

    return res.status(201).json({ 
      success: true,
      message: 'Meeting created successfully',
      data: responseMeeting 
    });
  } catch (err) {
    console.error('Error creating meeting:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error creating meeting', 
      error: err.message 
    });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.findAll({
      order: [['scheduled_at', 'ASC']]
    });
    
    // Parse participants JSON for each meeting and filter based on user role
    const meetingsWithParsedParticipants = meetings.map(meeting => {
      const json = meeting.toJSON();
      return {
        ...json,
        participants: JSON.parse(json.participants || '[]'),
        // Add camelCase date for reliable client-side matching
        // Extract date components directly to avoid timezone conversion
        scheduledAt: json.scheduled_at ? (() => {
          const d = new Date(json.scheduled_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : null
      };
    });

    // Filter meetings based on user role
    let filteredMeetings;
    if (['admin', 'manager'].includes(req.user.role)) {
      // Admins and managers can see all meetings
      filteredMeetings = meetingsWithParsedParticipants;
    } else {
      // Employees can only see meetings they are participants in
      filteredMeetings = meetingsWithParsedParticipants.filter(meeting => 
        meeting.participants.includes(req.user.user_id)
      );
    }

    return res.json({ 
      success: true,
      data: filteredMeetings 
    });
  } catch (err) {
    console.error('Error fetching meetings:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error fetching meetings', 
      error: err.message 
    });
  }
};

exports.updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, scheduledAt, startTime, endTime, participants, status } = req.body;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        message: 'Meeting not found' 
      });
    }

    // Check if user is organizer or admin/manager
    if (meeting.organizer_id !== req.user.user_id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to update this meeting' 
      });
    }

    const updates = {
      title: title || meeting.title,
      type: type || meeting.type,
      start_time: startTime || meeting.start_time,
      end_time: endTime || meeting.end_time,
      status: status || meeting.status,
      participants: participants ? JSON.stringify(participants) : meeting.participants
    };
    if (scheduledAt) {
      // Use local noon time to avoid any timezone shift issues
      const [year, month, day] = scheduledAt.split('-').map(Number);
      updates.scheduled_at = new Date(year, month - 1, day, 12, 0, 0);
    }

    await meeting.update(updates);

    // Send notifications to participants about meeting update / status change
    const participantIds = participants ? participants : JSON.parse(meeting.participants || '[]');
    for (const participantId of participantIds) {
      try {
        await createNotification({
          recipientId: participantId,
          actorId: req.user.user_id,
          type: status ? 'meeting_status_changed' : 'meeting_updated',
          title: status ? 'Meeting Status Changed' : 'Meeting Updated',
          message: status
            ? `Meeting "${title || meeting.title}" status is now ${status}`
            : `Meeting "${title || meeting.title}" has been updated`
        });
      } catch (notificationError) {
        console.error('Failed to send update notification to participant:', participantId, notificationError);
      }
    }

    const json = meeting.toJSON();
    return res.json({ 
      success: true,
      message: 'Meeting updated successfully',
      data: {
        ...json,
        participants: JSON.parse(json.participants || '[]'),
        // Extract date components directly to avoid timezone conversion
        scheduledAt: json.scheduled_at ? (() => {
          const d = new Date(json.scheduled_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : null
      }
    });
  } catch (err) {
    console.error('Error updating meeting:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error updating meeting', 
      error: err.message 
    });
  }
};

exports.getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        message: 'Meeting not found' 
      });
    }

    // Check if user is participant, organizer, or admin/manager
    const participantIds = JSON.parse(meeting.participants || '[]');
    const isParticipant = participantIds.includes(req.user.user_id);
    const isOrganizer = meeting.organizer_id === req.user.user_id;
    const isAdminOrManager = ['admin', 'manager'].includes(req.user.role);

    if (!isParticipant && !isOrganizer && !isAdminOrManager) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to view this meeting' 
      });
    }

    const json = meeting.toJSON();
    return res.json({ 
      success: true,
      data: {
        ...json,
        participants: participantIds,
        // Extract date components directly to avoid timezone conversion
        scheduledAt: json.scheduled_at ? (() => {
          const d = new Date(json.scheduled_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : null
      }
    });
  } catch (err) {
    console.error('Error fetching meeting:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error fetching meeting', 
      error: err.message 
    });
  }
};

exports.deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ 
        success: false,
        message: 'Meeting not found' 
      });
    }

    // Check if user is organizer or admin/manager
    if (meeting.organizer_id !== req.user.user_id && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this meeting' 
      });
    }

    // Send notifications to participants about meeting cancellation
    const participantIds = JSON.parse(meeting.participants || '[]');
    for (const participantId of participantIds) {
      try {
        await createNotification({
          recipientId: participantId,
          actorId: req.user.user_id,
          type: 'meeting_cancelled',
          title: 'Meeting Cancelled',
          message: `Meeting "${meeting.title}" has been cancelled`
        });
      } catch (notificationError) {
        console.error('Failed to send cancellation notification to participant:', participantId, notificationError);
      }
    }

    await meeting.destroy();

    return res.json({ 
      success: true,
      message: 'Meeting deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting meeting:', err);
    return res.status(500).json({ 
      success: false,
      message: 'Error deleting meeting', 
      error: err.message 
    });
  }
};
