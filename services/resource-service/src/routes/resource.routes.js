import express from "express";
import * as resourceController
from "../controllers/resource.controller.js";

const router = express.Router();
router.post(
    "/",
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
    resourceController.updateResource
);
router.delete(
    "/:id",
    resourceController.deleteResource
);
export default router;