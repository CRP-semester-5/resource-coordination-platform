import express from "express";
import cors from "cors";
import taskRoutes from "./routes/task.routes.js";
import { errorHandler } from "@crp/shared-middleware";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/tasks", taskRoutes);

app.use(errorHandler);

export default app;
