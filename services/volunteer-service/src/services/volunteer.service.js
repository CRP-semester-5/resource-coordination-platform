import * as volunteerRepo from "../repositories/volunteer.repository.js";
import { AppError } from "@crp/shared-middleware";
import { supabase } from "../lib/supabase.js";

export const registerVolunteer = async (userId, data) => {
    // If phone number provided, update user profile phone if missing
    if (data.phone_number) {
        try {
            await supabase.from("users").update({ phone: data.phone_number }).eq("user_id", userId);
        } catch (e) {
            console.error("Failed to update user phone:", e);
        }
    }

    let volunteerRecord;
    // Check if already registered
    const { data: existing, error: existError } = await volunteerRepo.getVolunteerByUserId(userId);
    
    if (!existError && existing) {
        // Update existing volunteer application
        const { data: updated, error: updateErr } = await supabase
            .from("volunteers")
            .update({
                availability_status: data.is_available === false ? 'UNAVAILABLE' : 'AVAILABLE',
                experience_years: data.experience_years || 0,
                updated_at: new Date().toISOString()
            })
            .eq("volunteer_id", existing.volunteer_id)
            .select()
            .single();

        if (updateErr) throw new AppError(500, updateErr.message);
        volunteerRecord = updated;

        // Clear existing skills to re-sync
        await supabase.from("volunteer_skills").delete().eq("volunteer_id", existing.volunteer_id);
    } else {
        let orgId = data.organization_id;
        if (!orgId) {
            const { data: orgData } = await supabase.from("organizations").select("organization_id").limit(1);
            if (orgData && orgData.length > 0) {
                orgId = orgData[0].organization_id;
            } else {
                throw new AppError(400, "No organizations found to join.");
            }
        }

        const { data: created, error } = await volunteerRepo.createVolunteer({
            user_id: userId,
            organization_id: orgId,
            availability_status: data.is_available === false ? 'UNAVAILABLE' : 'AVAILABLE',
            experience_years: data.experience_years || 0
        });

        if (error) throw new AppError(500, error.message);
        volunteerRecord = created;
    }

    // Save skills
    if (data.skills && Array.isArray(data.skills)) {
        for (const skillName of data.skills) {
            if (!skillName || typeof skillName !== "string" || !skillName.trim()) continue;
            const cleanSkill = skillName.trim();
            const { data: skillData, error: skillError } = await volunteerRepo.getOrCreateSkill(cleanSkill);
            if (!skillError && skillData) {
                await volunteerRepo.addSkill(volunteerRecord.volunteer_id, skillData.skill_id);
            }
        }
    }

    return formatVolunteer(await getVolunteerById(volunteerRecord.volunteer_id));
};

const formatVolunteer = (v) => {
    if (!v) return v;
    const formatted = { ...v };
    if (formatted.users) {
        formatted.users.name = `${formatted.users.first_name || ''} ${formatted.users.last_name || ''}`.trim() || 'Volunteer';
    }
    if (formatted.volunteer_skills && Array.isArray(formatted.volunteer_skills)) {
        formatted.volunteer_skills = formatted.volunteer_skills.map(vs => ({
            ...vs,
            skill_name: vs.skills?.skill_name || 'Skill'
        }));
    }
    return formatted;
};

export const getVolunteers = async () => {
    const { data, error } = await volunteerRepo.getVolunteers();
    if (error) throw new AppError(500, error.message);
    return data.map(formatVolunteer);
};

export const getVolunteerById = async (id) => {
    const { data, error } = await volunteerRepo.getVolunteerById(id);
    if (error) {
        if (error.code === 'PGRST116') throw new AppError(404, "Volunteer not found");
        throw new AppError(500, error.message);
    }
    return formatVolunteer(data);
};

export const getVolunteerByUserId = async (userId) => {
    const { data, error } = await volunteerRepo.getVolunteerByUserId(userId);
    if (error) {
        if (error.code === 'PGRST116') throw new AppError(404, "Volunteer not found");
        throw new AppError(500, error.message);
    }
    return formatVolunteer(data);
};

export const addSkill = async (volunteerId, skillName) => {
    const { data: skillData, error: skillError } = await volunteerRepo.getOrCreateSkill(skillName);
    if (skillError) throw new AppError(500, skillError.message);

    const { data, error } = await volunteerRepo.addSkill(volunteerId, skillData.skill_id);
    if (error) {
        if (error.code === '23505') throw new AppError(409, "Skill already added");
        throw new AppError(500, error.message);
    }
    return data;
};
