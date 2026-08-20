import * as volunteerRepo from "../repositories/volunteer.repository.js";
import { AppError } from "@crp/shared-middleware";

export const createVolunteerService = (repository = volunteerRepo) => {
 const registerVolunteer = async (userId, data) => {
    // Check if already registered
    const { data: existing, error: existError } = await repository.getVolunteerByUserId(userId);
    if (!existError && existing) {
        throw new AppError(400, "User is already registered as a volunteer");
    }

    const { data: created, error } = await repository.createVolunteer({
        user_id: userId,
        availability_status: "AVAILABLE"
    });

    if (error) throw new AppError(500, error.message);

    // Add skills if provided
    if (data.skills && Array.isArray(data.skills)) {
        for (const skill of data.skills) {
            try {
                await repository.addSkill(created.volunteer_id, skill);
            } catch (e) {
                console.error("Failed to add skill:", e);
            }
        }
    }

    return created;
};

 const getVolunteers = async () => {
    const { data, error } = await repository.getVolunteers();
    if (error) throw new AppError(500, error.message);
    return data;
};

 const getVolunteerById = async (id) => {
    const { data, error } = await repository.getVolunteerById(id);
    if (error) {
        if (error.code === 'PGRST116') throw new AppError(404, "Volunteer not found");
        throw new AppError(500, error.message);
    }
    return data;
};

 const addSkill = async (volunteerId, skillName) => {
    const { data, error } = await repository.addSkill(volunteerId, skillName);
    if (error) {
        if (error.code === '23505') throw new AppError(409, "Skill already added");
        throw new AppError(500, error.message);
    }
    return data;
};

 return { registerVolunteer, getVolunteers, getVolunteerById, addSkill };
};

const service = createVolunteerService();
export const { registerVolunteer, getVolunteers, getVolunteerById, addSkill } = service;
