import * as membershipService from "../services/membership.service.js";

export const createMembership = async (req, res) => {

    try {

        const membership =
            await membershipService.createMembership(
                req.params.organizationId,
                req.body,
                req.user.sub
            );

        return res.status(201).json({
            success: true,
            message: "Membership created successfully.",
            data: membership,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

export const getMembers = async (req, res) => {

    try {

        const members =
            await membershipService.getMembers(
                req.params.organizationId
            );

        return res.json({
            success: true,
            count: members.length,
            data: members,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

export const getMembershipById = async (req, res) => {

    try {

        const membership =
            await membershipService.getMembershipById(
                req.params.membershipId
            );

        return res.json({
            success: true,
            data: membership,
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message,
        });

    }

};

export const updateMembership = async (req, res) => {

    try {

        const membership =
            await membershipService.updateMembership(
                req.params.membershipId,
                req.body
            );

        return res.json({
            success: true,
            message: "Membership updated successfully.",
            data: membership,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

export const deleteMembership = async (req, res) => {

    try {

        await membershipService.deleteMembership(
            req.params.membershipId
        );

        return res.json({
            success: true,
            message: "Membership deleted successfully.",
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};
