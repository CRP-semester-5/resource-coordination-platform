import { supabase } from "../lib/supabase.js";


export const findAll = async () => {
    return await supabase
        .from("donations")
        .select("*");
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