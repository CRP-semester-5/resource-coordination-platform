import { supabase } from "../lib/supabase.js";

export const create = async (resourceData) => {
    return await supabase
        .from("resources")
        .insert([resourceData])
        .select()
        .single();
};

export const findAll = async () => {
    return await supabase
        .from("resources")
        .select("*");
};

export const findById = async (resourceId) => {
    return await supabase
        .from("resources")
        .select("*")
        .eq("resource_id", resourceId)
        .single();
};

export const update = async (resourceId, resourceData) => {
    return await supabase
        .from("resources")
        .update(resourceData)
        .eq("resource_id", resourceId)
        .select()
        .single();
};

export const remove = async (resourceId) => {
    return await supabase
        .from("resources")
        .delete()
        .eq("resource_id", resourceId);
};

/**
 * Upsert inventory from a donation:
 * - If a resource with the same name + unit already exists for this org → increment quantity_available
 * - Otherwise → create a brand new resource record
 */
export const upsertFromDonation = async ({ organization_id, resource_name, category, quantity, unit }) => {
    // 1. Check if resource already exists (match on org + name + unit)
    const { data: existing, error: findError } = await supabase
        .from("resources")
        .select("resource_id, quantity_available")
        .eq("organization_id", organization_id)
        .eq("resource_name", resource_name)
        .eq("unit", unit)
        .maybeSingle();

    if (findError) return { error: findError };

    if (existing) {
        // Resource exists → increment quantity_available
        return await supabase
            .from("resources")
            .update({ quantity_available: existing.quantity_available + quantity })
            .eq("resource_id", existing.resource_id)
            .select()
            .single();
    } else {
        // New resource → insert a fresh record
        return await supabase
            .from("resources")
            .insert([{
                organization_id,
                resource_name,
                category: category || "General",
                quantity_available: quantity,
                quantity_reserved: 0,
                unit,
                reorder_level: 0,
            }])
            .select()
            .single();
    }
};
