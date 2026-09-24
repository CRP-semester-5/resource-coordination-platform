import * as notificationRepo from "../repositories/notification.repository.js";
import { AppError } from "@crp/shared-middleware";
import { sendNotificationToUser } from "../sockets/socketManager.js";

/**
 * Persist a notification to the DB then push it live to the user's socket room.
 * Called by the internal /internal/emit endpoint that other microservices POST to.
 *
 * @param {object} opts
 * @param {string} opts.user_id        - UUID of the recipient
 * @param {string} opts.type           - notification_type enum value
 * @param {string} opts.message        - Human-readable message body
 * @param {string} [opts.organization_id] - Optional org context
 * @param {string} [opts.link]         - Optional deep-link (e.g. "/requests/:id")
 */
export const createAndEmit = async ({ user_id, type, message, organization_id = null, link = null }) => {
    const { data, error } = await notificationRepo.create({
        user_id,
        type,
        message,
        organization_id,
        link,
        is_read: false,
    });
    if (error) throw new AppError(500, error.message);

    // Push to connected socket room — non-blocking, user may be offline
    sendNotificationToUser(user_id, data);
    return data;
};


export const getNotifications = async (userId) => {
    const { data, error } = await notificationRepo.getNotificationsByUser(userId);
    if (error) throw new AppError(500, error.message);
    return data;
};

export const getUnreadCount = async (userId) => {
    const { count, error } = await notificationRepo.getUnreadCount(userId);
    if (error) throw new AppError(500, error.message);
    return { count };
};

export const markAsRead = async (notificationId, userId) => {
    const { data, error } = await notificationRepo.markAsRead(notificationId, userId);
    if (error) throw new AppError(500, error.message);
    if (!data) throw new AppError(404, "Notification not found or access denied");
    return data;
};

export const markAllAsRead = async (userId) => {
    const { error } = await notificationRepo.markAllAsRead(userId);
    if (error) throw new AppError(500, error.message);
    return { success: true };
};
