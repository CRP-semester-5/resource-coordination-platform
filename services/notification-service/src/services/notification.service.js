import * as notificationRepo from "../repositories/notification.repository.js";
import { AppError } from "@crp/shared-middleware";

export const createNotificationService = (repository = notificationRepo) => {
 const getNotifications = async (userId) => {
    const { data, error } = await repository.getNotificationsByUser(userId);
    if (error) throw new AppError(500, error.message);
    return data;
};

 const getUnreadCount = async (userId) => {
    const { count, error } = await repository.getUnreadCount(userId);
    if (error) throw new AppError(500, error.message);
    return { count };
};

 const markAsRead = async (notificationId, userId) => {
    const { data, error } = await repository.markAsRead(notificationId, userId);
    if (error) throw new AppError(500, error.message);
    if (!data) throw new AppError(404, "Notification not found or access denied");
    return data;
};

 const markAllAsRead = async (userId) => {
    const { error } = await repository.markAllAsRead(userId);
    if (error) throw new AppError(500, error.message);
    return { success: true };
};

 return { getNotifications, getUnreadCount, markAsRead, markAllAsRead };
};

const service = createNotificationService();
export const { getNotifications, getUnreadCount, markAsRead, markAllAsRead } = service;
