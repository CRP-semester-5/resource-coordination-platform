import { supabase } from "../lib/supabase.js";

export const formatTaskWithTeamInfo = (task) => {
    if (!task) return task;
    let taskType = task.task_type;
    let volunteersRequired = task.volunteers_required;
    let cleanDescription = task.description || '';

    // Extract team metadata tag [TEAM:N] or [INDIVIDUAL:1]
    const match = cleanDescription.match(/^\[(TEAM|INDIVIDUAL):(\d+)\]\s*/i);
    if (match) {
        if (!taskType) taskType = match[1].toUpperCase();
        if (!volunteersRequired) volunteersRequired = parseInt(match[2], 10);
        cleanDescription = cleanDescription.replace(match[0], '');
    }

    let progressList = task.task_progress;
    if (Array.isArray(progressList)) {
        progressList = [...progressList].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }

    const assignments = task.task_assignments || [];
    const volunteers = assignments
        .map(a => {
            const u = a.volunteers?.users || {};
            const vol = a.volunteers || {};
            return {
                volunteer_id: a.volunteer_id,
                assignment_id: a.assignment_id,
                assignment_status: a.assignment_status,
                name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || 'Volunteer',
                first_name: u.first_name || 'Volunteer',
                last_name: u.last_name || '',
                phone: u.phone,
                email: u.email,
                rating: vol.rating
            };
        })
        .filter(Boolean);

    const latestProgress = progressList && progressList.length > 0 ? progressList[0] : null;
    let calculatedStatus = task.status || 'PENDING';
    const hasCompletedAssignment = assignments.length > 0 && assignments.every(a => a.assignment_status === 'COMPLETED');

    if (hasCompletedAssignment || (latestProgress && latestProgress.progress_percent >= 100) || calculatedStatus === 'COMPLETED') {
        calculatedStatus = 'COMPLETED';
    } else if ((latestProgress && latestProgress.progress_percent >= 50) || calculatedStatus === 'IN_PROGRESS') {
        calculatedStatus = 'IN_PROGRESS';
    } else if (assignments.length > 0 || (latestProgress && latestProgress.progress_percent >= 25) || calculatedStatus === 'ASSIGNED') {
        calculatedStatus = 'ASSIGNED';
    }

    const percent = latestProgress?.progress_percent ?? (
        calculatedStatus === 'COMPLETED' ? 100 : (calculatedStatus === 'IN_PROGRESS' ? 50 : (calculatedStatus === 'ASSIGNED' ? 25 : 0))
    );

    return {
        ...task,
        status: calculatedStatus,
        progress_percent: percent,
        volunteers: volunteers,
        task_type: taskType || (volunteersRequired && volunteersRequired > 1 ? 'TEAM' : 'INDIVIDUAL'),
        volunteers_required: volunteersRequired || 1,
        description: cleanDescription,
        task_progress: progressList,
    };
};

export const createTask = async (taskData) => {
    const isTeam = taskData.task_type === 'TEAM' || (taskData.volunteers_required && taskData.volunteers_required > 1);
    const reqVolunteers = parseInt(taskData.volunteers_required, 10) || (isTeam ? 3 : 1);
    const tag = `[${isTeam ? 'TEAM' : 'INDIVIDUAL'}:${reqVolunteers}] `;
    
    const enhancedDescription = taskData.description ? `${tag}${taskData.description}` : tag;

    const fullPayload = {
        ...taskData,
        description: enhancedDescription,
        task_type: isTeam ? 'TEAM' : 'INDIVIDUAL',
        volunteers_required: reqVolunteers,
    };

    let res = await supabase
        .from("tasks")
        .insert([fullPayload])
        .select()
        .single();

    if (res.error && (res.error.code === 'PGRST204' || res.error.message?.includes('task_type') || res.error.message?.includes('volunteers_required'))) {
        console.warn("Retrying task creation with embedded team tag:", res.error.message);
        const { task_type, volunteers_required, ...baseData } = fullPayload;
        res = await supabase
            .from("tasks")
            .insert([baseData])
            .select()
            .single();
    }

    if (res.data) {
        res.data = formatTaskWithTeamInfo(res.data);
    }

    return res;
};

export const getTasks = async (organizationId) => {
    let query = supabase.from("tasks").select(`
        *,
        organizations ( organization_name, address ),
        task_assignments (
            assignment_id,
            volunteer_id,
            assignment_status,
            assigned_at,
            responded_at,
            completed_at,
            volunteers (
                volunteer_id,
                users ( first_name, last_name, email, phone )
            )
        ),
        task_progress (
            progress_id,
            progress_percent,
            remarks,
            updated_at,
            users ( first_name, last_name, email )
        )
    `).order("created_at", { ascending: false });

    if (organizationId) {
        query = query.eq("organization_id", organizationId);
    }

    let res = await query;

    if (res.error) {
        console.warn("Falling back to basic tasks query:", res.error.message);
        let fallbackQuery = supabase.from("tasks").select(`
            *,
            organizations ( organization_name, address ),
            task_assignments ( volunteer_id )
        `).order("created_at", { ascending: false });

        if (organizationId) {
            fallbackQuery = fallbackQuery.eq("organization_id", organizationId);
        }
        res = await fallbackQuery;
    }

    if (res.data && Array.isArray(res.data)) {
        res.data = res.data.map(formatTaskWithTeamInfo);
    }

    return res;
};

