import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

// Resolve the root .env regardless of where `node` is invoked from
// e.g. running from services/user-service/ still finds ../../.env
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import express from 'express'
import { supabase } from './lib/supabase.js'
import authRouter from './routes/auth.routes.js'

const app = express()
const PORT = process.env.USER_SERVICE_PORT || 3001

app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────
app.use('/auth', authRouter)

// ── Health Check ──────────────────────────────────────────────────
app.get('/health', async (req, res) => {
    try {
        // Fixed: column is user_id (UUID), not 'id'
        const { error } = await supabase.from('users').select('user_id').limit(1)

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

// ── Global Error Handler ───────────────────────────────────────────
// Must have exactly 4 parameters for Express to treat it as an error handler
app.use((err, req, res, next) => {
    const status = err.status || 500
    const message = err.message || 'Internal server error'
    console.error(`[ERROR] ${status} | ${req.method} ${req.path} — ${message}`)
    res.status(status).json({ message })
})

app.listen(PORT, () => {
    console.log(`✅  user-service running on port ${PORT}`)
    console.log(`    Health  → http://localhost:${PORT}/health`)
    console.log(`    Auth    → http://localhost:${PORT}/auth`)
})
