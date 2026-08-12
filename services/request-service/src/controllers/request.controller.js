import * as requestService from "../services/request.service.js";
import jwt from "jsonwebtoken";

export const createRequest = async(req, res) => {
    try{
        console.log("PAYLOAD IN CONTROLLER:", req.body);
        
        let existingUserId = null;
        const authHeader = req.headers['authorization'];
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                existingUserId = decoded.sub || decoded.id || decoded.user_id;
                console.log("EXISTING USER DETECTED:", existingUserId);
            } catch (err) {
                console.log("Failed to parse token in createRequest:", err.message);
            }
        }

        const request = await requestService.createRequest(req.body, existingUserId);
        console.log("GENERATED TOKEN:", request.token ? "YES" : "NO", request.token);

        return res.status(201).json({
            success:true,
            message:"Request created successfully.",
            data:request
        });
    } catch(error){
        console.error("ERROR IN CREATE:", error);
        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};

export const getRequests = async (req, res) => {
    try {
        console.log("GET /requests for USER:", req.user);
        const userId = req.user?.sub || req.user?.id || req.user?.user_id;
        console.log("EXTRACTED USER_ID:", userId);
        const requests = await requestService.getRequests(userId);
        console.log(`FOUND ${requests ? requests.length : 0} REQUESTS for USER ${userId}`);

        return res.status(200).json({
            success: true,
            data: requests
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }

};

export const getRequestById = async (req, res) => {

    try {

        const request =
            await requestService.getRequestById(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            data: request
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message
        });

    }

};

export const updateRequest = async (req, res) => {

    try {

        const request =
            await requestService.updateRequest(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Request updated successfully.",
            data: request
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

export const deleteRequest = async (req, res) => {

    try {

        const request =
            await requestService.deleteRequest(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Request deleted successfully.",
            data: request
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

export const approveRequest = async (req, res) => {

    try {

        const request =
            await requestService.approveRequest(
                req.params.id,
                req.user.sub,
                req.orgMembership?.org_id
            );

        return res.status(200).json({
            success: true,
            message: "Request approved successfully.",
            data: request
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const rejectRequest = async (req, res) => {

    try {

        const request =
            await requestService.rejectRequest(
                req.params.id,
                req.user.sub,
                req.body.rejection_reason,
                req.orgMembership?.org_id
            );

        return res.status(200).json({
            success: true,
            message: "Request rejected successfully.",
            data: request
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const cancelRequest = async (req, res) => {

    try {

        const request =
            await requestService.cancelRequest(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Request cancelled successfully.",
            data: request
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });

    }
};

export const fulfillRequest = async (req, res) => {

    try {

        const request =
            await requestService.fulfillRequest(
                req.params.id
            );

        return res.status(200).json({
            success: true,
            message: "Request fulfilled successfully.",
            data: request
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
