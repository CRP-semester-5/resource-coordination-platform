import * as organizationService from "../services/organization.service.js";

export const createOrganization = async (req, res) => {
    try{
        const organization =
            await organizationService.createOrganization(req.body);

        return res.status(201).json({
            success: true,
            message: "Organization created successfully.",
            data: organization,
        });
    } catch (error){
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};

export const getOrganizations = async(req, res) => {
    try {

        const organizations =
            await organizationService.getOrganizations();

        return res.status(200).json({
            success:true,
            data: organizations
        });

    } catch(error){

        return res.status(500).json({
            success:false,
            message:error.message
        });

    }
};

export const getOrganizationById = async (req, res) => {
    try {

        const organization =
            await organizationService.getOrganizationById(
                req.params.id
            );

        return res.status(200).json({
            success:true,
            data:organization
        });

    } catch(error){

        return res.status(404).json({
            success:false,
            message:error.message
        });

    }
};

export const updateOrganization = (req, res) => {
    res.json({ message: "Update Organization" });
};

export const deleteOrganization = (req, res) => {
    res.json({ message: "Delete Organization" });
};

export const approveOrganization = (req, res) => {
    res.json({ message: "Approve Organization" });
};

export const rejectOrganization = (req, res) => {
    res.json({ message: "Reject Organization" });
};