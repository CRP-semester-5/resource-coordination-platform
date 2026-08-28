import { supabase } from "../lib/supabase.js";

// Check duplicate request
export const findDuplicate = async (
    organizationId,
    requesterId,
    title
) => {
    return await supabase
        .from("requests")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("requester_id", requesterId)
        .eq("title", title)
        .maybeSingle();
};

// Create Request
export const create = async (requestData) => {
    return await supabase
        .from("requests")
        .insert([requestData])
        .select()
        .single();
};

// Get All Requests
export const findAll = async () => {
    return await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });
};

// Get Request By ID
export const findById = async (requestId) => {
    return await supabase
        .from("requests")
        .select("*")
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

// Mark as In Progress
export const inProgress = async (requestId) => {
    return await supabase
        .from("requests")
        .update({
            status: "IN_PROGRESS"
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
