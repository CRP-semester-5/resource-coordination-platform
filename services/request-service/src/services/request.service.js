import * as requestRepository from "../repositories/request.repository.js";
import jwt from "jsonwebtoken";

import { supabase } from "../lib/supabase.js";

export const createRequest = async (requestData, existingUserId = null) => {
    const payload = { ...requestData };
    
    // Extract contact details passed from mobile app
    const contactName = payload.contact_name;
    const contactMobile = payload.contact_mobile;
    const contactEmail = payload.contact_email;
    
    // Map to the new Database columns before deleting from payload
    if (contactName) payload.scene_contact_name = contactName;
    if (contactEmail) payload.scene_contact_email = contactEmail;

    // Extract progressive profiling flag
    const isPersonal = payload.is_personal === true;
    
    // Remove old frontend fields from payload so they don't cause DB insertion errors
    delete payload.contact_name;
    delete payload.contact_mobile;
    delete payload.contact_email;
    delete payload.is_personal;

    // If existingUserId is provided, link immediately
    if (existingUserId) {
        payload.requester_id = existingUserId;
    } else {
        // Guest Request: requester_id is NULL. No user accounts are created.
        payload.requester_id = null;
    }

    let token = null;
    // We only generate a token if they actually registered and have a real user_id, 
    // but in this service, we no longer register users. The user-service handles that.
    // So we can just leave token as null.

    // Only check for duplicates if it's a registered user submitting for themselves
    if (payload.requester_id) {
        const existing = await requestRepository.findDuplicate(
            payload.organization_id,
            payload.requester_id,
            payload.title
        );

        if (existing && existing.data) {
            throw new Error("A similar request already exists.");
        }
    }

    const { data, error } =
        await requestRepository.create(payload);

    if (error) {
        throw new Error(error.message);
    }

    // Save contact info if provided
    if (contactName && contactMobile) {
        await requestRepository.createGuestContact({
            request_id: data.request_id,
            contact_name: contactName,
            contact_phone: contactMobile,
            contact_email: contactEmail || null
        });
    }

    return { request: data, token: token };
};

export const getRequests = async (userId) => {
    let userPhone = null;
    if (userId) {
        const { data: userData } = await supabase.from("users").select("phone").eq("user_id", userId).maybeSingle();
        if (userData && userData.phone) {
            userPhone = userData.phone;
        }
    }

    const { data, error } =
        await requestRepository.findAll(userId, userPhone);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const getRequestById = async (requestId) => {

    const { data, error } =
        await requestRepository.findById(requestId);

    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error("Request not found.");
    }

    return data;
};

export const updateRequest = async (
    requestId,
    requestData
) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (existing.data.status !== "PENDING") {
        throw new Error(
            "Only pending requests can be updated."
        );
    }

    const { data, error } =
        await requestRepository.update(
            requestId,
            requestData
        );

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const deleteRequest = async (requestId) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    const { data, error } =
        await requestRepository.deleteRequest(requestId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const cancelRequest = async (requestId) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (
        existing.data.status === "FULFILLED" ||
        existing.data.status === "CANCELLED"
    ) {
        throw new Error(
            "This request cannot be cancelled."
        );
    }

    const { data, error } =
        await requestRepository.cancel(requestId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const approveRequest = async (
    requestId,
    verifiedBy,
    orgId
) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (orgId && existing.data.organization_id && existing.data.organization_id !== orgId) {
        throw new Error("Unauthorized: Request is already assigned to another organization.");
    }

    if (existing.data.status !== "PENDING") {
        throw new Error(
            "Only pending requests can be approved."
        );
    }

    const { data, error } =
        await requestRepository.verify(
            requestId,
            verifiedBy,
            orgId
        );

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const rejectRequest = async (
    requestId,
    verifiedBy,
    reason,
    orgId
) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (orgId && existing.data.organization_id && existing.data.organization_id !== orgId) {
        throw new Error("Unauthorized: Request is already assigned to another organization.");
    }

    if (existing.data.status !== "PENDING") {
        throw new Error(
            "Only pending requests can be rejected."
        );
    }

    const { data, error } =
        await requestRepository.reject(
            requestId,
            verifiedBy,
            reason,
            orgId
        );

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const fulfillRequest = async (requestId) => {

    const existing =
        await requestRepository.findById(requestId);

    if (!existing.data) {
        throw new Error("Request not found.");
    }

    if (
        existing.data.status !== "IN_PROGRESS" &&
        existing.data.status !== "ASSIGNED"
    ) {
        throw new Error(
            "Only assigned or in-progress requests can be fulfilled."
        );
    }

    const { data, error } =
        await requestRepository.fulfill(requestId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};
