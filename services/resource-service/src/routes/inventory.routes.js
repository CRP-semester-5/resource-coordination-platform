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

router.get(
    "/transactions",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN"]),
    inventoryController.getTransactions
);

router.post(
    "/check-stock",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN"]),
    inventoryController.checkStock
);

router.post(
    "/",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN"]),
    inventoryController.addInventory
);

router.post(
    "/:id/restock",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN"]),
    inventoryController.restock
);

router.post(
    "/deduct",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN"]),
    inventoryController.deductInventory
);

router.post(
    "/:id/allocate",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN"]),
    inventoryController.allocate
);

export default router;
