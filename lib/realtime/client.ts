"use client";

import { authorizeRealtimeChannel } from "./auth";
import { SOKETI_CONFIG } from "./soketi";

type PusherInstance = import("pusher-js").default;
type PusherConstructor = typeof import("pusher-js").default;

/**
 * One Pusher/Soketi connection per browser session, shared by every realtime
 * feature (chat today; notifications, feed and invitations next).
 *
 * pusher-js is loaded lazily so the module stays safe to evaluate during SSR
 * and adds nothing to the server bundle. Channel subscriptions live in
 * `lib/realtime/user-channel.ts`; this file only owns the transport.
 */

export type RealtimeConnectionState =
  | "initialized"
  | "connecting"
  | "connected"
  | "unavailable"
  | "failed"
  | "disconnected"
  | "disconnecting";

type StateListener = (state: RealtimeConnectionState) => void;

let client: PusherInstance | null = null;
let clientPromise: Promise<PusherInstance> | null = null;
let connectionState: RealtimeConnectionState = "initialized";
const stateListeners = new Set<StateListener>();

function setConnectionState(next: RealtimeConnectionState): void {
  if (next === connectionState) return;
  connectionState = next;
  for (const listener of stateListeners) listener(next);
}

export function isRealtimeConnected(): boolean {
  return connectionState === "connected";
}

/**
 * Subscribes to transport state changes. Every reconnect emits `connected`
 * again, which features use to resynchronize data they may have missed.
 */
export function subscribeToRealtimeConnection(listener: StateListener): () => void {
  stateListeners.add(listener);
  return () => {
    stateListeners.delete(listener);
  };
}

async function loadPusher(): Promise<PusherConstructor> {
  const pusherModule = await import("pusher-js");
  return pusherModule.default;
}

/**
 * Lazily creates (once) and returns the shared Soketi client.
 *
 * Connection properties come exclusively from `lib/realtime/soketi.ts`, which
 * resolves to `wss://naghshman.ir/socket/app/{APP_KEY}`. Private channels are
 * authorized through `POST /chat/realtime/auth` via the Meydan API layer, so
 * the app secret never exists in the browser.
 */
export async function getRealtimeClient(): Promise<PusherInstance> {
  if (typeof window === "undefined") {
    throw new Error("The Meydan realtime client is browser-only.");
  }
  if (client) return client;
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const Pusher = await loadPusher();
    const instance = new Pusher(SOKETI_CONFIG.appKey, {
      // `cluster` is required by pusher-js but unused: `wsHost` is authoritative.
      cluster: SOKETI_CONFIG.host,
      wsHost: SOKETI_CONFIG.host,
      wsPort: SOKETI_CONFIG.port,
      wssPort: SOKETI_CONFIG.port,
      wsPath: SOKETI_CONFIG.path,
      forceTLS: SOKETI_CONFIG.secure,
      // WebSocket transports only: never fall back to Pusher's hosted
      // sockjs/xhr endpoints.
      enabledTransports: ["ws", "wss"],
      enableStats: false,
      channelAuthorization: {
        customHandler: ({ socketId, channelName }, callback) => {
          void authorizeRealtimeChannel(socketId, channelName)
            .then((data) => callback(null, data))
            .catch((error: unknown) => {
              callback(error instanceof Error ? error : new Error(String(error)), null);
            });
        },
      },
    });

    instance.connection.bind(
      "state_change",
      (states: { previous: RealtimeConnectionState; current: RealtimeConnectionState }) => {
        setConnectionState(states.current);
      },
    );
    setConnectionState(instance.connection.state as RealtimeConnectionState);

    client = instance;
    return instance;
  })().catch((error: unknown) => {
    clientPromise = null;
    throw error;
  });

  return clientPromise;
}

/** Tears the shared connection down (logout, tests). */
export function disconnectRealtime(): void {
  client?.disconnect();
  client = null;
  clientPromise = null;
  setConnectionState("disconnected");
}
