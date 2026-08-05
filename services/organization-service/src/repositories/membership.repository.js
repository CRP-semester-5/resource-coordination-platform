import { supabase } from "../lib/supabase.js";

// Check whether a user is already a member of the organization
export const findExistingMembership = async (organizationId, userId) => {
    return await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .maybeSingle();
};

// Create membership
export const createMembership = async (membershipData) => {
    return await supabase
        .from("organization_members")
        .insert([membershipData])
        .select()
        .single();
};

// Get all members of an organization
export const getMembers = async (organizationId) => {
    return await supabase
        .from("organization_members")
        .select(`
            organization_member_id,
            role,
            status,
            users ( user_id, first_name, last_name, email, profile_image )
        `)
        .eq("organization_id", organizationId);
};

// Get membership by ID
export const getMembershipById = async (membershipId) => {
    return await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_member_id", membershipId)
        .maybeSingle();
};

// Update membership
export const updateMembership = async (membershipId, updateData) => {
    return await supabase
        .from("organization_members")
        .update(updateData)
        .eq("organization_member_id", membershipId)
        .select()
        .single();
};

// Delete membership
export const deleteMembership = async (membershipId) => {
    return await supabase
        .from("organization_members")
        .update({
            status: "INACTIVE"
        })
        .eq("organization_member_id", membershipId);
};