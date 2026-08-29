import * as organizationRepository from "../repositories/organization.repository.js";
import * as membershipRepository from "../repositories/membership.repository.js";

export const createOrganization = async (organizationData, applicantId) => {

    const existing = await organizationRepository.findByName(
        organizationData.organization_name
    );

    if (existing.data) {
        throw new Error("Organization already exists.");
    }

    organizationData.applicant_id = applicantId;
    organizationData.status = "PENDING";

    const { data, error } =
        await organizationRepository.create(organizationData);

    if (error) {
        throw new Error(error.message);
    }

    return data;
};

export const getOrganizations = async () => {

    const { data, error } =
        await organizationRepository.findAll();

    if(error){
        throw new Error(error.message);
    }

    return data;
};

export const getPendingOrganizations = async () => {
    const { data, error } = await organizationRepository.findPending();
    if(error) throw new Error(error.message);
    return data;
};

export const getMyOrganizations = async (userId) => {
    const { data, error } = await organizationRepository.findUserOrganizations(userId);
    if(error) throw new Error(error.message);
    
    // Format the response nicely: { org_id, org_name, my_role: 'COORDINATOR' }
    return data.map(row => ({
        ...row.organizations,
        my_role: row.role
    }));
};

export const getOrganizationById = async (organizationId) => {

    const { data, error } =
        await organizationRepository.findById(organizationId);

    if(error){
        throw new Error(error.message);
    }

    if(!data){
        throw new Error("Organization not found");
    }

    return data;
};

export const updateOrganization = async (
    organizationId,
    organizationData
) => {

    const { data, error } =
        await organizationRepository.update(
            organizationId,
            organizationData
        );

    if(error){
        throw new Error(error.message);
    }

    return data;
};

export const deleteOrganization = async (organizationId) => {

    const { data, error } =
        await organizationRepository.softDelete(
            organizationId
        );

    if(error){
        throw new Error(error.message);
    }

    return data;
};

export const approveOrganization = async (organizationId) => {

    // 1. Get the org to find the applicant_id
    const { data: org, error: fetchErr } = await organizationRepository.findById(organizationId);
    if (fetchErr) throw new Error(fetchErr.message);
    if (!org) throw new Error("Organization not found");

    // 2. Set to ACTIVE
    const { data, error } =
        await organizationRepository.updateStatus(
            organizationId,
            "ACTIVE"
        );

    if(error){
        throw new Error(error.message);
    }

    // 3. Auto-assign the applicant as ORGANIZATION_ADMIN
    if (org.applicant_id) {
        // Check if already a member to prevent unique constraint error on double-click
        const existing = await membershipRepository.findExistingMembership(organizationId, org.applicant_id);
        if (!existing.data) {
            await membershipRepository.createMembership({
                organization_id: organizationId,
                user_id: org.applicant_id,
                role: 'ORGANIZATION_ADMIN',
                status: 'ACTIVE'
            });
        }
    }

    return data;
};

export const rejectOrganization = async (organizationId) => {

    const { data, error } =
        await organizationRepository.updateStatus(
            organizationId,
            "REJECTED"
        );

    if(error){
        throw new Error(error.message);
    }

    return data;
};
