import * as notificationRepo from "../repositories/notification.repository.js";
import { AppError } from "@crp/shared-middleware";

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
