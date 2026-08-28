import { supabase } from "../lib/supabase.js";


export const findAll = async (organization_id) => {
    return await supabase
        .from("donations")
        .select("*, users!donor_id(first_name, last_name)")
        .eq("organization_id",organization_id)
        .order("created_at", { ascending: false });
};


export const findById = async (donationId) => {
    return await supabase
        .from("donations")
        .select("*")
        .eq("donation_id", donationId)
        .single();
};


export const create = async (donationData) => {
    return await supabase
        .from("donations")
        .insert([donationData])
        .select()
        .single();
};


export const update = async (donationId, donationData) => {
    return await supabase
        .from("donations")
        .update(donationData)
        .eq("donation_id", donationId)
        .select()
        .single();
};


export const remove = async (donationId) => {
    return await supabase
        .from("donations")
        .delete()
        .eq("donation_id", donationId);
};
