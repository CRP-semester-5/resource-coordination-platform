import * as donationService from "../services/donation.service.js";

const sendNotification = async ({ userId, title, body, data, link }) => {
    if (!userId) return;
    const notifPayload = {
        userId,
        title,
        body,
        data: {
            ...data,
            link: link || (data?.id ? `/donations/${data.id}` : null)
        }
    };
    const notifUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3007';
    try {
        await fetch(`${notifUrl}/api/v1/notifications/internal/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notifPayload)
        });
    } catch (e) {
        console.warn('[Donation] notification-service unreachable, saving directly to Supabase fallback:', e.message);
        try {
            const { supabase } = await import("../lib/supabase.js");
            await supabase.from("notifications").insert({
                user_id: userId,
                message: body,
                type: 'DONATION_STATUS_CHANGED',
                organization_id: data?.organization_id || null,
                link: link || (data?.id ? `/donations/${data.id}` : null),
                is_read: false
            });
        } catch(dbErr) {
            console.error('[Donation] Supabase fallback error:', dbErr.message);
        }
    }
};

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
        
        // Send notification to donor
        const donorId = donation?.donor_id || req.user.sub;
        if (donorId) {
            const pinText = donation?.handover_pin ? ` Your handover PIN is: ${donation.handover_pin}. Share this with the collection volunteer.` : '';
            sendNotification({
                userId: donorId,
                title: 'Donation Approved',
                body: `Your donation has been approved by our team.${pinText}`,
                data: {
                    type: 'DONATION_STATUS_CHANGED',
                    id: req.params.id,
                    organization_id: donation?.organization_id || null
                },
                link: `/donations/${req.params.id}`
            }).catch(e => console.warn('Donation notification error:', e));
        }

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

        // Send notification to donor
        const donorId = donation?.donor_id || req.user.sub;
        if (donorId) {
            sendNotification({
                userId: donorId,
                title: 'Donation Update',
                body: rejection_reason ? `Your donation was rejected: ${rejection_reason}` : 'Your donation was rejected by our team.',
                data: {
                    type: 'DONATION_STATUS_CHANGED',
                    id: req.params.id,
                    organization_id: donation?.organization_id || null
                },
                link: `/donations/${req.params.id}`
            }).catch(e => console.warn('Donation notification error:', e));
        }

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

export const regeneratePin = async(req, res) => {
    try {
        const result = await donationService.regeneratePin(req.params.id);
        
        try {
            const donation = await donationService.getDonationById(req.params.id).catch(() => null);
            const donorId = donation?.donor_id;
            const newPin = result?.handover_pin;
            if (donorId && newPin) {
                sendNotification({
                    userId: donorId,
                    title: 'Donation Handover PIN 🔐',
                    body: `Your new donation handover PIN is: ${newPin}. Please share this code with the volunteer upon collection.`,
                    data: {
                        type: 'DONATION_STATUS_CHANGED',
                        id: req.params.id,
                        organization_id: donation?.organization_id || null
                    },
                    link: `/donations/${req.params.id}`
                }).catch(e => console.warn('Donation regeneratePin notification error:', e));
            }
        } catch(notifErr) {
            console.warn('[Donation] regeneratePin notification failed:', notifErr.message);
        }

        return res.json({
            success: true,
            message: "Donation handover PIN regenerated successfully",
            data: result
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
