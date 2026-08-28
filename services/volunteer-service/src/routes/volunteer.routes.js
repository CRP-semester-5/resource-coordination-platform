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
    authenticate,
    requireRole(["COORDINATOR", "ORGANIZATION_ADMIN", "SUPER_ADMIN"]),
    volunteerController.getVolunteers
);

router.get(
    "/me",
    authenticate,
    volunteerController.getMyVolunteerProfile
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
