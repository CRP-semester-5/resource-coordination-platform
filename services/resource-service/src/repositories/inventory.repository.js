import { supabase } from "../lib/supabase.js";

export const findCategoryFuzzy = async (supabaseClient, categoryName) => {
    if (!categoryName) return null;
    const clean = categoryName.trim().toLowerCase();

    const { data: allCats } = await supabaseClient
        .from("resource_categories")
        .select("category_id, name, unit_of_measure");

    if (!allCats || allCats.length === 0) return null;

    // 1. Exact match
    let found = allCats.find(c => c.name.toLowerCase() === clean);
    if (found) return found;

    // 2. Contains match
    found = allCats.find(c => c.name.toLowerCase().includes(clean) || clean.includes(c.name.toLowerCase()));
    if (found) return found;

    // 3. Stem keyword match (e.g. "Drinking Water" -> "Bottled Water", "Clothing" -> "Cloths")
    const words = clean.split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2);
    found = allCats.find(c => {
        const catWords = c.name.toLowerCase().split(/[^a-zA-Z0-9]+/).filter(w => w.length > 2);
        return words.some(w => catWords.some(cw => {
            const minLen = Math.min(w.length, cw.length, 4);
            return w.slice(0, minLen) === cw.slice(0, minLen);
        }));
    });

    return found || null;
};

export const ensureResourceId = async (organizationId, categoryName, unit = 'items') => {
    if (!organizationId || !categoryName) return null;
    const cleanCategory = categoryName.trim();

    const { data: existing } = await supabase
        .from("resources")
        .select("resource_id")
        .eq("organization_id", organizationId)
        .ilike("category", cleanCategory)
        .limit(1)
        .maybeSingle();

    if (existing && existing.resource_id) return existing.resource_id;

    const { data: created } = await supabase
        .from("resources")
        .insert([{
            organization_id: organizationId,
            resource_name: cleanCategory,
            category: cleanCategory,
            unit: unit || 'items',
            quantity_available: 0
        }])
        .select("resource_id")
        .single();

    return created?.resource_id ?? null;
};

