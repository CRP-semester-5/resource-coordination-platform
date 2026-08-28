import * as donationService from "../services/donation.service.js";

export const createDonation = async(req,res)=>{
    try {
        if (!req.body.donor_id && req.user) req.body.donor_id = req.user.sub;
        if (!req.body.organization_id) {
            const { supabase } = await import("../lib/supabase.js");
            const { data, error } = await supabase.from("organizations").select("organization_id").limit(1);
            if (!error && data && data.length > 0) {
                req.body.organization_id = data[0].organization_id;
            } else {
                return res.status(400).json({ success: false, message: "No organizations found in database to assign donation to." });
            }
        }

        const donation = await donationService.createDonation(req.body);
        return res.status(201).json({ success: true, message: "Donation created successfully.", data: donation });
    } catch(error) {
        console.error('API_ERROR:', error); return res.status(400).json({ success: false, message: error.message });
    }
};

export const getDonations = async(req,res)=>{
    try {
        const donations = await donationService.getDonations();
        return res.json({ success: true, data: donations });
    } catch(error) {
        console.error('API_ERROR:', error); return res.status(400).json({ success: false, message: error.message });
    }
};

export const getDonationById = async(req,res)=>{
    try {
        const donation = await donationService.getDonationById(req.params.id);
        return res.json({ success: true, data: donation });
    } catch(error) {
        console.error('API_ERROR:', error); return res.status(400).json({ success: false, message: error.message });
    }
};

export const updateDonation = async(req,res)=>{
    try {
        const donation = await donationService.updateDonation(req.params.id, req.body);
        return res.json({ success: true, message: "Donation updated successfully.", data: donation });
    } catch(error) {
        console.error('API_ERROR:', error); return res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteDonation = async(req,res)=>{
    try {
        await donationService.deleteDonation(req.params.id);
        return res.json({ success: true, message: "Donation deleted successfully." });
    } catch(error) {
        console.error('API_ERROR:', error); return res.status(400).json({ success: false, message: error.message });
    }
};

export const approveDonation = async(req, res, next) => {
    try {
        const donation = await donationService.approveDonation(req.params.id);
        return res.json({ success: true, message: "Donation approved and inventory updated.", data: donation });
    } catch (error) {
        next(error);
    }
};

export const rejectDonation = async(req, res, next) => {
    try {
        const donation = await donationService.rejectDonation(req.params.id);
        return res.json({ success: true, message: "Donation rejected.", data: donation });
    } catch (error) {
        next(error);
    }
};

