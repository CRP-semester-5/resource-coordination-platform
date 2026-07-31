import { supabase } from '../lib/supabase.js'

export class VolunteerRepository {
  static async createVolunteer(volunteerData) {
    const { data, error } = await supabase
      .from('volunteers')
      .insert([volunteerData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getVolunteersByOrg(organizationId) {
    const { data, error } = await supabase
      .from('volunteers')
      .select(`
        *,
        users (first_name, last_name, email, phone)
      `)
      .eq('organization_id', organizationId)

    if (error) throw error
    return data
  }

  static async getVolunteerById(volunteerId, organizationId) {
    const { data, error } = await supabase
      .from('volunteers')
      .select(`
        *,
        users (first_name, last_name, email, phone)
      `)
      .eq('volunteer_id', volunteerId)
      .eq('organization_id', organizationId)
      .single()

    if (error) throw error
    return data
  }

  static async updateVolunteer(volunteerId, organizationId, updateData) {
    const { data, error } = await supabase
      .from('volunteers')
      .update(updateData)
      .eq('volunteer_id', volunteerId)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async findSkillByName(skillName) {
    const { data, error } = await supabase
      .from('skills')
      .select('*')
      .ilike('skill_name', skillName)
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async createSkill(skillName) {
    const { data, error } = await supabase
      .from('skills')
      .insert([{ skill_name: skillName }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async assignSkillToVolunteer(volunteerId, skillId, proficiencyLevel) {
    const { data, error } = await supabase
      .from('volunteer_skills')
      .upsert({
        volunteer_id: volunteerId,
        skill_id: skillId,
        proficiency_level: proficiencyLevel,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async removeSkillFromVolunteer(volunteerId, skillId) {
    const { error } = await supabase
      .from('volunteer_skills')
      .delete()
      .eq('volunteer_id', volunteerId)
      .eq('skill_id', skillId)

    if (error) throw error
    return true
  }

  static async addAvailability(availabilityData) {
    const { data, error } = await supabase
      .from('volunteer_availability')
      .insert([availabilityData])
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getAvailability(volunteerId) {
    const { data, error } = await supabase
      .from('volunteer_availability')
      .select('*')
      .eq('volunteer_id', volunteerId)
      .order('available_date', { ascending: true })

    if (error) throw error
    return data
  }

  static async updateAvailability(availabilityId, volunteerId, updateData) {
    const { data, error } = await supabase
      .from('volunteer_availability')
      .update(updateData)
      .eq('availability_id', availabilityId)
      .eq('volunteer_id', volunteerId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
