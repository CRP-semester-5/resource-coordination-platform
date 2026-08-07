import { supabase } from '../lib/supabase.js'

export class NotificationRepository {
  static async createNotification(data) {
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([data])
      .select()
      .single()
    if (error) throw error
    return notification
  }

  static async getUserNotifications(userId, organizationId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }

  static async getNotificationById(notificationId, userId, organizationId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('notification_id', notificationId)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single()
    if (error) throw error
    return data
  }

  static async markAsRead(notificationId, userId, organizationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ status: 'READ', read_at: new Date().toISOString() })
      .eq('notification_id', notificationId)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async markAllAsRead(userId, organizationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ status: 'READ', read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'UNREAD')
      .select()
    if (error) throw error
    return data
  }
}
