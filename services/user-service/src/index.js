import 'dotenv/config'
import express from 'express'
import { supabase } from './lib/supabase.js'

const app = express()
const PORT = process.env.USER_SERVICE_PORT || 3001

app.use(express.json())

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', async (req, res) => {
    try {
        const { error } = await supabase.from('users').select('id').limit(1)

        if (error) {
            return res.status(503).json({
                status: 'unhealthy',
                service: 'user-service',
                db: 'unreachable',
                error: error.message,
                timestamp: new Date().toISOString(),
            })
        }

        res.json({
            status: 'healthy',
            service: 'user-service',
            db: 'connected',
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            service: 'user-service',
            db: 'unreachable',
            error: err.message,
            timestamp: new Date().toISOString(),
        })
    }
})

app.listen(PORT, () => {
    console.log(`user-service running on port ${PORT}`)
    console.log(`Health: http://localhost:${PORT}/health`)
});
// this has to be changed "http://localhost:${PORT}/health"
