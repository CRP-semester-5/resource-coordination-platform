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

export const findById = async (organizationId) => {
    return await supabase
        .from("organizations")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();
};