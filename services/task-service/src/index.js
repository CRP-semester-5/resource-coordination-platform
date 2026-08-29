import app from "./app.js";
const PORT = process.env.TASK_SERVICE_PORT || 3005;
app.get("/health", (req, res) => res.json({status: "healthy", service: "task-service"}));
app.listen(PORT, () => console.log("Task Service running on port " + PORT));
