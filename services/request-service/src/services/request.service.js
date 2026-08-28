import * as requestRepository from "../repositories/request.repository.js";
import { supabase } from "../lib/supabase.js";

const formatRequest = (r) => {
    if (!r) return r;
    const formatted = { ...r };
    
    // Format Requester Name & Phone
    if (formatted.users) {
        const fullName = `${formatted.users.first_name || ''} ${formatted.users.last_name || ''}`.trim();
        formatted.requester_name = fullName || "Registered User";
        formatted.requester_phone = formatted.users.phone || "";
        formatted.requester_email = formatted.users.email || "";
        formatted.is_guest = false;
    } else if (formatted.guest_request_contacts && formatted.guest_request_contacts.length > 0) {
        const guestContact = formatted.guest_request_contacts[0];
        formatted.requester_name = `${guestContact.contact_name || 'Guest'} (Guest)`;
        formatted.requester_phone = guestContact.contact_phone || "";
        formatted.requester_email = guestContact.contact_email || "";
        formatted.is_guest = true;
    } else {
        formatted.requester_name = "Anonymous Guest";
        formatted.requester_phone = "";
        formatted.requester_email = "";
        formatted.is_guest = true;
    }

    return formatted;
};

export const createRequest = async (requestData, userId = null) => {
    const payload = { ...requestData };

    // Extract contact details
    const contactName = payload.contact_name;
    const contactMobile = payload.contact_mobile;
    const contactEmail = payload.contact_email;

    // Set requester_id (null for guests)
    payload.requester_id = userId || null;

    // Default quantity and unit if missing
    if (!payload.quantity_required) {
        payload.quantity_required = 1;
    }
    if (!payload.unit) {
        payload.unit = "units";
    }
    if (!payload.urgency) {
        payload.urgency = "MEDIUM";
    }
    if (!payload.category) {
        payload.category = "General Relief";
    }

    // Validate or assign a valid organization_id
    if (payload.organization_id) {
        const { data: org } = await supabase
            .from("organizations")
            .select("organization_id")
            .eq("organization_id", payload.organization_id)
            .maybeSingle();

        if (!org) {
            const { data: defaultOrg } = await supabase
                .from("organizations")
                .select("organization_id")
                .limit(1)
                .maybeSingle();
            payload.organization_id = defaultOrg?.organization_id || null;
        }
    } else {
        const { data: defaultOrg } = await supabase
            .from("organizations")
            .select("organization_id")
            .limit(1)
            .maybeSingle();
        payload.organization_id = defaultOrg?.organization_id || null;
    }

    // Check duplicate request
    if (payload.requester_id && payload.title) {
        const existing = await requestRepository.findDuplicate(
            payload.organization_id,
            payload.requester_id,
            payload.title
        );

        if (existing && existing.data) {
            throw new Error("A similar request already exists.");
        }
    }

    // Clean up transient non-column fields
    delete payload.contact_name;
    delete payload.contact_mobile;
    delete payload.contact_email;
    delete payload.is_personal;

    const { data, error } = await requestRepository.create(payload);

    if (error) {
        throw new Error(error.message);
    }

    // If contact information was provided, save to guest_request_contacts
    if (contactName || contactMobile || contactEmail || !userId) {
        try {
            await requestRepository.createGuestContact({
                request_id: data.request_id,
                contact_name: contactName || "Guest Requester",
                contact_phone: contactMobile || null,
                contact_email: contactEmail || null
            });
        } catch (contactErr) {
            console.error("Failed to save guest_request_contacts:", contactErr);
        }
    }

    return formatRequest(await getRequestById(data.request_id));
};

export const getRequests = async () => {
    const { data, error } = await requestRepository.findAll();
    if (error) {
        throw new Error(error.message);
    }
    return data.map(formatRequest);
};

export const getRequestById = async (requestId) => {
    const { data, error } = await requestRepository.findById(requestId);
    if (error) {
        throw new Error(error.message);
    }
    if (!data) {
        throw new Error("Request not found.");
    }
    return formatRequest(data);
};

export const updateRequest = async (requestId, requestData) => {
    const existing = await requestRepository.findById(requestId);
    if (!existing.data) {
        throw new Error("Request not found.");
    }
    if (existing.data.status !== "PENDING") {
        throw new Error("Only pending requests can be updated.");
    }

    const { data, error } = await requestRepository.update(requestId, requestData);
    if (error) {
        throw new Error(error.message);
    }
    return formatRequest(data);
};

export const deleteRequest = async (requestId) => {
    const existing = await requestRepository.findById(requestId);
    if (!existing.data) {
        throw new Error("Request not found.");
    }

    const { data, error } = await requestRepository.deleteRequest(requestId);
    if (error) {
        throw new Error(error.message);
    }
    return data;
};

export const cancelRequest = async (requestId) => {
    const existing = await requestRepository.findById(requestId);
    if (!existing.data) {
        throw new Error("Request not found.");
    }
    if (existing.data.status === "FULFILLED" || existing.data.status === "CANCELLED") {
        throw new Error("This request cannot be cancelled.");
    }

    const { data, error } = await requestRepository.cancel(requestId);
    if (error) {
        throw new Error(error.message);
    }
    return formatRequest(data);
};

export const approveRequest = async (requestId, verifiedBy, orgId) => {
    const existing = await requestRepository.findById(requestId);
    if (!existing.data) {
        throw new Error("Request not found.");
    }
    if (orgId && existing.data.organization_id && existing.data.organization_id !== orgId) {
        throw new Error("Unauthorized: Request is already assigned to another organization.");
    }
    if (existing.data.status !== "PENDING") {
        throw new Error("Only pending requests can be approved.");
    }

    const { data, error } = await requestRepository.verify(requestId, verifiedBy, orgId);
    if (error) {
        throw new Error(error.message);
    }
    return formatRequest(data);
};

export const rejectRequest = async (requestId, verifiedBy, reason, orgId) => {
    const existing = await requestRepository.findById(requestId);
    if (!existing.data) {
        throw new Error("Request not found.");
    }
    if (orgId && existing.data.organization_id && existing.data.organization_id !== orgId) {
        throw new Error("Unauthorized: Request is already assigned to another organization.");
    }
    if (existing.data.status !== "PENDING") {
        throw new Error("Only pending requests can be rejected.");
    }

    const { data, error } = await requestRepository.reject(requestId, verifiedBy, reason, orgId);
    if (error) {
        throw new Error(error.message);
    }
    return formatRequest(data);
};

export const fulfillRequest = async (requestId) => {
    const existing = await requestRepository.findById(requestId);
    if (!existing.data) {
        throw new Error("Request not found.");
    }
    if (existing.data.status !== "IN_PROGRESS" && existing.data.status !== "ASSIGNED") {
        throw new Error("Only assigned or in-progress requests can be fulfilled.");
    }

    const { data, error } = await requestRepository.fulfill(requestId);
    if (error) {
        throw new Error(error.message);
    }
    return formatRequest(data);
};
