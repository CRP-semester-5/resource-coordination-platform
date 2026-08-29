import { supabase } from "../lib/supabase.js";

export const createDonation = async (donationData) => {
    return await supabase
        .from("donations")
        .insert([donationData])
        .select()
        .single();
};

export const create = createDonation;

export const findAll = async (organization_id, user_id) => {
    let query = supabase
        .from("donations")
        .select("*, users!donor_id(first_name, last_name)");

    if (organization_id) {
        query = query.eq("organization_id", organization_id);
    } else if (user_id) {
        query = query.eq("donor_id", user_id);
    }

    return await query.order("created_at", { ascending: false });
};

export const findById = async (donationId) => {
    return await supabase
        .from("donations")
        .select("*, users!donor_id(first_name, last_name, email, phone)")
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
