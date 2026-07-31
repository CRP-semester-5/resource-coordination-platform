import express from 'express'
import { authenticate, requireRole } from '@crp/shared-middleware'
import {
  createVolunteerProfile,
  getVolunteers,
  getVolunteerById,
  updateVolunteerProfile,
  addSkillToVolunteer,
  removeSkillFromVolunteer,
  addAvailability,
  getAvailability,
  updateAvailability,
  addCertification,
  getCertifications,
  updateCertification,
  deleteCertification,
  updateVerificationStatus
} from '../controllers/volunteer.controller.js'

const router = express.Router()

//all volunteer routes authentication
router.use(authenticate)

//volunteer profile
router.post('/', createVolunteerProfile)
router.get('/', getVolunteers)
router.get('/:volunteerId', getVolunteerById)
router.patch('/:volunteerId', updateVolunteerProfile)
router.patch('/:volunteerId/verify', requireRole('COORDINATOR', 'ORGANIZATION_ADMIN'), updateVerificationStatus)

//volunteer skills
router.post('/:volunteerId/skills', addSkillToVolunteer)
router.delete('/:volunteerId/skills/:skillId', removeSkillFromVolunteer)

//volunteer availability
router.post('/:volunteerId/availability', addAvailability)
router.get('/:volunteerId/availability', getAvailability)
router.patch('/:volunteerId/availability/:availabilityId', updateAvailability)

//volunteer certifications
router.post('/:volunteerId/certifications', addCertification)
router.get('/:volunteerId/certifications', getCertifications)
router.patch('/:volunteerId/certifications/:certificationId', updateCertification)
router.delete('/:volunteerId/certifications/:certificationId', deleteCertification)

export default router
