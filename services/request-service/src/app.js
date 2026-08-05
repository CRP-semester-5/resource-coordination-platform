import express from "express";
import requestRoutes from "./routes/request.routes.js";

const app = express();

app.use(express.json());

app.use("/api/v1/requests", requestRoutes);

export default app;