import * as taskRepo from "../repositories/task.repository.js";
import { AppError } from "@crp/shared-middleware";

export const createTaskService = (repository = taskRepo) => {
    const createTask = async (data) => {
        const { data: task, error } = await repository.createTask(data);
        if (error) throw new AppError(500, error.message);
        return task;
    };

    const getTasks = async (organizationId) => {
    const { data, error } = await repository.getTasks(organizationId);
    if (error) throw new AppError(500, error.message);
    return data;
};

    const getTaskById = async (taskId) => {
    const { data, error } = await repository.getTaskById(taskId);
    if (error) {
        if (error.code === 'PGRST116') throw new AppError(404, "Task not found");
        throw new AppError(500, error.message);
    }
    return data;
};

    const updateTask = async (taskId, data) => {
    const { data: task, error } = await repository.updateTask(taskId, data);
    if (error) throw new AppError(500, error.message);
    if (!task) throw new AppError(404, "Task not found");
    return task;
};

    const assignTask = async (taskId, volunteerId) => {
    const task = await getTaskById(taskId);
    if (!task) throw new AppError(404, "Task not found");

    // 2. Assign
    const { data, error } = await repository.assignTask(taskId, volunteerId);
    if (error) {
        if (error.code === '23505') throw new AppError(409, "Volunteer already assigned to this task");
        throw new AppError(500, error.message);
    }

    if (task.status === 'UNASSIGNED') {
        await updateTask(taskId, { status: 'ASSIGNED' });
    }

    return data;
};

    return { createTask, getTasks, getTaskById, updateTask, assignTask };
};

const service = createTaskService();
export const { createTask, getTasks, getTaskById, updateTask, assignTask } = service;
