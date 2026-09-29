import * as requestService from "../services/request.service.js";

const sendNotification = async ({ userId, title, body, data, link }) => {
    if (!userId) return;
    const notifPayload = {
        userId,
        title,
        body,
        data: {
            ...data,
            link: link || (data?.id ? `/requests/${data.id}` : null)
        }
    };
    const notifUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007';
    try {
        await fetch(`${notifUrl}/api/v1/notifications/internal/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifPayload)
        });
    } catch (e) {
        console.warn('[Request] notification-service unreachable, fallback to Supabase:', e.message);
        try {
            const { supabase } = await import("../lib/supabase.js");
            await supabase.from("notifications").insert({
                user_id: userId,
                message: body,
                type: 'TASK_STATUS_CHANGED',
                organization_id: data?.organization_id || null,
                link: link || (data?.id ? `/requests/${data.id}` : null),
                is_read: false
            });
        } catch (dbErr) {
            console.error('[Request] Supabase fallback error:', dbErr.message);
        }
    }
};

export const createRequest = async (req, res) => {
    try {
        const userId = req.user?.sub;
        const request = await requestService.createRequest(req.body, userId);

        return res.status(201).json({
            success: true,
            message: "Request created successfully.",
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getRequests = async (req, res) => {
    try {
        const userId = req.user?.sub || null;
        const myRequestsOnly = req.query.my_requests === 'true' || req.query.my_requests === true;
        const orgId = req.headers['x-organization-id'] || req.orgMembership?.org_id || null;
        const requests = await requestService.getRequests(orgId, userId, myRequestsOnly);
        return res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const getRequestById = async (req, res) => {
    try {
        const request = await requestService.getRequestById(req.params.id);
        return res.status(200).json({
            success: true,
            data: request
        });
    } catch (error) {
        return res.status(404).json({
            success: false,
            message: error.message
        });
    }
};

export const updateRequest = async (req, res) => {
    try {
        const request = await requestService.updateRequest(req.params.id, req.body);
        return res.status(200).json({
            success: true,
            message: "Request updated successfully.",
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteRequest = async (req, res) => {
    try {
        const request = await requestService.deleteRequest(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Request deleted successfully.",
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const approveRequest = async (req, res) => {
    try {
        const request = await requestService.approveRequest(
            req.params.id,
            req.user.sub,
            req.orgMembership?.org_id
        );

        // Send notification to citizen / requester
        try {
            const userId = request?.user_id;
            if (userId) {
                const pinText = request?.handover_pin ? ` Verification PIN: ${request.handover_pin}.` : '';
                sendNotification({
                    userId,
                    title: 'Help Request Approved ✅',
                    body: `Your relief request for "${request.category || 'emergency supplies'}" has been approved!${pinText}`,
                    data: {
                        type: 'TASK_STATUS_CHANGED',
                        id: req.params.id,
                        organization_id: request?.organization_id || null
                    },
                    link: `/requests/${req.params.id}`
                }).catch(e => console.warn('Request approve notification error:', e));
            }
        } catch (notifErr) {
            console.warn('[Request] approveRequest notification error:', notifErr.message);
        }

        return res.status(200).json({
            success: true,
            message: "Request approved successfully.",
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const rejectRequest = async (req, res) => {
    try {
        const request = await requestService.rejectRequest(
            req.params.id,
            req.user.sub,
            req.body.rejection_reason,
            req.orgMembership?.org_id
        );

        // Send notification to citizen / requester
        try {
            const userId = request?.user_id;
            if (userId) {
                const reason = req.body?.rejection_reason || 'Criteria not met';
                sendNotification({
                    userId,
                    title: 'Help Request Update',
                    body: `Your relief request could not be approved. Reason: ${reason}`,
                    data: {
                        type: 'TASK_STATUS_CHANGED',
                        id: req.params.id,
                        organization_id: request?.organization_id || null
                    },
                    link: `/requests/${req.params.id}`
                }).catch(e => console.warn('Request reject notification error:', e));
            }
        } catch (notifErr) {
            console.warn('[Request] rejectRequest notification error:', notifErr.message);
        }

        return res.status(200).json({
            success: true,
            message: "Request rejected successfully.",
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const cancelRequest = async (req, res) => {
    try {
        const request = await requestService.cancelRequest(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Request cancelled successfully.",
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const fulfillRequest = async (req, res) => {
    try {
        const request = await requestService.fulfillRequest(req.params.id);

        // Send notification to citizen / requester
        try {
            const userId = request?.user_id;
            if (userId) {
                sendNotification({
                    userId,
                    title: 'Help Request Fulfilled 🎉',
                    body: `Your relief request for "${request.category || 'supplies'}" has been fulfilled! Stay safe.`,
                    data: {
                        type: 'TASK_STATUS_CHANGED',
                        id: req.params.id,
                        organization_id: request?.organization_id || null
                    },
                    link: `/requests/${req.params.id}`
                }).catch(e => console.warn('Request fulfill notification error:', e));
            }
        } catch (notifErr) {
            console.warn('[Request] fulfillRequest notification error:', notifErr.message);
        }

        return res.status(200).json({
            success: true,
            message: "Request fulfilled successfully.",
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const markInProgress = async (req, res) => {
    try {
        const request = await requestService.markInProgress(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Request marked as in-progress.",
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const unapproveRequest = async (req, res) => {
    try {
        const request = await requestService.unapproveRequest(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Request approval undone. Status reset to pending.",
            data: request
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const regeneratePin = async (req, res) => {
    try {
        const result = await requestService.regeneratePin(req.params.id);

        // Send notification with new PIN to Citizen / Requester
        try {
            const reqData = await requestService.getRequestById(req.params.id).catch(() => null);
            const userId = reqData?.user_id;
            const newPin = result?.handover_pin;
            if (userId && newPin) {
                sendNotification({
                    userId,
                    title: 'Relief Verification PIN 🔐',
                    body: `Your new relief verification PIN is: ${newPin}. Please share this code with the volunteer upon delivery.`,
                    data: {
                        type: 'TASK_STATUS_CHANGED',
                        id: req.params.id,
                        organization_id: reqData?.organization_id || null
                    },
                    link: `/requests/${req.params.id}`
                }).catch(e => console.warn('Request regeneratePin notification error:', e));
            }
        } catch (notifErr) {
            console.warn('[Request] regeneratePin notification error:', notifErr.message);
        }

        return res.status(200).json({
            success: true,
            message: "New handover PIN generated successfully",
            data: result
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
