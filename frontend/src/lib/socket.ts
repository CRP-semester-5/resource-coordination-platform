/**
 * Socket.IO singleton for ResQ Hub.
 *
 * Usage:
 *   connectSocket(token)   — call after login, token is the JWT
 *   disconnectSocket()     — call on logout
 *   getSocket()            — get the current socket instance (may be null)
 */
import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env['VITE_SOCKET_URL'] ?? 'http://localhost:3007';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
    // Reuse existing connection if already connected
    if (socket?.connected) return socket;

    // Disconnect stale socket before creating a new one
    socket?.disconnect();

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
        console.log('[socket] Connected to notification-service');
    });

    socket.on('connect_error', (err) => {
        console.warn('[socket] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
        console.log('[socket] Disconnected:', reason);
    });

    return socket;
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}

export function getSocket(): Socket | null {
    return socket;
}
