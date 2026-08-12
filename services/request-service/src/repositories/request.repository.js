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

// Create Guest Contact
export const createGuestContact = async (guestData) => {
    return await supabase
        .from("guest_request_contacts")
        .insert([guestData])
        .select()
        .single();
};

// Get All Requests for User
export const findAll = async (userId, userPhone = null) => {
    if (!userId) {
        return await supabase.from("requests").select(`
            *,
            users!requests_requester_id_fkey (first_name, last_name, phone, email),
            guest_request_contacts (contact_name, contact_phone, contact_email)
        `).order("created_at", { ascending: false });
    }

    let allRequests = [];

    // 1. Fetch requests directly tied to the user's ID
    const { data: userRequests, error: userError } = await supabase
        .from("requests")
        .select(`
            *,
            users!requests_requester_id_fkey (first_name, last_name, phone, email),
            guest_request_contacts (contact_name, contact_phone, contact_email)
        `)
        .eq("requester_id", userId);
        
    if (userError) throw userError;
    if (userRequests) allRequests = [...userRequests];

    // 2. Fetch requests tied to the user's phone number as a guest
    if (userPhone) {
        const { data: guestContacts, error: guestError } = await supabase
            .from("guest_request_contacts")
            .select("request_id")
            .eq("contact_phone", userPhone);
            
        if (!guestError && guestContacts && guestContacts.length > 0) {
            const requestIds = guestContacts.map(g => g.request_id);
            const { data: guestRequests, error: reqError } = await supabase
                .from("requests")
                .select(`
                    *,
                    users!requests_requester_id_fkey (first_name, last_name, phone, email),
                    guest_request_contacts (contact_name, contact_phone, contact_email)
                `)
                .in("request_id", requestIds);
                
            if (!reqError && guestRequests) {
                // Merge and remove duplicates (in case of overlap)
                const existingIds = new Set(allRequests.map(r => r.request_id));
                const uniqueGuestReqs = guestRequests.filter(r => !existingIds.has(r.request_id));
                allRequests = [...allRequests, ...uniqueGuestReqs];
            }
        }
    }

    // Sort descending by created_at
    allRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Map contact details properly for frontend
    const mappedRequests = allRequests.map(req => {
        if (req.users) {
            req.contact_name = `${req.users.first_name} ${req.users.last_name}`.trim();
            req.contact_mobile = req.users.phone;
            req.contact_email = req.users.email;
        } else if (req.guest_request_contacts && req.guest_request_contacts.length > 0) {
            const gc = req.guest_request_contacts[0];
            req.contact_name = gc.contact_name;
            req.contact_mobile = gc.contact_phone;
            req.contact_email = gc.contact_email;
        }
        delete req.users;
        delete req.guest_request_contacts;
        return req;
    });
    
    return { data: mappedRequests, error: null };
};

// Get Request By ID
export const findById = async (requestId) => {
    const { data, error } = await supabase
        .from("requests")
        .select(`
            *,
            users!requests_requester_id_fkey (first_name, last_name, phone, email),
            guest_request_contacts (contact_name, contact_phone, contact_email)
        `)
        .eq("request_id", requestId)
        .maybeSingle();

    if (data) {
        if (data.users) {
           data.contact_name = `${data.users.first_name} ${data.users.last_name}`.trim();
           data.contact_mobile = data.users.phone;
           data.contact_email = data.users.email;
        } else if (data.guest_request_contacts && data.guest_request_contacts.length > 0) {
           const gc = data.guest_request_contacts[0];
           data.contact_name = gc.contact_name;
           data.contact_mobile = gc.contact_phone;
           data.contact_email = gc.contact_email;
        }
        delete data.users;
        delete data.guest_request_contacts;
    }
    
    return { data, error };
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
