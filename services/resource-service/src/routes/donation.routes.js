import express from "express";
import * as donationController from "../controllers/donation.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate } from "@crp/shared-middleware";
import {
    createDonationSchema,
    updateDonationSchema
} from "../validators/donation.validator.js";

const router = express.Router();

router.post(
    "/",
    authenticate,
    validate(createDonationSchema),
    donationController.createDonation
);

router.get(
    "/",
    authenticate,
    donationController.getDonations
);

router.get(
    "/:id",
    authenticate,
    donationController.getDonationById
);

router.patch(
    "/:id",
    authenticate,
    validate(updateDonationSchema),
    donationController.updateDonation
);

router.patch(
    "/:id/approve",
    authenticate,
    donationController.approveDonation
);

router.patch(
    "/:id/reject",
    authenticate,
    donationController.rejectDonation
);

router.delete(
    "/:id",
    authenticate,
    donationController.deleteDonation
);

export default router;

