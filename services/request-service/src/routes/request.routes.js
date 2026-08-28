import express from "express";
import * as requestController from "../controllers/request.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { optionalAuth } from "../middleware/optionalAuth.middleware.js";
import { authenticate, requireOrgRole } from "@crp/shared-middleware";
import {
    createRequestSchema,
    updateRequestSchema
} from "../validators/request.validator.js";

const router = express.Router();

// Public / Guest / User endpoints (Optional Auth)
router.post(
    "/",
    optionalAuth,
    validate(createRequestSchema),
    requestController.createRequest
);

router.get(
    "/",
    optionalAuth,
    requestController.getRequests
);

router.get(
    "/:id",
    optionalAuth,
    requestController.getRequestById
);

// Protected endpoints (Requires Login)
router.patch(
    "/:id",
    authenticate,
    validate(updateRequestSchema),
    requestController.updateRequest
);

router.delete(
    "/:id",
    authenticate,
    requestController.deleteRequest
);

router.patch(
    "/:id/approve",
    authenticate,
    requireOrgRole("COORDINATOR", "ORGANIZATION_ADMIN"),
    requestController.approveRequest
);

router.patch(
    "/:id/reject",
    authenticate,
    requireOrgRole("COORDINATOR", "ORGANIZATION_ADMIN"),
    requestController.rejectRequest
);

router.patch(
    "/:id/cancel",
    authenticate,
    requestController.cancelRequest
);

export default router;
