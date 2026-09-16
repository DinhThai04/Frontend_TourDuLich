// src/api/socket.ts
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:8099'; // ⚠️ đổi cổng nếu backend khác

const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

export default socket;
