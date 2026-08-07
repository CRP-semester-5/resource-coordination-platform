import express from "express";
import * as donationController from "../controllers/donation.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createDonationSchema,
    updateDonationSchema
} from "../validators/donation.validator.js";

const router = express.Router();

router.post(
    "/",
    validate(createDonationSchema),
    donationController.createDonation
);

router.get(
    "/",
    donationController.getDonations
);

router.get(
    "/:id",
    donationController.getDonationById
);

router.patch(
    "/:id",
    validate(updateDonationSchema),
    donationController.updateDonation
);

router.patch(
    "/:id/approve",
    donationController.approveDonation
);

router.patch(
    "/:id/reject",
    donationController.rejectDonation
);

router.delete(
    "/:id",
    donationController.deleteDonation
);

export default router;
