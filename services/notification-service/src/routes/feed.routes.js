import express from "express";
import * as feedController from "../controllers/feed.controller.js";
import { authenticate } from "@crp/shared-middleware";

const router = express.Router();

// All feed routes require authentication
router.use(authenticate);

router.get("/", feedController.getFeed);
router.post("/", feedController.createMessage);
router.post("/:id/react", feedController.toggleReaction);
router.patch("/:id/status", feedController.updateStatus);
router.delete("/:id", feedController.deleteMessage);

export default router;
