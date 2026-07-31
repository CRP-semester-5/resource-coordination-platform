import express from "express";
import * as organizationController from "../controllers/organization.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createOrganizationSchema } from "../validators/organization.validator.js";
import membershipRoutes from "./membership.routes.js";

const router = express.Router();

router.post(
    "/",
    validate(createOrganizationSchema),
    organizationController.createOrganization
);

router.get("/", organizationController.getOrganizations);

router.get("/:id", organizationController.getOrganizationById);

router.patch("/:id", organizationController.updateOrganization);

router.delete("/:id", organizationController.deleteOrganization);

router.patch("/:id/approve", organizationController.approveOrganization);

router.patch("/:id/reject", organizationController.rejectOrganization);

router.use("/:organizationId/members", membershipRoutes);

export default router;