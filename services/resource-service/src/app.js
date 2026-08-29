import express from "express";
import cors from "cors";

import categoryRoutes from "./routes/category.routes.js";
import resourceRoutes from "./routes/resource.routes.js";
import donationRoutes from "./routes/donation.routes.js";
import inventoryRoutes from "./routes/inventory.routes.js";
const app = express();
app.use(cors());
app.use(express.json());
// Routes
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/inventory", inventoryRoutes);
app.use(
    "/api/v1/resources",
    resourceRoutes
);
app.use(
    "/api/v1/donations",
    donationRoutes
);
export default app 
