import * as donationRepository 
from "../repositories/donation.repository.js";

export const createDonation = async(donationData)=>{

    const {data,error} =
        await donationRepository.create(donationData);

    if(error){
        throw new Error(error.message);
    }

    return data;

};

export const getDonations = async()=>{

    const {data,error} =
        await donationRepository.findAll();

    if(error){
        throw new Error(error.message);
    }

    return data;

};

export const getDonationById = async(donationId)=>{

    const {data,error} =
        await donationRepository.findById(donationId);

    if(error){
        throw new Error(error.message);
    }

    return data;

};

export const updateDonation = async(
    donationId,
    donationData
)=>{

    const {data,error} =
        await donationRepository.update(
            donationId,
            donationData
        );

    if(error){
        throw new Error(error.message);
    }

    return data;
};

export const deleteDonation = async(donationId)=>{

    const {error} =
        await donationRepository.remove(donationId);

    if(error){
        throw new Error(error.message);
    }

    return true;

};