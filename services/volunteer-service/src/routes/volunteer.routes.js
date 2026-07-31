import express from 'express'
import { authenticate } from '@crp/shared-middleware'
import {
  createVolunteerProfile,
  getVolunteers,
  getVolunteerById,
  updateVolunteerProfile,
  addSkillToVolunteer,
  removeSkillFromVolunteer,
  addAvailability,
  getAvailability,
  updateAvailability
} from '../controllers/volunteer.controller.js'

const router = express.Router()

//all volunteer routes authentication
router.use(authenticate)

//volunteer profile
router.post('/', createVolunteerProfile)
router.get('/', getVolunteers)
router.get('/:volunteerId', getVolunteerById)
router.patch('/:volunteerId', updateVolunteerProfile)

//volunteer skills
router.post('/:volunteerId/skills', addSkillToVolunteer)
router.delete('/:volunteerId/skills/:skillId', removeSkillFromVolunteer)

//volunteer availability
router.post('/:volunteerId/availability', addAvailability)
router.get('/:volunteerId/availability', getAvailability)
router.patch('/:volunteerId/availability/:availabilityId', updateAvailability)

export default router

