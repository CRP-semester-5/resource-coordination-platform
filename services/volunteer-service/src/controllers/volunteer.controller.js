import { VolunteerRepository } from '../repositories/volunteer.repository.js'
import {
  createVolunteerSchema,
  updateVolunteerSchema,
  addSkillSchema,
  addAvailabilitySchema,
  updateAvailabilitySchema,
  addCertificationSchema,
  updateCertificationSchema,
  updateVerificationSchema
} from '../validators/volunteer.validator.js'

export const createVolunteerProfile = async (req, res, next) => {
  try {
    const { error, value } = createVolunteerSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const userId = req.user.sub

    try {
      const existing = await VolunteerRepository.getVolunteerById(null, organizationId)
    } catch (e) { }

    try {
      const newVolunteer = await VolunteerRepository.createVolunteer({
        organization_id: organizationId,
        user_id: userId,
        experience_years: value.experience_years,
        availability_status: value.availability_status
      })
      res.status(201).json({ message: 'Volunteer profile created', volunteer: newVolunteer })
    } catch (dbError) {
      if (dbError.code === '23505') {
        return res.status(409).json({ message: 'Volunteer profile already exists in this organization.' })
      }
      throw dbError
    }
  } catch (err) {
    next(err)
  }
}

export const getVolunteers = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const filters = {
      skill_name: req.query.skill_name,
      availability_status: req.query.availability_status
    }
    const volunteers = await VolunteerRepository.getVolunteersByOrg(organizationId, filters)
    res.json({ volunteers })
  } catch (err) {
    next(err)
  }
}


export const getVolunteerById = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const { volunteerId } = req.params
    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)

    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    res.json({ volunteer })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Volunteer not found' })
    }
    next(err)
  }
}

export const updateVolunteerProfile = async (req, res, next) => {
  try {
    const { error, value } = updateVolunteerSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const { volunteerId } = req.params

    const updated = await VolunteerRepository.updateVolunteer(volunteerId, organizationId, value)
    res.json({ message: 'Volunteer profile updated', volunteer: updated })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Volunteer not found' })
    }
    next(err)
  }
}

export const updateVerificationStatus = async (req, res, next) => {
  try {
    const { error, value } = updateVerificationSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const { volunteerId } = req.params

    const updated = await VolunteerRepository.updateVerificationStatus(volunteerId, organizationId, value.verification_status)
    res.json({ message: 'Verification status updated', volunteer: updated })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Volunteer not found' })
    }
    next(err)
  }
}

export const addSkillToVolunteer = async (req, res, next) => {
  try {
    const { error, value } = addSkillSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const { volunteerId } = req.params

    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    let skill = await VolunteerRepository.findSkillByName(value.skill_name)
    if (!skill) {
      skill = await VolunteerRepository.createSkill(value.skill_name)
    }

    const assigned = await VolunteerRepository.assignSkillToVolunteer(
      volunteerId,
      skill.skill_id,
      value.proficiency_level
    )

    res.status(201).json({ message: 'Skill assigned to volunteer', skill: assigned })
  } catch (err) {
    next(err)
  }
}

export const removeSkillFromVolunteer = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const { volunteerId, skillId } = req.params

    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    await VolunteerRepository.removeSkillFromVolunteer(volunteerId, skillId)
    res.json({ message: 'Skill removed from volunteer' })
  } catch (err) {
    next(err)
  }
}

export const addAvailability = async (req, res, next) => {
  try {
    const { error, value } = addAvailabilitySchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const { volunteerId } = req.params

    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    const availability = await VolunteerRepository.addAvailability({
      volunteer_id: volunteerId,
      available_date: value.available_date,
      start_time: value.start_time,
      end_time: value.end_time,
      status: value.status
    })

    res.status(201).json({ message: 'Availability added', availability })
  } catch (err) {
    next(err)
  }
}

export const getAvailability = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const { volunteerId } = req.params

    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    const availability = await VolunteerRepository.getAvailability(volunteerId)
    res.json({ availability })
  } catch (err) {
    next(err)
  }
}

export const updateAvailability = async (req, res, next) => {
  try {
    const { error, value } = updateAvailabilitySchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const { volunteerId, availabilityId } = req.params

    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    const updated = await VolunteerRepository.updateAvailability(availabilityId, volunteerId, value)
    res.json({ message: 'Availability updated', availability: updated })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Availability not found' })
    }
    next(err)
  }
}


export const addCertification = async (req, res, next) => {
  try {
    const { error, value } = addCertificationSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const { volunteerId } = req.params

    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    const certification = await VolunteerRepository.addCertification({
      volunteer_id: volunteerId,
      ...value,
    })

    res.status(201).json({ message: 'Certification added', certification })
  } catch (err) {
    next(err)
  }
}

export const getCertifications = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const { volunteerId } = req.params

    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    const certifications = await VolunteerRepository.getCertifications(volunteerId)
    res.json({ certifications })
  } catch (err) {
    next(err)
  }
}

export const updateCertification = async (req, res, next) => {
  try {
    const { error, value } = updateCertificationSchema.validate(req.body)
    if (error) return res.status(400).json({ message: error.details[0].message })

    const organizationId = req.headers['x-organization-id']
    const { volunteerId, certificationId } = req.params

    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    const updated = await VolunteerRepository.updateCertification(certificationId, volunteerId, value)
    res.json({ message: 'Certification updated', certification: updated })
  } catch (err) {
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Certification not found' })
    }
    next(err)
  }
}

export const deleteCertification = async (req, res, next) => {
  try {
    const organizationId = req.headers['x-organization-id']
    const { volunteerId, certificationId } = req.params

    const volunteer = await VolunteerRepository.getVolunteerById(volunteerId, organizationId)
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' })

    await VolunteerRepository.deleteCertification(certificationId, volunteerId)
    res.json({ message: 'Certification deleted' })
  } catch (err) {
    next(err)
  }
}

