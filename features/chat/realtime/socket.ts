"use client";

import { meydanApi } from "@/lib/meydan-api";

type Handler = (...args: any[]) => void;

type RealtimeConfig = {
  app_key: string;
  host: string;
  port: number;
  scheme: "http" | "https" | string;
  user_id: string | number;
};

type ChannelAuth = {
  auth: string;
  channel_data?: string;
};

type PusherFrame = {
  event?: string;
  channel?: string;
  data?: unknown;
};

function parseData(value: unknown): any {
  if (typeof value !== "string") return value ?? {};
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

class SoketiClient {
  connected = false;
  private ws: WebSocket | null = null;
  private listeners = new Map<string, Set<Handler>>();
  private config: RealtimeConfig | null = null;
  private socketId = "";
  private reconnectTimer: number | null = null;
  private reconnectAttempt = 0;
  private connecting: Promise<void> | null = null;

  on(event: string, handler: Handler) {
    const handlers = this.listeners.get(event) ?? new Set<Handler>();
    handlers.add(handler);
    this.listeners.set(event, handlers);
    return this;
  }

  off(event: string, handler?: Handler) {
    if (!handler) {
      this.listeners.delete(event);
      return this;
    }
    const handlers = this.listeners.get(event);
    handlers?.delete(handler);
    if (handlers?.size === 0) this.listeners.delete(event);
    return this;
  }

  async start() {
    if (this.connected) return;
    if (this.connecting) return this.connecting;
    this.connecting = this.open().finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  private emit(event: string, payload?: unknown) {
    for (const handler of this.listeners.get(event) ?? []) {
      try {
        handler(payload);
      } catch (error) {
        console.error("realtime handler failed", event, error);
      }
    }
  }

  private async open() {
    const config = await meydanApi<RealtimeConfig>("/chat/realtime/config");
    if (!config.app_key || !config.host) throw new Error("Soketi configuration is incomplete");
    this.config = config;

    const protocol = String(config.scheme).toLowerCase() === "https" ? "wss" : "ws";
    const port = Number(config.port || (protocol === "wss" ? 443 : 80));
    const url = `${protocol}://${config.host}:${port}/app/${encodeURIComponent(config.app_key)}?protocol=7&client=js&version=8.4.0&flash=false`;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(url);
      this.ws = ws;
      let established = false;
      const timeout = window.setTimeout(() => {
        if (!established) {
          ws.close();
          reject(new Error("Soketi connection timeout"));
        }
      }, 10_000);

      ws.onmessage = (message) => {
        let frame: PusherFrame;
        try {
          frame = JSON.parse(String(message.data)) as PusherFrame;
        } catch {
          return;
        }

        if (frame.event === "pusher:connection_established") {
          const data = parseData(frame.data) as { socket_id?: string };
          if (!data?.socket_id) return;
          established = true;
          window.clearTimeout(timeout);
          this.socketId = String(data.socket_id);
          this.connected = true;
          this.reconnectAttempt = 0;
          this.emit("connect");
          void this.subscribe(`private-user-${config.user_id}`);
          void this.subscribe("presence-meydan");
          resolve();
          return;
        }

        if (frame.event === "pusher:ping") {
          this.send({ event: "pusher:pong", data: {} });
          return;
        }

        if (frame.event === "pusher_internal:subscription_succeeded" && frame.channel === "presence-meydan") {
          const data = parseData(frame.data) as { presence?: { ids?: Array<string | number> } };
          for (const userId of data?.presence?.ids ?? []) {
            this.emit("presence:changed", { userId: String(userId), online: true });
          }
          return;
        }

        if (frame.event === "pusher_internal:member_added" && frame.channel === "presence-meydan") {
          const data = parseData(frame.data) as { user_id?: string | number };
          if (data?.user_id != null) this.emit("presence:changed", { userId: String(data.user_id), online: true });
          return;
        }

        if (frame.event === "pusher_internal:member_removed" && frame.channel === "presence-meydan") {
          const data = parseData(frame.data) as { user_id?: string | number };
          if (data?.user_id != null) this.emit("presence:changed", { userId: String(data.user_id), online: false });
          return;
        }

        if (frame.event?.startsWith("pusher:" ) || frame.event?.startsWith("pusher_internal:")) return;
        if (frame.event) this.emit(frame.event, parseData(frame.data));
      };

      ws.onerror = () => {
        if (!established) {
          window.clearTimeout(timeout);
          reject(new Error("Soketi connection failed"));
        }
      };

      ws.onclose = () => {
        window.clearTimeout(timeout);
        const wasConnected = this.connected;
        this.connected = false;
        this.socketId = "";
        if (wasConnected) this.emit("disconnect");
        this.scheduleReconnect();
      };
    });
  }

  private async subscribe(channelName: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.socketId) return;
    const auth = await meydanApi<ChannelAuth>("/chat/realtime/auth", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ socket_id: this.socketId, channel_name: channelName }),
    });
    this.send({
      event: "pusher:subscribe",
      data: {
        channel: channelName,
        auth: auth.auth,
        ...(auth.channel_data ? { channel_data: auth.channel_data } : {}),
      },
    });
  }

  private send(frame: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(frame));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer != null) return;
    const delay = Math.min(10_000, 500 * 2 ** Math.min(this.reconnectAttempt++, 5));
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      void this.start().catch(() => this.scheduleReconnect());
    }, delay);
  }
}

let socket: SoketiClient | null = null;
let connecting: Promise<SoketiClient> | null = null;

export async function getChatSocket(): Promise<SoketiClient> {
  if (socket?.connected) return socket;
  if (connecting) return connecting;

  const target = socket ?? new SoketiClient();
  socket = target;
  connecting = target.start().then(() => target).finally(() => {
    connecting = null;
  });
  return connecting;
}

export function currentChatSocket(): SoketiClient | null {
  return socket;
}
