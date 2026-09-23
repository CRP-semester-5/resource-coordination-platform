import express from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "@crp/shared-middleware";

const router = express.Router();

// ── Internal route — called by other microservices, protected by INTERNAL_SECRET ──
// Must be registered BEFORE the authenticate middleware below.
router.post("/internal/emit", notificationController.internalEmit);

// ── User-facing routes — all require a valid JWT ──
router.use(authenticate);

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/mark-all-read", notificationController.markAllAsRead);

export default router;
