import * as donationService 
from "../services/donation.service.js";

export const createDonation = async(req,res)=>{

    try{

        const donation =
            await donationService.createDonation(
                req.body
            );

        return res.status(201).json({

            success:true,

            message:"Donation created successfully.",

            data:donation

        });

    }catch(error){

        return res.status(400).json({

            success:false,

            message:error.message

        });

    }

};

export const getDonations = async(req,res)=>{

    try{

        const donations =
            await donationService.getDonations();

        return res.json({
            success:true,
            data:donations
        });

    }catch(error){

        return res.status(400).json({

            success:false,

            message:error.message

        });

    }

};

export const getDonationById = async(req,res)=>{

    try{

        const donation =
            await donationService.getDonationById(
                req.params.id
            );

        return res.json({
            success:true,
            data:donation
        });

    }catch(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });

    }

};

export const updateDonation = async(req,res)=>{

    try{

        const donation =
            await doantionService.updateDonation(
                req.params.id,
                req.body
            );

        return res.json({
            success:true,
            message:"Donation updated successfully.",
            data:donation
        });

    }catch(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });
    }
};

export const deleteDonation = async(req,res)=>{

    try{

        await donationService.deleteDonation(
            req.params.id
        );

        return res.json({
            success:true,
            message:"Donation deleted successfully."
        });

    }catch(error){

        return res.status(400).json({
            success:false,
            message:error.message
        });

    }

};