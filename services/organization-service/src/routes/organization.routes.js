import express from "express";
import * as organizationController from "../controllers/organization.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createOrganizationSchema } from "../validators/organization.validator.js";
import membershipRoutes from "./membership.routes.js";
import { authenticate, requireGlobalRole, requireOrgRole } from "@crp/shared-middleware";

const router = express.Router();

// User applies for an organization
router.post(
    "/",
    authenticate,
    validate(createOrganizationSchema),
    organizationController.createOrganization
);

// Get user's own organizations
router.get("/me", authenticate, organizationController.getMyOrganizations);

// Super Admin views pending organizations
router.get("/pending", authenticate, requireGlobalRole('SUPER_ADMIN'), organizationController.getPendingOrganizations);

// Publicly view active organizations
router.get("/", organizationController.getOrganizations);
router.get("/:id", organizationController.getOrganizationById);

// Org Admin updates their organization
router.patch(
    "/:organizationId", 
    authenticate, 
    requireOrgRole('ORGANIZATION_ADMIN'), 
    organizationController.updateOrganization
);

// Super Admin deletes an organization
router.delete("/:id", authenticate, requireGlobalRole('SUPER_ADMIN'), organizationController.deleteOrganization);

// Super Admin approves/rejects applications
router.patch("/:id/approve", authenticate, requireGlobalRole('SUPER_ADMIN'), organizationController.approveOrganization);
router.patch("/:id/reject", authenticate, requireGlobalRole('SUPER_ADMIN'), organizationController.rejectOrganization);

router.use("/:organizationId/members", membershipRoutes);

export default router;
