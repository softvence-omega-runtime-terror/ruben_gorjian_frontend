import { io, type Socket } from "socket.io-client";
import { getEnvVar } from "@/lib/env-utils";

const SOCKET_URL =
  getEnvVar("NEXT_PUBLIC_SOCKET_URL") ||
  getEnvVar("API_URL") ||
  undefined;

export function createSocket(token?: string): Socket {
  if (!SOCKET_URL) {
    console.warn("SOCKET_URL is not defined. WebSocket connection will likely fail.");
  }

  return io(SOCKET_URL || "", {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    withCredentials: true,
    autoConnect: true,
    auth: token ? { token } : undefined,
  });
}
