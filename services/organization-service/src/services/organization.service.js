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