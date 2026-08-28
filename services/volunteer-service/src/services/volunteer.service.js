import * as volunteerRepo from "../repositories/volunteer.repository.js";
import { AppError } from "@crp/shared-middleware";

export const registerVolunteer = async (userId, data) => {
    // Check if already registered
    const { data: existing, error: existError } = await volunteerRepo.getVolunteerByUserId(userId);
    if (!existError && existing) {
        throw new AppError(400, "User is already registered as a volunteer");
    }

    const { data: created, error } = await volunteerRepo.createVolunteer({
        user_id: userId,
        phone_number: data.phone_number,
        is_available: data.is_available ?? true
    });

    if (error) throw new AppError(500, error.message);
    return created;
};

const formatVolunteer = (v) => {
    if (!v) return v;
    const formatted = { ...v };
    if (formatted.users) {
        formatted.users.name = `${formatted.users.first_name} ${formatted.users.last_name}`.trim();
    }
    if (formatted.volunteer_skills) {
        formatted.volunteer_skills = formatted.volunteer_skills.map(vs => ({
            ...vs,
            skill_name: vs.skills?.skill_name
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

export const addSkill = async (volunteerId, skillName) => {
    const { data, error } = await volunteerRepo.addSkill(volunteerId, skillName);
    if (error) {
        if (error.code === '23505') throw new AppError(409, "Skill already added");
        throw new AppError(500, error.message);
    }
    return data;
};
