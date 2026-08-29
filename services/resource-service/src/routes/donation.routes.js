import express from "express";
import * as donationController from "../controllers/donation.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createDonationSchema,
    rejectDonationSchema
} from "../validators/donation.validator.js";
import { authenticate, requireOrgRole } from "@crp/shared-middleware";

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
    "/:id/verify",
    authenticate,
    requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
    donationController.verifyDonation
);

router.patch(
    "/:id/approve",
    authenticate,
    requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
    donationController.approveDonation
);

router.patch(
    "/:id/reject",
    authenticate,
    requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
    validate(rejectDonationSchema),
    donationController.rejectDonation
);

export default router;
