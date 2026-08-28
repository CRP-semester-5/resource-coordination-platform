import { supabase } from "../lib/supabase.js";

// Check duplicate request
export const findDuplicate = async (
    organizationId,
    requesterId,
    title
) => {
    let query = supabase.from("requests").select("*").eq("title", title);
    if (organizationId) {
        query = query.eq("organization_id", organizationId);
    }
    if (requesterId) {
        query = query.eq("requester_id", requesterId);
    } else {
        query = query.is("requester_id", null);
    }
    return await query.maybeSingle();
};

// Create Request
export const create = async (requestData) => {
    return await supabase
        .from("requests")
        .insert([requestData])
        .select()
        .single();
};

// Save Guest Contact Info
export const createGuestContact = async (contactData) => {
    return await supabase
        .from("guest_request_contacts")
        .insert([contactData])
        .select()
        .single();
};

// Get All Requests
export const findAll = async () => {
    return await supabase
        .from("requests")
        .select(`
            *,
            users:requester_id ( first_name, last_name, email, phone ),
            guest_request_contacts ( contact_name, contact_phone, contact_email )
        `)
        .order("created_at", { ascending: false });
};

// Get Request By ID
export const findById = async (requestId) => {
    return await supabase
        .from("requests")
        .select(`
            *,
            users:requester_id ( first_name, last_name, email, phone ),
            guest_request_contacts ( contact_name, contact_phone, contact_email )
        `)
        .eq("request_id", requestId)
        .maybeSingle();
};

// Update Request
export const update = async (
    requestId,
    requestData
) => {
    return await supabase
        .from("requests")
        .update(requestData)
        .eq("request_id", requestId)
        .select()
        .single();
};

// Cancel Request
export const cancel = async (requestId) => {
    return await supabase
        .from("requests")
        .update({
            status: "CANCELLED"
        })
        .eq("request_id", requestId)
        .select()
        .single();
};

// Verify / Approve Request
export const verify = async (
    requestId,
    verifiedBy,
    orgId
) => {
    return await supabase
        .from("requests")
        .update({
            status: "VERIFIED",
            verified_by: verifiedBy,
            verified_at: new Date().toISOString(),
            organization_id: orgId,
            rejection_reason: null
        })
        .eq("request_id", requestId)
        .select()
        .single();
};

// Reject Request
export const reject = async (
    requestId,
    verifiedBy,
    reason,
    orgId
) => {
    return await supabase
        .from("requests")
        .update({
            status: "REJECTED",
            verified_by: verifiedBy,
            verified_at: new Date().toISOString(),
            organization_id: orgId,
            rejection_reason: reason
        })
        .eq("request_id", requestId)
        .select()
        .single();
};

// Mark as Fulfilled
export const fulfill = async (requestId) => {
    return await supabase
        .from("requests")
        .update({
            status: "FULFILLED",
            fulfilled_at: new Date().toISOString()
        })
        .eq("request_id", requestId)
        .select()
        .single();
};

// Delete Request
export const deleteRequest = async (requestId) => {
    return await supabase
        .from("requests")
        .delete()
        .eq("request_id", requestId);
};
