import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

let io

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers['authorization']

    if (!token) {
      return next(new Error('Authentication error: Token missing'))
    }

    try {
      const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token
      const decoded = jwt.verify(actualToken, config.jwtSecret)

      socket.user = decoded

      socket.join(decoded.sub)

      next()
    } catch (err) {
      next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected via socket: ${socket.user.sub}`)

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.sub}`)
    })
  })

  return io
}

export const sendNotificationToUser = (userId, notificationData) => {
  if (io) {
    io.to(userId).emit('notification', notificationData)
  }
}
