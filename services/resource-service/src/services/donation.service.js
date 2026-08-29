import * as donationRepository from "../repositories/donation.repository.js";
import * as inventoryRepository from "../repositories/inventory.repository.js";

export const createDonation = async (donationData) => {
    const { data, error } = await donationRepository.create(donationData);
    if (error) throw new Error(error.message);
    return data;
};

export const getDonations = async (organization_id, user_id) => {
    const { data, error } = await donationRepository.findAll(organization_id, user_id);
    if (error) throw new Error(error.message);
    return data;
};

export const getDonationById = async (donationId) => {
    const { data, error } = await donationRepository.findById(donationId);
    if (error) throw new Error(error.message);
    return data;
};

export const updateDonation = async (donationId, donationData) => {
    const { data, error } = await donationRepository.update(donationId, donationData);
    if (error) throw new Error(error.message);
    return data;
};

export const verifyDonation = async (donationId, verifiedBy) => {
    const donation = await getDonationById(donationId);
    if (!donation) throw new Error("Donation not found");
    if (donation.status !== "PENDING") throw new Error("Can only verify PENDING donations");

    return await updateDonation(donationId, {
        status: "VERIFIED",
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
    });
};

/**
 * Approve (accept) a donation:
 * 1. Mark donation status as ACCEPTED
 * 2. Update the inventory table:
 *    - Looks up category_id from resource_categories by donation.category name
 *    - If inventory row exists for (org, category) → increment quantity
 *    - If not → create a new inventory row
 */
export const approveDonation = async (donationId, approvedBy) => {
    const donation = await getDonationById(donationId);
    if (!donation) throw new Error("Donation not found");
    if (donation.status === "ACCEPTED") throw new Error("Donation already accepted");
    if (donation.status !== "PENDING") throw new Error("Can only accept PENDING donations");

    // 1. Mark donation as ACCEPTED
    const updated = await updateDonation(donationId, {
        status: "ACCEPTED",
        verified_by: approvedBy,
        verified_at: new Date().toISOString(),
    });

    // 2. Upsert into the inventory table (create or increment)
    const { error: inventoryErr } = await inventoryRepository.upsertFromDonation({
        organization_id: donation.organization_id,
        category: donation.category,
        quantity: donation.quantity,
    });

    if (inventoryErr) {
        // Donation is already accepted — log the error but don't fail the whole request
        console.warn("Inventory update failed:", inventoryErr.message);
    }

    return updated;
};

export const rejectDonation = async (donationId, verifiedBy, rejection_reason) => {
    const donation = await getDonationById(donationId);
    if (!donation) throw new Error("Donation not found");
    if (donation.status !== "PENDING") throw new Error("Can only reject PENDING donations");

    return await updateDonation(donationId, {
        status: "REJECTED",
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        rejection_reason: rejection_reason,
    });
};
