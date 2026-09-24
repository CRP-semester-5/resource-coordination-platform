import * as notificationService from "../services/notification.service.js";

/**
 * POST /api/v1/notifications/internal/emit
 * Internal-only endpoint called by other microservices (request-service, task-service, etc.)
 * to persist + broadcast a notification to a user.
 *
 * Protected by the INTERNAL_SECRET env variable — NOT by JWT.
 * Must NOT be exposed through Kong (call directly between Docker containers).
 */
export const internalEmit = async (req, res, next) => {
    try {
        const secret = process.env.INTERNAL_SECRET;
        if (!secret || req.headers['x-internal-secret'] !== secret) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const { user_id, type, message, organization_id, link } = req.body;

        if (!user_id || !type || !message) {
            return res.status(400).json({ message: 'user_id, type, and message are required' });
        }

        await notificationService.createAndEmit({ user_id, type, message, organization_id, link });
        return res.status(201).json({ success: true });
    } catch (error) {
        next(error);
    }
};


export const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.sub;
        const notifications = await notificationService.getNotifications(userId);
        return res.json({ success: true, data: notifications });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user.sub;
        const result = await notificationService.getUnreadCount(userId);
        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.sub;
        const notification = await notificationService.markAsRead(req.params.id, userId);
        return res.json({ success: true, data: notification });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.sub;
        await notificationService.markAllAsRead(userId);
        return res.json({ success: true, message: "All marked as read" });
    } catch (error) {
        next(error);
    }
};
