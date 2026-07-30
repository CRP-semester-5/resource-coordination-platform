import express from "express";
import * as membershipController from "../controllers/membership.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
    createMembershipSchema,
    updateMembershipSchema,
    membershipParamsSchema,
} from "../validators/membership.validator.js";

const router = express.Router({ mergeParams: true });

router.post("/", validate(membershipParamsSchema, "params"),validate(createMembershipSchema),membershipController.createMembership);

router.get("/",
    validate(membershipParamsSchema, "params"),
    membershipController.getMembers);

router.get("/:membershipId",
    validate(membershipParamsSchema, "params"),
    membershipController.getMembershipById);

router.patch("/:membershipId",
    validate(membershipParamsSchema, "params"),
    validate(updateMembershipSchema),
    membershipController.updateMembership);

router.delete("/:membershipId",
    validate(membershipParamsSchema, "params"),
    membershipController.deleteMembership);

export default router;