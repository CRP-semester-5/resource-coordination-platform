import { supabase } from "../lib/supabase.js";

export const getInventoryByOrg = async (organizationId) => {
    return await supabase
        .from("inventory")
        .select(`
            inventory_id,
            organization_id,
            quantity,
            resource_categories ( category_id, name, unit_of_measure )
        `)
        .eq("organization_id", organizationId);
};

export const increaseInventory = async (organizationId, categoryId, amount) => {
    // Supabase JS doesn't have an atomic increment easily exposed without an RPC function.
    // We will do a read-modify-write here, but in production, we should use a Postgres function (RPC).
    const { data: existing, error: findError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("organization_id", organizationId)
        .eq("category_id", categoryId)
        .single();
    
    if (findError && findError.code !== 'PGRST116') {
        return { error: findError };
    }

    if (!existing) {
        // Create new inventory record
        return await supabase
            .from("inventory")
            .insert([{ organization_id: organizationId, category_id: categoryId, quantity: amount }])
            .select()
            .single();
    } else {
        // Update existing
        return await supabase
            .from("inventory")
            .update({ quantity: existing.quantity + amount })
            .eq("organization_id", organizationId)
            .eq("category_id", categoryId)
            .select()
            .single();
    }
};

export const decreaseInventory = async (organizationId, categoryId, amount) => {
    const { data: existing, error: findError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("organization_id", organizationId)
        .eq("category_id", categoryId)
        .single();
    
    if (findError) return { error: findError }; // Must exist to decrease
    
    if (existing.quantity < amount) {
        return { error: { message: "Insufficient inventory" } };
    }

    return await supabase
        .from("inventory")
        .update({ quantity: existing.quantity - amount })
        .eq("organization_id", organizationId)
        .eq("category_id", categoryId)
        .select()
        .single();
};
