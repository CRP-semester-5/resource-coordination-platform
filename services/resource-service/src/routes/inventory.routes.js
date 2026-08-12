import express from "express";
import * as inventoryController from "../controllers/inventory.controller.js";
import { authenticate, requireRole } from "@crp/shared-middleware";

const router = express.Router();

router.get(
    "/",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN"]),
    inventoryController.getInventory
);

export default router;
