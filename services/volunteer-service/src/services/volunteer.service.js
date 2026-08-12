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
        availability_status: "AVAILABLE"
    });

    if (error) throw new AppError(500, error.message);

    // Add skills if provided
    if (data.skills && Array.isArray(data.skills)) {
        for (const skill of data.skills) {
            try {
                await volunteerRepo.addSkill(created.volunteer_id, skill);
            } catch (e) {
                console.error("Failed to add skill:", e);
            }
        }
    }

    return created;
};

export const getVolunteers = async () => {
    const { data, error } = await volunteerRepo.getVolunteers();
    if (error) throw new AppError(500, error.message);
    return data;
};

export const getVolunteerById = async (id) => {
    const { data, error } = await volunteerRepo.getVolunteerById(id);
    if (error) {
        if (error.code === 'PGRST116') throw new AppError(404, "Volunteer not found");
        throw new AppError(500, error.message);
    }
    return data;
};

export const addSkill = async (volunteerId, skillName) => {
    const { data, error } = await volunteerRepo.addSkill(volunteerId, skillName);
    if (error) {
        if (error.code === '23505') throw new AppError(409, "Skill already added");
        throw new AppError(500, error.message);
    }
    return data;
};
