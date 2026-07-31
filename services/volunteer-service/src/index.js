import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })

import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { supabase } from './lib/supabase.js'
import { env } from './config/env.js'
import volunteerRouter from './routes/volunteer.routes.js'

const app = express()

app.use(helmet())
app.use(cors({
    origin: env.frontendUrl,
    credentials: true,
}))

app.use(express.json({ limit: '1mb' }))


app.use('/api/v1/volunteers', volunteerRouter)


app.get('/health', async (req, res) => {
    try {
        const { error } = await supabase.from('volunteers').select('volunteer_id').limit(1)

        if (error) {
            return res.status(503).json({
                status: 'unhealthy',
                service: 'volunteer-service',
                db: 'unreachable',
                error: error.message,
                timestamp: new Date().toISOString(),
            })
        }

        res.json({
            status: 'healthy',
            service: 'volunteer-service',
            db: 'connected',
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            service: 'volunteer-service',
            db: 'unreachable',
            error: err.message,
            timestamp: new Date().toISOString(),
        })
    }
})


app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} not found` })
})


app.use((err, req, res, next) => {
    const status = err.status || 500
    const message = err.message || 'Internal server error'
    console.error(`[ERROR] ${status} | ${req.method} ${req.path} — ${message}`)
    res.status(status).json({ message })
})

app.listen(env.port, () => {
    console.log(`    volunteer-service running on port ${env.port}`)
    console.log(`    Health      → http://localhost:${env.port}/health`)
    console.log(`    Volunteers  → http://localhost:${env.port}/api/v1/volunteers`)
})
