import express from "express";
import cors from "cors";
import notificationRoutes from "./routes/notification.routes.js";
import { errorHandler } from "@crp/shared-middleware";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/notifications", notificationRoutes);

app.use(errorHandler);

export default app;
