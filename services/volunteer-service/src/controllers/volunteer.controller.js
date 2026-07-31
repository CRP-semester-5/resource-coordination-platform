import { VolunteerRepository } from '../repositories/volunteer.repository.js'
import {
  createVolunteerSchema,
  updateVolunteerSchema,
  addSkillSchema,
  addAvailabilitySchema,
  updateAvailabilitySchema
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
    const volunteers = await VolunteerRepository.getVolunteersByOrg(organizationId)
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
