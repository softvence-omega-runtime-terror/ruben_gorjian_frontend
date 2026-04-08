import { io, type Socket } from "socket.io-client";
import { getEnvVar } from "@/lib/env-utils";

const SOCKET_URL =
  getEnvVar("NEXT_PUBLIC_SOCKET_URL") ||
  getEnvVar("NEXT_PUBLIC_API_URL") ||
  undefined;

export function createSocket(token?: string): Socket {
  return io(SOCKET_URL, {
    transports: ["websocket"],
    withCredentials: true,
    auth: token ? { token } : undefined,
  });
}
