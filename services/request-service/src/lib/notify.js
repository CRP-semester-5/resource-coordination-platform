/**
 * notify — fire-and-forget helper for request-service.
 *
 * Calls the notification-service internal endpoint to persist + broadcast
 * a real-time notification to a user over Socket.IO.
 *
 * Never throws — a failed notification must never break the main request flow.
 *
 * @param {object} opts
 * @param {string}  opts.userId         - UUID of the recipient
 * @param {string}  opts.type           - notification_type enum value (e.g. 'REQUEST_STATUS_CHANGED')
 * @param {string}  opts.message        - Human-readable message body
 * @param {string}  [opts.organizationId] - Optional org context UUID
 * @param {string}  [opts.link]         - Optional deep-link path (e.g. "/requests/:id")
 */
export async function notify({ userId, type, message, organizationId = null, link = null }) {
    const url = `${process.env.NOTIFICATION_SERVICE_URL}/api/v1/notifications/internal/emit`;
    const secret = process.env.INTERNAL_SECRET;

    if (!url || !secret) {
        console.warn('[notify] NOTIFICATION_SERVICE_URL or INTERNAL_SECRET not set — skipping notification.');
        return;
    }

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-internal-secret': secret,
            },
            body: JSON.stringify({
                user_id:         userId,
                type,
                message,
                organization_id: organizationId,
                link,
            }),
        });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error(`[notify] notification-service returned ${res.status}: ${text}`);
        }
    } catch (err) {
        // Network error — service may be down. Log and continue.
        console.error('[notify] Failed to reach notification-service:', err.message);
    }
}
