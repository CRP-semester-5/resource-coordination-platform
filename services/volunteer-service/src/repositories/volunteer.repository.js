import { supabase } from "../lib/supabase.js";

export const createVolunteer = async (volunteerData) => {
    return await supabase
        .from("volunteers")
        .insert([volunteerData])
        .select()
        .single();
};

export const getVolunteers = async () => {
    return await supabase
        .from("volunteers")
        .select(`
            *,
            users ( first_name, last_name, email ),
            volunteer_skills ( skills ( skill_name ) )
        `);
};

export const getVolunteerById = async (id) => {
    return await supabase
        .from("volunteers")
        .select(`
            *,
            users ( first_name, last_name, email ),
            volunteer_skills ( skills ( skill_name ) )
        `)
        .eq("volunteer_id", id)
        .single();
};

export const getVolunteerByUserId = async (userId) => {
    return await supabase
        .from("volunteers")
        .select("*")
        .eq("user_id", userId)
        .single();
};

export const addSkill = async (volunteerId, skillName) => {
    return await supabase
        .from("volunteer_skills")
        .insert([{ volunteer_id: volunteerId, skill_name: skillName }])
        .select()
        .single();
};
