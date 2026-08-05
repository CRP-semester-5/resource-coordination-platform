import * as organizationService from "../services/organization.service.js";

export const createOrganization = async (req, res) => {
    try{
        const applicantId = req.user.sub; // User making the request
        const organization =
            await organizationService.createOrganization(req.body, applicantId);

        return res.status(201).json({
            success: true,
            message: "Organization application submitted successfully.",
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

export const getPendingOrganizations = async(req, res) => {
    try {
        const organizations = await organizationService.getPendingOrganizations();
        return res.status(200).json({
            success: true,
            data: organizations
        });
    } catch(error){
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getMyOrganizations = async(req, res) => {
    try {
        const organizations = await organizationService.getMyOrganizations(req.user.sub);
        return res.status(200).json({
            success: true,
            data: organizations
        });
    } catch(error){
        return res.status(500).json({ success: false, message: error.message });
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

export const updateOrganization = async (req, res) => {
    try {

        const organization =
            await organizationService.updateOrganization(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success:true,
            message:"Organization updated successfully.",
            data:organization
        });

    } catch(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });

    }
};

export const deleteOrganization = async (req, res) => {
    try {

        const organization =
            await organizationService.deleteOrganization(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Organization deleted successfully.",
            data: organization
        });

    } catch(error) {

        return res.status(400).json({
            success:false,
            message:error.message
        });

    }
};

export const approveOrganization = async (req, res) => {

    try {

        const organization =
            await organizationService.approveOrganization(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Organization approved successfully.",
            data: organization
        });

    } catch(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};

export const rejectOrganization = async (req, res) => {

    try {

        const organization =
            await organizationService.rejectOrganization(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Organization rejected successfully.",
            data: organization
        });

    } catch(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};