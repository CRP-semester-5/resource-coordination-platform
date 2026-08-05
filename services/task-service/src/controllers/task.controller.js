import * as taskService from "../services/task.service.js";

export const createTask = async (req, res, next) => {
    try {
        const organizationId = req.headers["x-organization-id"];
        if (!organizationId) return res.status(400).json({ success: false, message: "Missing x-organization-id header" });

        const data = {
            ...req.body,
            organization_id: organizationId,
            created_by: req.user.user_id
        };
        const task = await taskService.createTask(data);
        return res.status(201).json({ success: true, data: task });
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
        const { volunteer_id } = req.body;
        if (!volunteer_id) return res.status(400).json({ success: false, message: "volunteer_id is required" });

        const assignment = await taskService.assignTask(req.params.id, volunteer_id);
        return res.status(201).json({ success: true, message: "Task assigned successfully", data: assignment });
    } catch (error) {
        next(error);
    }
};
