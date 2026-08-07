import express from "express";
import * as resourceController
from "../controllers/resource.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createResourceSchema,
    updateResourceSchema
} from "../validators/resource.validator.js";

const router = express.Router();
router.post(
    "/",
    validate(createResourceSchema),
    resourceController.createResource
);
router.get(
    "/",
    resourceController.getResources
);
router.get(
    "/:id",
    resourceController.getResourceById
);
router.patch(
    "/:id",
    validate(updateResourceSchema),
    resourceController.updateResource
);
router.delete(
    "/:id",
    resourceController.deleteResource
);
export default router;