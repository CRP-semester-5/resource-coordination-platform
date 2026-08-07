import * as membershipRepository from "../repositories/membership.repository.js";

export const createMembership = async (organizationId, membershipData) => {

    const existing = await membershipRepository.findExistingMembership(
        organizationId,
        membershipData.user_id
    );

    if (existing.data) {
        throw new Error("User is already a member of this organization.");
    }

    membershipData.organization_id = organizationId;

    membershipData.status = "PENDING";

    const { data, error } =
        await membershipRepository.createMembership(membershipData);

    if (error) {
        throw new Error(error.message);
    }

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