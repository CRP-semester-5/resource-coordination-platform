import { TaskRepository } from '../repositories/task.repository.js'
import {
  createTaskSchema,
  updateTaskSchema,
  updateStatusSchema,
  assignVolunteerSchema,
  assignmentResponseSchema,
  progressSchema
} from '../validators/task.validator.js'

export const createTask = async (req, res, next) => {
  try {
    const { error, value } = createTaskSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const coordinatorId = req.user.sub

    const taskData = {
      ...value,
      organization_id: organizationId,
      coordinator_id: coordinatorId
    }

    const task = await TaskRepository.createTask(taskData)
    res.status(201).json({ message: 'Task created successfully', task })
  } catch (err) {
    next(err)
  }
}

export const getTasks = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const tasks = await TaskRepository.getTasksByOrg(organizationId)
    res.json({ tasks })
  } catch (err) {
    next(err)
  }
}

export const getTaskById = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const { taskId } = req.params
    const task = await TaskRepository.getTaskById(taskId, organizationId)
    res.json({ task })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Task not found' })
    }
    next(err)
  }
}

export const updateTask = async (req, res, next) => {
  try {
    const { error, value } = updateTaskSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const { taskId } = req.params

    const task = await TaskRepository.updateTask(taskId, organizationId, value)
    res.json({ message: 'Task updated successfully', task })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Task not found' })
    }
    next(err)
  }
}

export const updateTaskStatus = async (req, res, next) => {
  try {
    const { error, value } = updateStatusSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const { taskId } = req.params

    const task = await TaskRepository.updateTaskStatus(taskId, organizationId, value.status)
    res.json({ message: 'Task status updated successfully', task })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Task not found' })
    }
    next(err)
  }
}

export const assignVolunteer = async (req, res, next) => {
  try {
    const { error, value } = assignVolunteerSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const { taskId } = req.params
    const assignedBy = req.user.sub

    const assignmentData = {
      task_id: taskId,
      volunteer_id: value.volunteer_id,
      assigned_by: assignedBy
    }

    const assignment = await TaskRepository.assignVolunteer(assignmentData)
    res.status(201).json({ message: 'Volunteer assigned successfully', assignment })
  } catch (err) {
    // Unique constraint violation for task_id + volunteer_id
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Volunteer is already assigned to this task' })
    }
    next(err)
  }
}

export const respondToAssignment = async (req, res, next) => {
  try {
    const { error, value } = assignmentResponseSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const { taskId, assignmentId } = req.params
    const assignment = await TaskRepository.updateAssignmentStatus(assignmentId, taskId, value.assignment_status)
    res.json({ message: 'Assignment status updated successfully', assignment })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Assignment not found' })
    }
    next(err)
  }
}

export const addTaskProgress = async (req, res, next) => {
  try {
    const { error, value } = progressSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const { taskId } = req.params
    const userId = req.user.sub

    const progressData = {
      task_id: taskId,
      updated_by_user_id: userId,
      ...value
    }

    const progress = await TaskRepository.addProgress(progressData)
    res.status(201).json({ message: 'Progress added successfully', progress })
  } catch (err) {
    next(err)
  }
}

export const getTaskProgress = async (req, res, next) => {
  try {
    const { taskId } = req.params
    const progress = await TaskRepository.getTaskProgress(taskId)
    res.json({ progress })
  } catch (err) {
    next(err)
  }
}
