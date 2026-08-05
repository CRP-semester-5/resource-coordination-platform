import 'dotenv/config'
import express from 'express'
import requestRoutes from './routes/request.routes.js'
import { supabase } from './lib/supabase.js'

const app = express()

const PORT = process.env.REQUEST_SERVICE_PORT || 3004

app.use(express.json())

// Routes
app.use('/api/v1/requests', requestRoutes)

// Health Check
app.get('/health', async (req, res) => {
    try {
        const { error } = await supabase
            .from('requests')
            .select('request_id')
            .limit(1)

        if (error) {
            return res.status(503).json({
                status: 'unhealthy',
                service: 'request-service',
                db: 'unreachable',
                error: error.message,
                timestamp: new Date().toISOString(),
            })
        }

        res.json({
            status: 'healthy',
            service: 'request-service',
            db: 'connected',
            timestamp: new Date().toISOString(),
        })

    } catch (err) {
        res.status(503).json({
            status: 'unhealthy',
            service: 'request-service',
            db: 'unreachable',
            error: err.message,
            timestamp: new Date().toISOString(),
        })
    }
})

app.listen(PORT, () => {
    console.log(`Request Service running on port ${PORT}`)
    console.log(`Health: http://localhost:${PORT}/health`)
})