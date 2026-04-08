"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import type { Socket } from "socket.io-client";
import { createSocket } from "@/lib/socket";
import { handleSocketEvent } from "@/lib/realtime/handleSocketEvent";
import { useToast } from "@/hooks/use-toast";

type SocketContextValue = {
  socket: Socket | null;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  const socket = useMemo(() => createSocket(), []);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    const handleEvent = (eventName: string, payload: unknown) => {
      handleSocketEvent(eventName, payload, toastRef.current);
    };

    socket.on("post:status_changed", (payload) =>
      handleEvent("post:status_changed", payload)
    );
    socket.on("notification", (payload) =>
      handleEvent("notification", payload)
    );

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const value = useMemo(() => ({ socket }), [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return ctx;
}
