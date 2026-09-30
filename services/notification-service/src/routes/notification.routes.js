import express from "express";
import * as notificationController from "../controllers/notification.controller.js";
import feedRoutes from "./feed.routes.js";
import { authenticate } from "@crp/shared-middleware";

const router = express.Router();

// Coordination feed routes under /api/v1/notifications/feed
router.use("/feed", feedRoutes);

// Internal route without auth for other microservices
router.post("/internal/send", notificationController.sendNotification);

router.use(authenticate); // All routes require authentication

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/mark-all-read", notificationController.markAllAsRead);

export default router;