export const getTasksByUserId = async (userId) => {
    const { data: volunteerList, error: volError } = await supabase
        .from("volunteers")
        .select("volunteer_id, organization_id")
        .eq("user_id", userId);

    if (volError) {
        console.error("Error fetching volunteers by user_id:", volError);
    }

    const volunteers = volunteerList || [];
    const volunteerIds = volunteers.map(v => v.volunteer_id).filter(Boolean);
    const orgIds = volunteers.map(v => v.organization_id).filter(Boolean);

    let tasksMap = new Map();

    // 1. Fetch tasks directly assigned to this volunteer
    if (volunteerIds.length > 0) {
        const { data: assignments, error: assignError } = await supabase
            .from("task_assignments")
            .select(`
                task_id,
                assignment_status,
                assigned_at,
                tasks (
                    *,
                    organizations ( organization_name, address ),
                    task_assignments (
                        assignment_id,
                        volunteer_id,
                        assignment_status,
                        volunteers (
                            volunteer_id,
                            users ( first_name, last_name, email )
                        )
                    )
                )
            `)
            .in("volunteer_id", volunteerIds);

        if (!assignError && assignments) {
            for (const a of assignments) {
                if (a.tasks && a.tasks.task_id) {
                    const formatted = formatTaskWithTeamInfo(a.tasks);
                    const activeAssignments = (a.tasks.task_assignments || []).filter(
                        x => x.assignment_status !== 'CANCELLED' && x.assignment_status !== 'REJECTED'
                    );
                    tasksMap.set(a.tasks.task_id, {
                        ...formatted,
                        is_my_assignment: true,
                        my_assignment_status: a.assignment_status,
                        active_volunteers_count: activeAssignments.length,
                        is_full: activeAssignments.length >= formatted.volunteers_required
                    });
                }
            }
        }
    }

    // 2. Fetch all tasks for volunteer's organizations (open pool)
    if (orgIds.length > 0) {
        const { data: orgTasks, error: orgTasksError } = await supabase
            .from("tasks")
            .select(`
                *,
                organizations ( organization_name, address ),
                task_assignments (
                    assignment_id,
                    volunteer_id,
                    assignment_status,
                    volunteers (
                        volunteer_id,
                        users ( first_name, last_name, email )
                    )
                )
            `)
            .in("organization_id", orgIds)
            .order("created_at", { ascending: false });

        if (!orgTasksError && orgTasks) {
            for (const t of orgTasks) {
                if (t && t.task_id && !tasksMap.has(t.task_id)) {
                    const formatted = formatTaskWithTeamInfo(t);
                    const activeAssignments = (t.task_assignments || []).filter(
                        a => a.assignment_status !== 'CANCELLED' && a.assignment_status !== 'REJECTED'
                    );
                    const isFull = activeAssignments.length >= formatted.volunteers_required;

                    tasksMap.set(t.task_id, {
                        ...formatted,
                        is_my_assignment: false,
                        active_volunteers_count: activeAssignments.length,
                        is_full: isFull
                    });
                }
            }
        }
    }

    return { data: Array.from(tasksMap.values()), error: null };
};

export const getTaskById = async (taskId) => {
    let res = await supabase
        .from("tasks")
        .select(`
            *,
            organizations ( organization_name, address ),
            task_assignments (
                assignment_id,
                volunteer_id,
                assignment_status,
                assigned_at,
                responded_at,
                completed_at,
                volunteers (
                    volunteer_id,
                    users ( first_name, last_name, email, phone )
                )
            ),
            task_progress (
                progress_id,
                progress_percent,
                remarks,
                updated_at,
                users ( first_name, last_name, email )
            )
        `)
        .eq("task_id", taskId)
        .single();

    if (res.error) {
        res = await supabase
            .from("tasks")
            .select(`
                *,
                organizations ( organization_name, address ),
                task_assignments ( volunteer_id )
            `)
            .eq("task_id", taskId)
            .single();
    }

    if (res.data) {
        res.data = formatTaskWithTeamInfo(res.data);
    }

    return res;
};

export const updateTask = async (taskId, taskData) => {
    return await supabase
        .from("tasks")
        .update(taskData)
        .eq("task_id", taskId)
        .select()
        .single();
};

export const assignTask = async (taskId, volunteerId, assignedBy) => {
    let assignerId = assignedBy;
    if (!assignerId) {
        const { data: vol } = await supabase
            .from("volunteers")
            .select("user_id")
            .eq("volunteer_id", volunteerId)
            .maybeSingle();
        assignerId = vol?.user_id;
    }

    return await supabase
        .from("task_assignments")
        .insert([{
            task_id: taskId,
            volunteer_id: volunteerId,
            assigned_by: assignerId || volunteerId,
            assignment_status: 'ACCEPTED',
            assigned_at: new Date().toISOString()
        }])
        .select()
        .single();
};

export const updateAssignmentStatus = async (taskId, volunteerId, status) => {
    const updatePayload = {
        assignment_status: status
    };
    if (status === 'COMPLETED') {
        updatePayload.completed_at = new Date().toISOString();
    }
    return await supabase
        .from("task_assignments")
        .update(updatePayload)
        .eq("task_id", taskId)
        .eq("volunteer_id", volunteerId);
};

export const addProgress = async (taskId, userId, progressPercent, remarks) => {
    return await supabase
        .from("task_progress")
        .insert([{
            task_id: taskId,
            updated_by_user_id: userId,
            progress_percent: progressPercent,
            remarks: remarks
        }])
        .select()
        .single();
};

export const getTaskProgress = async (taskId) => {
    return await supabase
        .from("task_progress")
        .select(`
            progress_id,
            progress_percent,
            remarks,
            updated_at,
            users ( first_name, last_name, email )
        `)
        .eq("task_id", taskId)
        .order("updated_at", { ascending: false });
};
