import Notification from '../models/Notification.js';

export async function createNotification(userId, orgId, type, data) {
  try {
    const notification = await Notification.create({
      recipient: userId,
      organization: orgId,
      type,
      title: data.title,
      body: data.body,
      link: data.link,
      entityId: data.entityId,
      entityType: data.entityType,
      metadata: data.metadata,
    });
    return notification;
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ recipient: userId, read: false });
}
