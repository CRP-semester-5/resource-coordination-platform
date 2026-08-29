import { supabase } from "../lib/supabase.js";

export const getNotificationsByUser = async (userId) => {
    return await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
};

export const getUnreadCount = async (userId) => {
    const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", userId)
        .eq("is_read", false);
    
    return { count, error };
};

export const markAsRead = async (notificationId, userId) => {
    return await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("notification_id", notificationId)
        .eq("user_id", userId) // Ensure they own it
        .select()
        .single();
};

export const markAllAsRead = async (userId) => {
    return await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
};
