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
    "/me",
    authenticate,
    taskController.getMyTasks
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
    taskController.updateTask
);

// Allow both coordinators assigning volunteers AND volunteers accepting tasks
router.post(
    "/:id/assign",
    authenticate,
    taskController.assignTask
);

router.post(
    "/:id/progress",
    authenticate,
    taskController.addProgress
);

router.get(
    "/:id/progress",
    authenticate,
    taskController.getTaskProgress
);
router.post(
    "/:id/verify-handover",
    authenticate,
    taskController.verifyHandover
);

router.post(
    "/:id/regenerate-pin",
    authenticate,
    taskController.regeneratePin
);


export default router;
