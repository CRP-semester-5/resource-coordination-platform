import express from "express";
import * as taskController from "../controllers/task.controller.js";
import { authenticate, requireRole } from "@crp/shared-middleware";

const router = express.Router();

router.post(
    "/",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN"]),
    taskController.createTask
);

router.get(
    "/",
    authenticate,
    taskController.getTasks
);

router.get(
    "/:id",
    authenticate,
    taskController.getTaskById
);

router.patch(
    "/:id",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN", "VOLUNTEER"]),
    taskController.updateTask
);

router.post(
    "/:id/assign",
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN"]),
    taskController.assignTask
);

export default router;
