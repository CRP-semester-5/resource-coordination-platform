import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

// Load .env from repo root before any other imports that read process.env
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { supabase } from './lib/supabase.js'
import { env } from './config/env.js'
import authRouter from './routes/auth.routes.js'
import userRouter from './routes/user.routes.js'

const app = express()

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
    origin: env.frontendUrl,
    credentials: true,
}))
app.use(express.json({ limit: '1mb' }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/users', userRouter)

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
    try {
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

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} not found` })
})

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const status = err.status || 500
    const message = err.message || 'Internal server error'
    console.error(`[ERROR] ${status} | ${req.method} ${req.path} — ${message}`)
    res.status(status).json({ message })
})

app.listen(env.port, () => {
    console.log(`✅  user-service running on port ${env.port}`)
    console.log(`    Health  → http://localhost:${env.port}/health`)
    console.log(`    Auth    → http://localhost:${env.port}/api/v1/auth`)
    console.log(`    Users   → http://localhost:${env.port}/api/v1/users`)
})
