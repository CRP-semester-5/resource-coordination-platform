import { supabase } from "../lib/supabase.js";

export const createVolunteer = async (volunteerData) => {
    // Fetch the first organization to act as default
    const { data: orgData } = await supabase
        .from("organizations")
        .select("organization_id")
        .limit(1)
        .single();
        
    const orgId = orgData?.organization_id;
    if (!orgId) {
        throw new Error("No organization found in the database. Please create one first.");
    }

    volunteerData.organization_id = orgId;

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
    // Check if skill exists
    let { data: skill } = await supabase
        .from("skills")
        .select("skill_id")
        .eq("skill_name", skillName)
        .single();
        
    // If not, create it
    if (!skill) {
        const { data: newSkill } = await supabase
            .from("skills")
            .insert([{ skill_name: skillName }])
            .select("skill_id")
            .single();
        skill = newSkill;
    }
    
    if (!skill) throw new Error("Failed to resolve skill ID");

    return await supabase
        .from("volunteer_skills")
        .insert([{ volunteer_id: volunteerId, skill_id: skill.skill_id }])
        .select()
        .single();
};
