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
    if (!donationData.organization_id) {
        // Fetch the first organization to act as default
        const { data: orgData } = await supabase
            .from("organizations")
            .select("organization_id")
            .limit(1)
            .single();
            
        if (orgData?.organization_id) {
            donationData.organization_id = orgData.organization_id;
        }
    }

    const result = await supabase
        .from("donations")
        .insert([donationData])
        .select()
        .single();
        
    if (result.error) {
        console.error("Supabase insert error:", result.error);
    }
    
    return result;
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
