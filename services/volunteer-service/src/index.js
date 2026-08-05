import express from "express";
const app = express();
const PORT = process.env.VOLUNTEER_SERVICE_PORT || 3006;
app.get("/health", (req, res) => res.json({status: "healthy", service: "volunteer-service"}));
app.listen(PORT, () => console.log("Volunteer Service running on port " + PORT));
