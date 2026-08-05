import * as notificationService from "../services/notification.service.js";

export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await notificationService.getNotifications(req.user.user_id);
        return res.json({ success: true, data: notifications });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCount = async (req, res, next) => {
    try {
        const result = await notificationService.getUnreadCount(req.user.user_id);
        return res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user.user_id);
        return res.json({ success: true, data: notification });
    } catch (error) {
        next(error);
    }
};

export const markAllAsRead = async (req, res, next) => {
    try {
        await notificationService.markAllAsRead(req.user.user_id);
        return res.json({ success: true, message: "All marked as read" });
    } catch (error) {
        next(error);
    }
};
