/**
 * useNotifications — subscribes to real-time notifications via Socket.IO.
 *
 * Mount this hook once in the coordinator/admin layout component so it's
 * active for the entire authenticated session.
 *
 * When a 'notification' event arrives it:
 *   1. Invalidates the notifications query → bell badge auto-updates
 *   2. Invalidates the requests query → request list auto-refreshes
 *   3. Fires the optional onNotification callback (e.g. to show a toast)
 */
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/lib/socket';

export interface NotificationPayload {
  notification_id: string;
  user_id: string;
  organization_id: string | null;
  type: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface UseNotificationsOptions {
  /** Optional callback — use this to show a toast */
  onNotification?: (n: NotificationPayload) => void;
}

export function useNotifications({ onNotification }: UseNotificationsOptions = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleNotification(data: NotificationPayload) {
      // 1. Invalidate notification queries so the bell badge refreshes
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unread-count'] });

      // 2. If it's a request status change, refresh the requests list
      if (data.type === 'REQUEST_STATUS_CHANGED' || data.type === 'NEW_REQUEST') {
        queryClient.invalidateQueries({ queryKey: ['requests'] });
      }

      // 3. Fire optional toast callback
      onNotification?.(data);
    }

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [queryClient, onNotification]);
}
