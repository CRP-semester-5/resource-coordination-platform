import * as donationRepository from "../repositories/donation.repository.js";
import * as inventoryService from "./inventory.service.js";

export const createDonation = async(donationData)=>{

    const {data,error} =
        await donationRepository.create(donationData);

    if(error){
        throw new Error(error.message);
    }

    return data;

};

export const getDonations = async(organization_id)=>{

    const {data,error} =
        await donationRepository.findAll(organization_id);

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

export const approveDonation = async(donationId) => {
    // 1. Get donation details
    const donation = await getDonationById(donationId);
    if (!donation) throw new Error("Donation not found");
    if (donation.status === "ACCEPTED") throw new Error("Donation already accepted");

    // 2. Mark as ACCEPTED
    const updated = await updateDonation(donationId, { status: "ACCEPTED" });

    // 3. Increase inventory
    await inventoryService.increaseInventory(donation.organization_id, donation.category_id, donation.quantity);

    return updated;
};

export const rejectDonation = async(donationId) => {
    const donation = await getDonationById(donationId);
    if (!donation) throw new Error("Donation not found");
    if (donation.status !== "PENDING") throw new Error("Can only reject PENDING donations");

    return await updateDonation(donationId, { status: "REJECTED" });
};
