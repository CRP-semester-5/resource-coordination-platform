import * as membershipRepository from "../repositories/membership.repository.js";
import { supabase } from "../lib/supabase.js";

export const createMembership = async (organizationId, membershipData, inviterId) => {

    // Lookup user by email
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', membershipData.email)
        .single();

    if (userError || !user) {
        throw new Error("No user found with that email address. They must register for a basic account first.");
    }

    const userId = user.user_id;

    const existing = await membershipRepository.findExistingMembership(
        organizationId,
        userId
    );

    if (existing.data) {
        throw new Error("User is already a member of this organization.");
    }

    // Prepare data for DB
    const dbData = {
        organization_id: organizationId,
        user_id: userId,
        role: membershipData.role,
        invited_by: inviterId,
        status: "ACTIVE" // Set to ACTIVE immediately for now
    };

    const { data, error } =
        await membershipRepository.createMembership(dbData);

    if (error) {
        throw new Error(error.message);
    }

    // Mock sending email notification
    console.log(`[Email Mock] Sending invitation to User ${membershipData.user_id}: "You have been added to Organization ${organizationId} as a ${membershipData.role}."`);

    return data;
};

export const getMembers = async (organizationId) => {

    const { data, error } =
        await membershipRepository.getMembers(organizationId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const getMembershipById = async (membershipId) => {

    const { data, error } =
        await membershipRepository.getMembershipById(membershipId);

    if (error) {
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error("Membership not found.");
    }

    return data;
};

export const updateMembership = async (
    membershipId,
    updateData
) => {

    const existing =
        await membershipRepository.getMembershipById(membershipId);

    if (!existing.data) {
        throw new Error("Membership not found.");
    }

    const { data, error } =
        await membershipRepository.updateMembership(
            membershipId,
            updateData
        );

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const deleteMembership = async (membershipId) => {

    const existing =
        await membershipRepository.getMembershipById(membershipId);

    if (!existing.data) {
        throw new Error("Membership not found.");
    }

    const { error } =
        await membershipRepository.deleteMembership(membershipId);

    if (error) {
        throw new Error(error.message);
    }

    return true;
};
