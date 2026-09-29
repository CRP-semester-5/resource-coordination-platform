import admin from '../config/firebase.js'

export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken || !admin || !admin.apps || !admin.apps.length) {
    console.warn('[NotificationService] Push skipped: missing fcmToken or firebase admin not initialized.');
    return;
  }

  const stringData = {};
  if (data && typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined && val !== null) {
        stringData[key] = String(val);
      }
    }
  }

  const message = {
    notification: {
      title: String(title || 'ResQ Hub Notification'),
      body: String(body || '')
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'high_importance_channel',
        priority: 'max',
        defaultSound: true,
        defaultVibrateTimings: true,
        visibility: 'public',
      }
    },
    data: stringData,
    token: fcmToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('[NotificationService] Successfully sent push message:', response);
    return response;
  } catch (error) {
    console.error('[NotificationService] Error sending push message:', error.message);
  }
};
