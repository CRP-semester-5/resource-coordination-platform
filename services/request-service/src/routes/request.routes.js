import express from "express";
import * as requestController from "../controllers/request.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { authenticate, requireOrgRole } from "@crp/shared-middleware";
import {
    createRequestSchema,
    updateRequestSchema
} from "../validators/request.validator.js";

const router = express.Router();

router.use(authenticate);

router.post("/", validate(createRequestSchema),
    requestController.createRequest);

router.get("/", requestController.getRequests);

router.get("/:id", requestController.getRequestById);

router.patch("/:id", validate(updateRequestSchema),
    requestController.updateRequest);

router.delete("/:id", requestController.deleteRequest);

router.patch("/:id/approve", requireOrgRole("COORDINATOR", "ORGANIZATION_ADMIN"), requestController.approveRequest);

router.patch("/:id/reject", requireOrgRole("COORDINATOR", "ORGANIZATION_ADMIN"), requestController.rejectRequest);

router.patch("/:id/cancel", requestController.cancelRequest);

router.patch("/:id/progress", requireOrgRole("COORDINATOR", "ORGANIZATION_ADMIN"), requestController.markInProgress);

router.patch("/:id/fulfill", requireOrgRole("COORDINATOR", "ORGANIZATION_ADMIN"), requestController.fulfillRequest);

export default router;
