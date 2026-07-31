import * as requestService from "../services/request.service.js";

export const createRequest = async(req, res) => {
    try{
        const request= await requestService.createRequest(req.body);

        return res.status(201).json({
            success:true,
            message:"Request created successfully.",
            data:request
        });
    } catch(error){
        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};

export const getRequests = async (req, res) => {

    try {

        const requests =
            await requestService.getRequests();

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
                req.params.requestId
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
                req.params.requestId,
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
                req.params.requestId
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
                req.params.requestId,
                req.body.verified_by
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
                req.params.requestId,
                req.body.verified_by,
                req.body.rejection_reason
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
                req.params.requestId
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
                req.params.requestId
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