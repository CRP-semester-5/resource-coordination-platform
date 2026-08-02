import { supabase } from '../lib/supabase.js'

export class TaskRepository {
  static async createTask(taskData) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async getTasksByOrg(organizationId) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        requests (title, urgency, category, status),
        users (first_name, last_name, email)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  }

  static async getTaskById(taskId, organizationId) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        requests (title, urgency, category, status),
        users (first_name, last_name, email),
        task_assignments (
          assignment_id,
          assignment_status,
          assigned_at,
          volunteers (
            volunteer_id,
            availability_status,
            users (first_name, last_name, email, phone)
          )
        ),
        task_progress (
          progress_id,
          progress_percent,
          remarks,
          updated_at,
          users (first_name, last_name)
        )
      `)
      .eq('task_id', taskId)
      .eq('organization_id', organizationId)
      .single()
    if (error) throw error
    return data
  }

  static async updateTask(taskId, organizationId, updateData) {
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('task_id', taskId)
      .eq('organization_id', organizationId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async updateTaskStatus(taskId, organizationId, status) {
    const updateData = { status }
    if (status === 'COMPLETED') updateData.completed_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('task_id', taskId)
      .eq('organization_id', organizationId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  // Volunteer Assignments
  static async assignVolunteer(assignmentData) {
    const { data, error } = await supabase
      .from('task_assignments')
      .insert([assignmentData])
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async updateAssignmentStatus(assignmentId, taskId, status) {
    const updateData = { assignment_status: status, responded_at: new Date().toISOString() }
    if (status === 'COMPLETED') updateData.completed_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('task_assignments')
      .update(updateData)
      .eq('assignment_id', assignmentId)
      .eq('task_id', taskId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  // Task Progress
  static async addProgress(progressData) {
    const { data, error } = await supabase
      .from('task_progress')
      .insert([progressData])
      .select()
      .single()
    if (error) throw error
    return data
  }

  static async getTaskProgress(taskId) {
    const { data, error } = await supabase
      .from('task_progress')
      .select(`
        *,
        users (first_name, last_name)
      `)
      .eq('task_id', taskId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data
  }
}
