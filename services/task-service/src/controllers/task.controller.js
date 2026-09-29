import { supabase } from "../lib/supabase.js";
import * as taskService from "../services/task.service.js";

const sendNotification = async ({ userId, title, body, data, link }) => {
    if (!userId) return;
    const notifPayload = {
        userId,
        title,
        body,
        data: {
            ...data,
            link: link || (data?.id ? `/tasks/${data.id}` : null)
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
        console.warn('[Task] notification-service unreachable, saving directly to Supabase fallback:', e.message);
        try {
            const { supabase: sb } = await import("../lib/supabase.js");
            let notifType = 'TASK_STATUS_CHANGED';
            if ((data?.type || '').includes('ASSIGNED')) notifType = 'TASK_ASSIGNED';
            else if ((data?.type || '').includes('DONATION')) notifType = 'DONATION_STATUS_CHANGED';

            await sb.from("notifications").insert({
                user_id: userId,
                message: body,
                type: notifType,
                organization_id: data?.organization_id || null,
                link: link || (data?.id ? `/tasks/${data.id}` : null),
                is_read: false
            });
        } catch (dbErr) {
            console.error('[Task] Supabase fallback error:', dbErr.message);
        }
    }
};

export const createTask = async (req, res, next) => {
    try {
        const organizationId = req.headers["x-organization-id"];
        if (!organizationId) return res.status(400).json({ success: false, message: "Missing x-organization-id header" });

        const data = {
            ...req.body,
            organization_id: organizationId,
            coordinator_id: req.user.sub
        };
        const task = await taskService.createTask(data);
        return res.status(201).json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

export const getMyTasks = async (req, res, next) => {
    try {
        const userId = req.user.sub;
        const tasks = await taskService.getMyTasks(userId);
        return res.json({ success: true, data: tasks });
    } catch (error) {
        next(error);
    }
};

export const getTasks = async (req, res, next) => {
    try {
        const organizationId = req.headers["x-organization-id"];
        const tasks = await taskService.getTasks(organizationId);
        return res.json({ success: true, data: tasks });
    } catch (error) {
        next(error);
    }
};

export const getTaskById = async (req, res, next) => {
    try {
        const task = await taskService.getTaskById(req.params.id);
        return res.json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

export const updateTask = async (req, res, next) => {
    try {
        const task = await taskService.updateTask(req.params.id, req.body);
        return res.json({ success: true, data: task });
    } catch (error) {
        next(error);
    }
};

export const assignTask = async (req, res, next) => {
    try {
        let { volunteer_id } = req.body || {};
        const userId = req.user.sub;

        // If volunteer_id not provided, look up volunteer_id for the logged-in user (mobile self-assignment)
        if (!volunteer_id) {
            const volunteer = await taskService.getVolunteerByUserId(userId);
            if (volunteer && volunteer.volunteer_id) {
                volunteer_id = volunteer.volunteer_id;
            }
        }

        if (!volunteer_id) {
            return res.status(400).json({ success: false, message: "volunteer_id could not be determined. Make sure you are registered as a volunteer." });
        }

        const assignment = await taskService.assignTask(req.params.id, volunteer_id, userId);

        // Correct target user: Find the volunteer's user_id from the database
        try {
            let targetUserId = userId;
            const { data: volData } = await supabase.from('volunteers').select('user_id').eq('volunteer_id', volunteer_id).maybeSingle();
            if (volData && volData.user_id) {
                targetUserId = volData.user_id;
            }

            const task = await taskService.getTaskById(req.params.id);
            const taskTitle = task?.title || 'Relief Mission';

            sendNotification({
                userId: targetUserId,
                title: 'New Mission Assigned 🚨',
                body: `You have been assigned to mission: "${taskTitle}". Check your active tasks!`,
                data: { type: 'TASK_ASSIGNED', id: req.params.id }
            }).catch(e => console.error('Push error:', e));
        } catch(e) {
            console.warn('[Task] assignTask notification error:', e.message);
        }

        return res.status(201).json({ success: true, message: "Task assigned successfully", data: assignment });
    } catch (error) {
        next(error);
    }
};

export const addProgress = async (req, res, next) => {
    try {
        const { progress_percent, remarks, status } = req.body;
        const progress = await taskService.addProgress(req.params.id, req.user.sub, {
            progress_percent,
            remarks,
            status
        });
        return res.status(201).json({ success: true, message: "Progress recorded successfully", data: progress });
    } catch (error) {
        next(error);
    }
};

export const getTaskProgress = async (req, res, next) => {
    try {
        const progress = await taskService.getTaskProgress(req.params.id);
        return res.json({ success: true, data: progress });
    } catch (error) {
        next(error);
    }
};

export const verifyDonorPickup = async (req, res, next) => {
    try {
        const { pin } = req.body;
        if (!pin) {
            return res.status(400).json({ success: false, message: "Donor Handover PIN is required" });
        }
        const result = await taskService.verifyDonorPickup(req.params.id, req.user.sub, pin);

        // Notify donor that items were collected
        try {
            const task = await taskService.getTaskById(req.params.id);
            const desc = task?.description || '';
            const donMatch = desc.match(/\[DONATION_ID:([a-f0-9\-]+)\]/i);
            if (donMatch) {
                const { data: don } = await supabase.from('donations').select('*').eq('donation_id', donMatch[1]).maybeSingle();
                if (don && don.donor_id) {
                    sendNotification({
                        userId: don.donor_id,
                        title: 'Donation Collected ✅',
                        body: `Your donation "${don.resource_name || 'supplies'}" has been picked up by the volunteer. Thank you!`,
                        data: { type: 'DONATION_STATUS_CHANGED', id: don.donation_id }
                    }).catch(e => console.error('Push error:', e));
                }
            }
        } catch (e) {
            console.warn('[Task] verifyDonorPickup notification error:', e.message);
        }

        return res.status(200).json({ success: true, message: "Donation collection from donor verified!", data: result });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

export const verifyWarehousePickup = async (req, res, next) => {
    try {
        const { pin } = req.body;
        if (!pin) {
            return res.status(400).json({ success: false, message: "Warehouse Dispatch PIN is required" });
        }
        const result = await taskService.verifyWarehousePickup(req.params.id, req.user.sub, pin);
        return res.status(200).json({ success: true, message: "Supplies collected from warehouse verified!", data: result });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

export const verifyHandover = async (req, res, next) => {
    try {
        const { pin } = req.body;
        if (!pin) {
            return res.status(400).json({ success: false, message: "Verification PIN is required" });
        }
        const result = await taskService.verifyHandover(req.params.id, req.user.sub, pin);

        try {
            const task = await taskService.getTaskById(req.params.id);
            const desc = task?.description || '';
            const reqMatch = desc.match(/\[REQUEST_ID:([a-f0-9\-]+)\]/i);
            if (reqMatch) {
                const { data: reqData } = await supabase.from('requests').select('*').eq('request_id', reqMatch[1]).maybeSingle();
                if (reqData && reqData.user_id) {
                    sendNotification({
                        userId: reqData.user_id,
                        title: 'Relief Delivered 🎉',
                        body: 'Your requested relief supplies have been delivered successfully! Stay safe.',
                        data: { type: 'TASK_STATUS_CHANGED', id: reqData.request_id }
                    }).catch(e => console.error('Push error:', e));
                }
            }

            // Also notify the volunteer who completed the task
            sendNotification({
                userId: req.user.sub,
                title: 'Mission Completed 🏆',
                body: `Handover verified and "${task?.title || 'mission'}" marked complete!`,
                data: { type: 'TASK_STATUS_CHANGED', id: req.params.id }
            }).catch(e => console.error('Push error:', e));
        } catch (e) {
            console.warn('[Task] verifyHandover notification error:', e.message);
        }

        return res.status(200).json({ success: true, message: "Handover verified and mission completed successfully!", data: result });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

export const regeneratePin = async (req, res, next) => {
    try {
        const result = await taskService.regeneratePin(req.params.id, req.user.sub);
        const newPin = result.pin || result.handover_pin || result;

        try {
            const task = await taskService.getTaskById(req.params.id);
            const desc = task?.description || '';
            const reqMatch = desc.match(/\[REQUEST_ID:([a-f0-9\-]+)\]/i);
            const donMatch = desc.match(/\[DONATION_ID:([a-f0-9\-]+)\]/i);

            // 1. Notify the requester if this task is for a help request
            if (reqMatch) {
                const { data: reqData } = await supabase.from('requests').select('user_id').eq('request_id', reqMatch[1]).maybeSingle();
                if (reqData && reqData.user_id) {
                    sendNotification({
                        userId: reqData.user_id,
                        title: 'Relief Verification PIN 🔐',
                        body: `Your new relief verification PIN is: ${newPin}. Please share this code with the volunteer.`,
                        data: { type: 'TASK_STATUS_CHANGED', id: reqMatch[1] }
                    }).catch(e => console.error('Push error:', e));
                }
            }

            // 2. Notify the donor if this task is for a donation
            if (donMatch) {
                const { data: donData } = await supabase.from('donations').select('donor_id').eq('donation_id', donMatch[1]).maybeSingle();
                if (donData && donData.donor_id) {
                    sendNotification({
                        userId: donData.donor_id,
                        title: 'Donation Handover PIN 🔐',
                        body: `Your new donation handover PIN is: ${newPin}. Please share this code with the volunteer.`,
                        data: { type: 'DONATION_STATUS_CHANGED', id: donMatch[1] }
                    }).catch(e => console.error('Push error:', e));
                }
            }

            // 3. Also notify the requester/coordinator caller
            sendNotification({
                userId: req.user.sub,
                title: 'New Verification PIN 🔐',
                body: `Your verification PIN is: ${newPin}`,
                data: { type: 'TASK_STATUS_CHANGED', id: req.params.id }
            }).catch(e => console.error('Push error:', e));
        } catch(e) {
            console.warn('[Task] regeneratePin notification error:', e.message);
        }

        return res.status(200).json({ success: true, message: "New handover PIN generated successfully", data: result });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

export const memberCheckIn = async (req, res, next) => {
    try {
        const { volunteer_id } = req.body || {};
        const result = await taskService.memberCheckIn(req.params.id, req.user.sub, volunteer_id);
        return res.json({ success: true, message: "Arrival on site reported successfully", data: result });
    } catch (error) {
        next(error);
    }
};

export const verifyMember = async (req, res, next) => {
    try {
        const { volunteer_id } = req.body || {};
        const result = await taskService.verifyMember(req.params.id, req.user.sub, volunteer_id);
        return res.json({ success: true, message: "Member verified on site by Team Leader", data: result });
    } catch (error) {
        next(error);
    }
};
