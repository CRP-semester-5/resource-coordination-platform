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
            users ( first_name, last_name, email, phone ),
            volunteer_skills ( skills ( skill_name ) )
        `);
};

export const getVolunteerById = async (id) => {
    return await supabase
        .from("volunteers")
        .select(`
            *,
            users ( first_name, last_name, email, phone ),
            volunteer_skills ( skills ( skill_name ) )
        `)
        .eq("volunteer_id", id)
        .single();
};

export const getVolunteerByUserId = async (userId) => {
    return await supabase
        .from("volunteers")
        .select(`
            *,
            users ( first_name, last_name, email, phone ),
            volunteer_skills ( skills ( skill_name ) )
        `)
        .eq("user_id", userId)
        .single();
};

export const getOrCreateSkill = async (skillName) => {
    let { data, error } = await supabase.from("skills").select("*").eq("skill_name", skillName).maybeSingle();
    if (!data) {
        const res = await supabase.from("skills").insert([{ skill_name: skillName }]).select().single();
        data = res.data;
        error = res.error;
    }
    return { data, error };
};

export const addSkill = async (volunteerId, skillId) => {
    return await supabase
        .from("volunteer_skills")
        .insert([{ volunteer_id: volunteerId, skill_id: skillId }])
        .select()
        .single();
};
