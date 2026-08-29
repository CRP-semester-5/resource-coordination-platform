import * as taskRepo from "../repositories/task.repository.js";
import { AppError } from "@crp/shared-middleware";

export const createTask = async (data) => {
    const { data: task, error } = await taskRepo.createTask(data);
    if (error) throw new AppError(500, error.message);
    return task;
};

export const getTasks = async (organizationId) => {
    const { data, error } = await taskRepo.getTasks(organizationId);
    if (error) throw new AppError(500, error.message);
    return data;
};

export const getTaskById = async (taskId) => {
    const { data, error } = await taskRepo.getTaskById(taskId);
    if (error) {
        if (error.code === 'PGRST116') throw new AppError(404, "Task not found");
        throw new AppError(500, error.message);
    }
    return data;
};

export const updateTask = async (taskId, data) => {
    const { data: task, error } = await taskRepo.updateTask(taskId, data);
    if (error) throw new AppError(500, error.message);
    if (!task) throw new AppError(404, "Task not found");
    return task;
};

export const assignTask = async (taskId, volunteerId) => {
    // 1. Verify task exists
    const task = await getTaskById(taskId);
    if (!task) throw new AppError(404, "Task not found");

    // 2. Assign
    const { data, error } = await taskRepo.assignTask(taskId, volunteerId);
    if (error) {
        if (error.code === '23505') throw new AppError(409, "Volunteer already assigned to this task");
        throw new AppError(500, error.message);
    }

    // 3. Update status to ASSIGNED if currently UNASSIGNED
    if (task.status === 'UNASSIGNED') {
        await updateTask(taskId, { status: 'ASSIGNED' });
    }

    // TODO: We could publish a WebSocket event to Notification Service here

    return data;
};
