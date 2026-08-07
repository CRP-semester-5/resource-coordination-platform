import * as volunteerService from "../services/volunteer.service.js";

export const registerVolunteer = async (req, res, next) => {
    try {
        const userId = req.user.user_id; // from authenticate
        const volunteer = await volunteerService.registerVolunteer(userId, req.body);
        return res.status(201).json({ success: true, data: volunteer });
    } catch (error) {
        next(error);
    }
};

export const getVolunteers = async (req, res, next) => {
    try {
        const volunteers = await volunteerService.getVolunteers();
        return res.json({ success: true, data: volunteers });
    } catch (error) {
        next(error);
    }
};

export const getVolunteerById = async (req, res, next) => {
    try {
        const volunteer = await volunteerService.getVolunteerById(req.params.id);
        return res.json({ success: true, data: volunteer });
    } catch (error) {
        next(error);
    }
};

export const addSkill = async (req, res, next) => {
    try {
        const { skill_name } = req.body;
        if (!skill_name) return res.status(400).json({ success: false, message: "skill_name is required" });
        
        const skill = await volunteerService.addSkill(req.params.id, skill_name);
        return res.status(201).json({ success: true, data: skill });
    } catch (error) {
        next(error);
    }
};
