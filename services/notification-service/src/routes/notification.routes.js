import express from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authenticate } from "@crp/shared-middleware";

const router = express.Router();

router.use(authenticate); // All routes require authentication

router.get("/", notificationController.getNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.patch("/:id/read", notificationController.markAsRead);
router.post("/mark-all-read", notificationController.markAllAsRead);

export default router;
