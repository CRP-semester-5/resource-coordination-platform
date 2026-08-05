import { supabase } from "../lib/supabase.js";

export const findByName = async (organizationName) => {
    return await supabase
        .from("organizations")
        .select("*")
        .eq("organization_name", organizationName)
        .maybeSingle();
};

export const create = async (organizationData) => {
    return await supabase
        .from("organizations")
        .insert([organizationData])
        .select()
        .single();
};

export const findAll = async () => {
    return await supabase
        .from("organizations")
        .select("*")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });
};

export const findPending = async () => {
    return await supabase
        .from("organizations")
        .select(`
            *,
            users!applicant_id ( first_name, last_name, email )
        `)
        .eq("status", "PENDING")
        .order("created_at", { ascending: false });
};

export const findUserOrganizations = async (userId) => {
    return await supabase
        .from("organization_members")
        .select(`
            role,
            status,
            organization_id,
            organizations (*)
        `)
        .eq("user_id", userId)
        .eq("status", "ACTIVE")
        .eq("organizations.status", "ACTIVE");
};

export const findById = async (organizationId) => {
    return await supabase
        .from("organizations")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();
};

export const update = async (organizationId, organizationData) => {
    return await supabase
        .from("organizations")
        .update(organizationData)
        .eq("organization_id", organizationId)
        .select()
        .single();
};

export const softDelete = async (organizationId) => {
    return await supabase
        .from("organizations")
        .update({
            status: "INACTIVE"
        })
        .eq("organization_id", organizationId)
        .select()
        .single();
};

export const updateStatus = async (organizationId, status) => {
    return await supabase
        .from("organizations")
        .update({
            status: status
        })
        .eq("organization_id", organizationId)
        .select()
        .single();
};
