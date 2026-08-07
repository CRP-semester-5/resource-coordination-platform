import express from 'express'
import { authenticate, requireRole } from '@crp/shared-middleware'
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskStatus,
  assignVolunteer,
  respondToAssignment,
  addTaskProgress,
  getTaskProgress
} from '../controllers/task.controller.js'

const router = express.Router()

// All task routes require authentication
router.use(authenticate)

// Task CRUD operations
router.post('/', requireRole('COORDINATOR', 'ORGANIZATION_ADMIN'), createTask)
router.get('/', getTasks)
router.get('/:taskId', getTaskById)
router.patch('/:taskId', requireRole('COORDINATOR', 'ORGANIZATION_ADMIN'), updateTask)
router.patch('/:taskId/status', requireRole('COORDINATOR', 'ORGANIZATION_ADMIN'), updateTaskStatus)

// Assignments
router.post('/:taskId/assignments', requireRole('COORDINATOR', 'ORGANIZATION_ADMIN'), assignVolunteer)
router.patch('/:taskId/assignments/:assignmentId', respondToAssignment) // Volunteers update their own assignment

// Progress
router.post('/:taskId/progress', addTaskProgress) // Volunteers or Coordinators can post progress
router.get('/:taskId/progress', getTaskProgress)

export default router
