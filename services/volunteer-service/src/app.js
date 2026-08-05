import express from "express";
import cors from "cors";
import volunteerRoutes from "./routes/volunteer.routes.js";
import { errorHandler } from "@crp/shared-middleware";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/volunteers", volunteerRoutes);

app.use(errorHandler);

export default app;
