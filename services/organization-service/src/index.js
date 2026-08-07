import "dotenv/config";
import app from "./app.js";
import { supabase } from "./lib/supabase.js";

const PORT = process.env.ORGANIZATION_SERVICE_PORT || 3002;

app.get("/health", async (req, res) => {
    try {
        const { error } = await supabase
            .from("organizations")
            .select("organization_id")
            .limit(1);

        if (error) {
            return res.status(503).json({
                status: "unhealthy",
                service: "organization-service",
                db: "unreachable",
                error: error.message,
            });
        }

        res.json({
            status: "healthy",
            service: "organization-service",
            db: "connected",
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        res.status(503).json({
            status: "unhealthy",
            service: "organization-service",
            db: "unreachable",
            error: err.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Organization Service running on port ${PORT}`);
});