import express from "express";
import * as volunteerController from "../controllers/volunteer.controller.js";
import { authenticate, requireRole } from "@crp/shared-middleware";

const router = express.Router();

router.post(
    "/",
    authenticate,
    volunteerController.registerVolunteer
);

router.get(
    "/",
    volunteerController.getVolunteers
);

router.get(
    "/:id",
    authenticate,
    volunteerController.getVolunteerById
);

router.post(
    "/:id/skills",
    authenticate,
    volunteerController.addSkill
);

export default router;
