import express from "express";
import organizationRoutes from "./routes/organization.routes.js";

const app = express();

app.use(express.json());

app.use("/api/v1/organizations", organizationRoutes);

export default app;