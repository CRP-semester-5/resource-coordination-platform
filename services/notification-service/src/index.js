import app from "./app.js";
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3007;
app.get("/health", (req, res) => res.json({status: "healthy", service: "notification-service"}));
app.listen(PORT, () => console.log("Notification Service running on port " + PORT));
