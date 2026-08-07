import express from 'express'
import http from 'http'
import cors from 'cors'
import helmet from 'helmet'
import { config } from './config/env.js'
import { initializeSocket } from './sockets/socketManager.js'
import notificationRoutes from './routes/notification.routes.js'

const app = express()
const server = http.createServer(app)

export const io = initializeSocket(server)

app.use(helmet())
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', service: 'notification-service', timestamp: new Date().toISOString() })
})

app.use('/api/v1/notifications', notificationRoutes)

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    code: err.code
  })
})

const PORT = config.port

server.listen(PORT, () => {
  console.log(`notification-service running on port ${PORT}`)
})
