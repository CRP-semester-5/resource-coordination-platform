import { supabase } from "../lib/supabase.js";

export const createDonation = async (donationData) => {
    return await supabase
        .from("donations")
        .insert([donationData])
        .select()
        .single();
};

export const findAll = async () => {
    return await supabase
        .from("donations")
        .select("*, users!donations_donor_id_fkey (first_name, last_name, email)")
        .order("created_at", { ascending: false });
};

export const findById = async (donationId) => {
    return await supabase
        .from("donations")
        .select("*, users!donations_donor_id_fkey (first_name, last_name, email)")
        .eq("donation_id", donationId)
        .single();
};

export const update = async (donationId, updateData) => {
    return await supabase
        .from("donations")
        .update(updateData)
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

