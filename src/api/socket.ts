// src/api/socket.ts
import { io } from 'socket.io-client';

// Production serves the SPA behind nginx, which proxies /socket.io to auth_service.
// VITE_SOCKET_URL only overrides the target for development or split hosting.
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:8099' : window.location.origin);

const socket = io(SOCKET_URL, {
  autoConnect: true,
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
