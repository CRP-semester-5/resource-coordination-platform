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


export const sendNotification = async (req, res, next) => {
    try {
        const { userId, title, body, data } = req.body;
        
        // 1. Map type to valid Postgres enum: 'TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'NEW_DONATION', 'DONATION_STATUS_CHANGED', 'INVENTORY_ALERT'
        let notificationType = 'DONATION_STATUS_CHANGED';
        const rawType = (data?.type || '').toUpperCase();
        if (rawType.includes('TASK_ASSIGNED')) notificationType = 'TASK_ASSIGNED';
        else if (rawType.includes('TASK')) notificationType = 'TASK_STATUS_CHANGED';
        else if (rawType.includes('NEW_DONATION')) notificationType = 'NEW_DONATION';
        else if (rawType.includes('DONATION')) notificationType = 'DONATION_STATUS_CHANGED';
        else if (rawType.includes('INVENTORY')) notificationType = 'INVENTORY_ALERT';

        // 2. Save to Supabase DB matching exact table columns
        const { supabase } = await import("../lib/supabase.js");
        const { data: inserted, error: insertError } = await supabase.from("notifications").insert({
            user_id: userId,
            message: body || title || "Notification",
            type: notificationType,
            organization_id: data?.organization_id || null,
            link: data?.link || (data?.id ? `/donations/${data.id}` : null),
            is_read: false
        }).select().single();

        if (insertError) {
            console.error('[NotificationService] Error saving to notifications table:', insertError);
        } else {
            console.log('[NotificationService] Notification saved successfully:', inserted?.notification_id);
        }

        // 3. Fetch FCM Token
        const { data: userData } = await supabase
            .from("users")
            .select("fcm_token")
            .eq("user_id", userId)
            .single();

        // 4. Send Push
        if (userData && userData.fcm_token) {
            const { sendPushNotification } = await import("../services/push.service.js");
            await sendPushNotification(userData.fcm_token, title, body, data);
        }

        return res.status(200).json({ success: true, message: "Notification sent", data: inserted });
    } catch (error) {
        next(error);
    }
};