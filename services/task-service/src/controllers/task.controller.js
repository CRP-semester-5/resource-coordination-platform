import * as taskService from "../services/task.service.js";

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


export const verifyHandover = async (req, res, next) => {
    try {
        const { pin } = req.body;
        if (!pin) {
            return res.status(400).json({ success: false, message: "Verification PIN is required" });
        }
        const result = await taskService.verifyHandover(req.params.id, req.user.sub, pin);
        return res.status(200).json({ success: true, message: "Handover verified and mission completed successfully!", data: result });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};

export const regeneratePin = async (req, res, next) => {
    try {
        const result = await taskService.regeneratePin(req.params.id, req.user.sub);
        return res.status(200).json({ success: true, message: "New handover PIN generated successfully", data: result });
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }
};