export const recordTransaction = async ({
    organizationId,
    categoryName,
    unit = 'items',
    transactionType, // 'STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'
    quantity,
    referenceType = null, // 'DONATION', 'REQUEST', 'RESTOCK', 'ALLOCATION'
    referenceId = null,
    createdBy = null,
    remarks = ''
}) => {
    try {
        const resourceId = await ensureResourceId(organizationId, categoryName || 'General Supplies', unit);
        if (!resourceId) {
            console.warn("Could not determine resourceId for transaction logging");
            return null;
        }

        const payload = {
            organization_id: organizationId,
            resource_id: resourceId,
            transaction_type: transactionType,
            quantity: Math.abs(parseInt(quantity, 10) || 0),
            reference_type: referenceType,
            reference_id: referenceId,
            created_by: createdBy,
            remarks: remarks,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from("inventory_transactions")
            .insert([payload])
            .select()
            .single();

        if (error) {
            console.warn("recordTransaction db error:", error.message);
            return null;
        }
        return data;
    } catch (e) {
        console.warn("recordTransaction caught error:", e.message);
        return null;
    }
};

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

export const getTransactionsByOrg = async (organizationId) => {
    let query = supabase
        .from("inventory_transactions")
        .select(`
            *,
            resources ( resource_name, category, unit ),
            users:created_by ( first_name, last_name, email )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

    if (organizationId) {
        query = query.eq("organization_id", organizationId);
    }

    return await query;
};

export const checkStockAvailability = async (organizationId, categoryName, requiredQty) => {
    const required = parseInt(requiredQty, 10) || 0;
    if (!organizationId) {
        return { isSufficient: true, available: 0, required, shortage: 0 };
    }

    // 1. Find category with robust fuzzy matching
    const cat = await findCategoryFuzzy(supabase, categoryName || '');

    if (!cat) {
        return { 
            isSufficient: false, 
            available: 0, 
            required, 
            shortage: required, 
            category: categoryName || 'Requested Supplies',
            message: `Category "${categoryName}" has 0 stock in warehouse.`
        };
    }

    // 2. Query inventory
    const { data: inv } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("organization_id", organizationId)
        .eq("category_id", cat.category_id)
        .maybeSingle();

    const available = inv?.quantity || 0;
    const isSufficient = available >= required;
    const shortage = isSufficient ? 0 : required - available;

    return {
        isSufficient,
        available,
        required,
        shortage,
        category: cat.name,
        category_id: cat.category_id
    };
};

export const increaseInventory = async (organizationId, categoryId, amount, options = {}) => {
    const qty = Math.abs(parseInt(amount, 10) || 0);
    const { data: existing, error: findError } = await supabase
        .from("inventory")
        .select("quantity, resource_categories(name, unit_of_measure)")
        .eq("organization_id", organizationId)
        .eq("category_id", categoryId)
        .single();
    
    if (findError && findError.code !== 'PGRST116') {
        return { error: findError };
    }

    let result;
    if (!existing) {
        result = await supabase
            .from("inventory")
            .insert([{ organization_id: organizationId, category_id: categoryId, quantity: qty }])
            .select()
            .single();
    } else {
        result = await supabase
            .from("inventory")
            .update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() })
            .eq("organization_id", organizationId)
            .eq("category_id", categoryId)
            .select()
            .single();
    }

    // Record Transaction Log
    if (!result.error) {
        const catName = options.categoryName || existing?.resource_categories?.name || 'Supplies';
        const unit = options.unit || existing?.resource_categories?.unit_of_measure || 'items';
        await recordTransaction({
            organizationId,
            categoryName: catName,
            unit,
            transactionType: 'STOCK_IN',
            quantity: qty,
            referenceType: options.referenceType || 'RESTOCK',
            referenceId: options.referenceId || null,
            createdBy: options.createdBy || null,
            remarks: options.remarks || `Restocked ${qty} ${unit} of ${catName}`
        });
    }

    return result;
};

export const decreaseInventory = async (organizationId, categoryId, amount, options = {}) => {
    const qty = Math.abs(parseInt(amount, 10) || 0);
    const { data: existing, error: findError } = await supabase
        .from("inventory")
        .select("quantity, resource_categories(name, unit_of_measure)")
        .eq("organization_id", organizationId)
        .eq("category_id", categoryId)
        .single();
    
    if (findError) return { error: findError };
    
    if ((existing.quantity || 0) < qty) {
        return { error: { message: `Insufficient inventory: Required ${qty}, but only ${existing.quantity || 0} in stock.` } };
    }

    const newQty = Math.max(0, existing.quantity - qty);
    const result = await supabase
        .from("inventory")
        .update({ quantity: newQty, updated_at: new Date().toISOString() })
        .eq("organization_id", organizationId)
        .eq("category_id", categoryId)
        .select()
        .single();

    // Record Transaction Log
    if (!result.error) {
        const catName = options.categoryName || existing?.resource_categories?.name || 'Supplies';
        const unit = options.unit || existing?.resource_categories?.unit_of_measure || 'items';
        await recordTransaction({
            organizationId,
            categoryName: catName,
            unit,
            transactionType: 'STOCK_OUT',
            quantity: qty,
            referenceType: options.referenceType || 'REQUEST',
            referenceId: options.referenceId || null,
            createdBy: options.createdBy || null,
            remarks: options.remarks || `Dispatched ${qty} ${unit} of ${catName}`
        });
    }

    return result;
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
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq("inventory_id", inventoryId)
        .select()
        .single();
};

export const upsertFromDonation = async ({ organization_id, category, quantity, donation_id = null, donor_name = null }) => {
    const cat = await findCategoryFuzzy(supabase, category || '');
    const categoryId = cat?.category_id ?? null;

    if (!categoryId) {
        console.warn(`No resource_category found for name "${category}" - inventory not updated`);
        return { data: null, error: { message: `Category "${category}" not found in resource_categories` } };
    }

    return await increaseInventory(organization_id, categoryId, quantity, {
        categoryName: cat.name,
        unit: cat.unit_of_measure,
        referenceType: 'DONATION',
        referenceId: donation_id,
        remarks: `Donation Received: ${quantity} ${cat.unit_of_measure || 'items'} of ${cat.name}${donor_name ? ` (Donor: ${donor_name})` : ''}`
    });
};

export const deductForRequest = async ({ organization_id, category, quantity, request_id = null, requester_name = null }) => {
    const cat = await findCategoryFuzzy(supabase, category || '');
    const categoryId = cat?.category_id ?? null;

    if (!categoryId) {
        console.warn(`No resource_category found for name "${category}" - deduction skipped`);
        return { data: null, error: { message: `Category "${category}" not found` } };
    }

    return await decreaseInventory(organization_id, categoryId, quantity, {
        categoryName: cat.name,
        unit: cat.unit_of_measure,
        referenceType: 'REQUEST',
        referenceId: request_id,
        remarks: `Aid Delivered / Dispatched: ${quantity} ${cat.unit_of_measure || 'items'} of ${cat.name}${requester_name ? ` (Requester: ${requester_name})` : ''}`
    });
};
