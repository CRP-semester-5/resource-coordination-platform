import express from "express";
import * as membershipController from "../controllers/membership.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createMembershipSchema,
    updateMembershipSchema,
    membershipParamsSchema,
} from "../validators/membership.validator.js";
import { authenticate, requireOrgRole } from "@crp/shared-middleware";

const router = express.Router({ mergeParams: true });

// Accept invitation (Public endpoint clicked from email, no auth required)
router.get("/:membershipId/accept", membershipController.acceptInvitation);
router.post("/:membershipId/accept", membershipController.acceptInvitation);

router.post("/", 
    authenticate,
    requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
    validate(membershipParamsSchema, "params"),
    validate(createMembershipSchema),
    membershipController.createMembership
);

// Resend invitation email
router.post("/:membershipId/resend",
    authenticate,
    requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
    validate(membershipParamsSchema, "params"),
    membershipController.resendInvitation
);

router.get("/",
    authenticate,
    requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
    validate(membershipParamsSchema, "params"),
    membershipController.getMembers);

router.get("/:membershipId",
    authenticate,
    requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
    validate(membershipParamsSchema, "params"),
    membershipController.getMembershipById);

router.patch("/:membershipId",
    authenticate,
    requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
    validate(membershipParamsSchema, "params"),
    validate(updateMembershipSchema),
    membershipController.updateMembership);

router.delete("/:membershipId",
    authenticate,
    requireOrgRole('COORDINATOR', 'ORGANIZATION_ADMIN'),
    validate(membershipParamsSchema, "params"),
    membershipController.deleteMembership);

export default router;
