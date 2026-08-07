import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config/env.js'
import taskRoutes from './routes/task.routes.js'

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Health endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'task-service', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/v1/tasks', taskRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    code: err.code
  })
})

const PORT = config.port

app.listen(PORT, () => {
  console.log(`task-service running on port ${PORT}`)
})
