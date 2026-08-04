import express from "express";
import cors from "cors";

import resourceRoutes from "./routes/resource.routes.js";
import donationRoutes from "./routes/donation.routes.js";
const app = express();
app.use(cors());
app.use(express.json());
// Routes
app.use(
    "/api/v1/resources",
    resourceRoutes
);
app.use(
    "/api/v1/donations",
    donationRoutes
);
export default app 