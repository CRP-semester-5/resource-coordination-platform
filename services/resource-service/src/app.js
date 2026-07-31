import express from "express";
import cors from "cors";

import resourceRoutes from "./routes/resource.routes.js";

const app = express();
app.use(cors());
app.use(express.json());
// Routes
app.use(
    "/api/v1/resources",
    resourceRoutes
);

export default app;