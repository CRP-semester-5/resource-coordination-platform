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

router.post("/", 
    authenticate,
    requireOrgRole('ORGANIZATION_ADMIN'),
    validate(membershipParamsSchema, "params"),
    validate(createMembershipSchema),
    membershipController.createMembership
);

router.get("/",
    authenticate,
    requireOrgRole('ORGANIZATION_ADMIN', 'COORDINATOR'),
    validate(membershipParamsSchema, "params"),
    membershipController.getMembers);

router.get("/:membershipId",
    authenticate,
    requireOrgRole('ORGANIZATION_ADMIN', 'COORDINATOR'),
    validate(membershipParamsSchema, "params"),
    membershipController.getMembershipById);

router.patch("/:membershipId",
    authenticate,
    requireOrgRole('ORGANIZATION_ADMIN'),
    validate(membershipParamsSchema, "params"),
    validate(updateMembershipSchema),
    membershipController.updateMembership);

router.delete("/:membershipId",
    authenticate,
    requireOrgRole('ORGANIZATION_ADMIN'),
    validate(membershipParamsSchema, "params"),
    membershipController.deleteMembership);

export default router;
