import * as notificationService from "../services/notification.service.js";

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
