"use client";

import { io, type Socket } from "socket.io-client";
import { getSocketTicket } from "../services/chat.service";

let socket: Socket | null = null;
let connecting: Promise<Socket> | null = null;
let authRefreshInstalled = false;

async function applyFreshTicket(target: Socket) {
  const ticket = await getSocketTicket();
  target.auth = { ticket: ticket.ticket };
}

export async function getChatSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  connecting = (async () => {
    const ticket = await getSocketTicket();
    const socketUrl = ticket.socketUrl || process.env.NEXT_PUBLIC_MEYDAN_CHAT_SOCKET_URL || "http://localhost:3001";
    const target = socket ?? io(socketUrl, {
      autoConnect: false,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      auth: { ticket: ticket.ticket },
    });
    socket = target;

    if (!authRefreshInstalled) {
      authRefreshInstalled = true;
      target.on("connect_error", (error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!/ticket|signature|expired|unauthorized/i.test(message)) return;
        void applyFreshTicket(target)
          .then(() => {
            if (!target.connected) target.connect();
          })
          .catch(() => undefined);
      });
    }

    if (!target.connected) target.connect();
    return target;
  })().finally(() => {
    connecting = null;
  });

  return connecting;
}

export function currentChatSocket(): Socket | null {
  return socket;
}
