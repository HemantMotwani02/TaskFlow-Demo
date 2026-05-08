const { Notification } = require('../models');
const notificationService = require('../services/notificationService');

const createNotification = async ({ recipientId, actorId, projectId, taskId, type, title, message }) => {
     const notification = await Notification.create({
    recipient_id: recipientId,
    actor_id: actorId || null,
    project_id: projectId || null,
    task_id: taskId || null,
    type,
    title,
    message,
    delivered_at: new Date()
  });

  // Emit real-time notification
  // Best-effort: ask notificationService to push this DB record to user if WS is available
  try {
    notificationService.pushExistingNotification(recipientId, notification);
  } catch (e) {
    console.error('Failed to push notification via notificationService:', e);
  }

  return notification;
};

module.exports = { createNotification };


