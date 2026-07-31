import express from "express";
import * as requestController from "../controllers/request.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createRequestSchema,
    updateRequestSchema
} from "../validators/request.validator.js";


const router = express.Router();

router.post("/", validate(createRequestSchema),
    requestController.createRequest);

router.get("/", requestController.getRequests);

router.get("/:id", requestController.getRequestById);

router.patch("/:id", validate(updateRequestSchema),
    requestController.updateRequest);

router.delete("/:id", requestController.deleteRequest);

router.patch("/:id/approve", requestController.approveRequest);

router.patch("/:id/reject", requestController.rejectRequest);

router.patch("/:id/cancel", requestController.cancelRequest);

export default router;