import * as organizationRepository from "../repositories/organization.repository.js";

export const createOrganization = async (organizationData) => {

    const existing = await organizationRepository.findByName(
        organizationData.organization_name
    );

    if (existing.data) {
        throw new Error("Organization already exists.");
    }

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

    const { data, error } =
        await organizationRepository.updateStatus(
            organizationId,
            "ACTIVE"
        );

    if(error){
        throw new Error(error.message);
    }

    return data;
};

export const rejectOrganization = async (organizationId) => {

    const { data, error } =
        await organizationRepository.updateStatus(
            organizationId,
            "SUSPENDED"
        );

    if(error){
        throw new Error(error.message);
    }

    return data;
};