import express from "express";
import * as categoryController from "../controllers/category.controller.js";
import { authenticate, requireRole } from "@crp/shared-middleware";
import { validate } from "../middleware/validate.middleware.js";
import { createCategorySchema, updateCategorySchema } from "../validators/category.validator.js";

const router = express.Router();

// Only Super Admins can manage global resource categories
router.post(
    "/",
    authenticate,
    requireRole("SUPER_ADMIN"),
    validate(createCategorySchema),
    categoryController.createCategory
);

router.get(
    "/",
    categoryController.getCategories // Public or logged-in users can view
);

router.get(
    "/:id",
    categoryController.getCategoryById
);

router.patch(
    "/:id",
    authenticate,
    requireRole("SUPER_ADMIN"),
    validate(updateCategorySchema),
    categoryController.updateCategory
);

router.delete(
    "/:id",
    authenticate,
    requireRole("SUPER_ADMIN"),
    categoryController.deleteCategory
);

export default router;
