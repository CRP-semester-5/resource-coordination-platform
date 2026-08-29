import { supabase } from "../lib/supabase.js";

export const createTask = async (taskData) => {
    return await supabase
        .from("tasks")
        .insert([taskData])
        .select()
        .single();
};

export const getTasks = async (organizationId) => {
    let query = supabase.from("tasks").select(`
        *,
        task_assignments ( volunteer_id )
    `);

    if (organizationId) {
        query = query.eq("organization_id", organizationId);
    }

    return await query;
};

export const getTaskById = async (taskId) => {
    return await supabase
        .from("tasks")
        .select(`
            *,
            task_assignments ( volunteer_id )
        `)
        .eq("task_id", taskId)
        .single();
};

export const updateTask = async (taskId, taskData) => {
    return await supabase
        .from("tasks")
        .update(taskData)
        .eq("task_id", taskId)
        .select()
        .single();
};

export const assignTask = async (taskId, volunteerId) => {
    return await supabase
        .from("task_assignments")
        .insert([{ task_id: taskId, volunteer_id: volunteerId }])
        .select()
        .single();
};
