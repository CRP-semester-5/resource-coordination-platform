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

export const getById = async (inventoryId) => {
    return await supabase
        .from("inventory")
        .select("*")
        .eq("inventory_id", inventoryId)
        .single();
};

export const updateQuantityById = async (inventoryId, newQuantity) => {
    return await supabase
        .from("inventory")
        .update({ quantity: newQuantity })
        .eq("inventory_id", inventoryId)
        .select()
        .single();
};

/**
 * Upsert inventory from an approved donation.
 * Looks up the category by name, then calls increaseInventory.
 * If the category name doesn't match any record, creates the inventory entry with a null category_id fallback.
 */
export const upsertFromDonation = async ({ organization_id, category, quantity }) => {
    // 1. Look up category_id by name in resource_categories
    const { data: cat } = await supabase
        .from("resource_categories")
        .select("category_id")
        .ilike("name", category || "")
        .maybeSingle();

    const categoryId = cat?.category_id ?? null;

    if (!categoryId) {
        console.warn(`No resource_category found for name "${category}" — inventory not updated`);
        return { data: null, error: { message: `Category "${category}" not found in resource_categories` } };
    }

    // 2. Delegate to increaseInventory (handles create-or-update)
    return await increaseInventory(organization_id, categoryId, quantity);
};

