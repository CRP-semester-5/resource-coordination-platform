import * as donationService from "../services/donation.service.js";

export const createDonation = async(req,res)=>{
    try{
        const donationData = {
            ...req.body,
            donor_id: req.user.sub
        };
        const donation = await donationService.createDonation(donationData);

        return res.status(201).json({
            success:true,
            message:"Donation submitted successfully",
            data:donation
        });
    }catch(error){
        console.error('API_ERROR:', error); return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};

export const getDonations = async(req,res)=>{
    try {
        const organizationId = req.headers['x-organization-id'] || req.orgMembership?.org_id;
        const userId = req.user?.sub;
        const donations = await donationService.getDonations(organizationId, userId);

        return res.json({
            success: true,
            data: donations
        });
    } catch(error) {
        console.error('API_ERROR:', error); return res.status(400).json({ success: false, message: error.message });
    }
};

export const getDonationById = async(req,res)=>{
    try{
        const donation = await donationService.getDonationById(req.params.id);
        return res.json({
            success:true,
            data:donation
        });
    }catch(error){
        return res.status(404).json({
            success:false,
            message:error.message
        });
    }
};

export const verifyDonation = async(req,res)=>{
    try{
        const verifiedBy = req.user.sub;
        const donation = await donationService.verifyDonation(req.params.id, verifiedBy);

        return res.json({
            success:true,
            message:"Donation verified successfully",
            data:donation
        });
    }catch(error){
        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};

export const approveDonation = async(req,res)=>{
    try{
        const approvedBy = req.user.sub;
        const donation = await donationService.approveDonation(req.params.id, approvedBy);

        return res.json({
            success:true,
            message:"Donation verified successfully",
            data:donation
        });
    }catch(error){
        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};

export const rejectDonation = async(req,res)=>{
    try{
        const verifiedBy = req.user.sub;
        const { rejection_reason } = req.body;
        const donation = await donationService.rejectDonation(req.params.id, verifiedBy, rejection_reason);

        return res.json({
            success:true,
            message:"Donation rejected successfully",
            data:donation
        });
    }catch(error){
        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};
