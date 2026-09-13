import { meydanApi } from "@/lib/meydan-api";
import { SOKETI_CONFIG } from "./soketi";

/**
 * Realtime configuration as answered by `GET /chat/realtime/config`.
 *
 * The Soketi host/path/app key stay owned by `lib/realtime/soketi.ts`; the
 * endpoint is consulted for the authenticated `user_id` (the private channel
 * every feature subscribes to) and is cross-checked against the central config.
 */
export type RealtimeConfig = {
  userId: string;
  appKey: string;
  host: string;
  port: number | null;
  secure: boolean;
  path: string;
  socketUrl?: string;
};

type ApiRealtimeConfig = {
  user_id?: string | number | null;
  app_key?: string | null;
  host?: string | null;
  port?: string | number | null;
  scheme?: string | null;
  path?: string | null;
  ws_path?: string | null;
  socket_url?: string | null;
  ws_url?: string | null;
};

let cached: RealtimeConfig | null = null;
let pending: Promise<RealtimeConfig> | null = null;

function toPort(value: string | number | null | undefined): number | null {
  const port = Number(value);
  return Number.isFinite(port) && port > 0 ? port : null;
}

function normalize(raw: ApiRealtimeConfig): RealtimeConfig {
  const scheme = String(raw.scheme || (SOKETI_CONFIG.secure ? "https" : "http"));

  return {
    userId: String(raw.user_id ?? ""),
    appKey: String(raw.app_key || SOKETI_CONFIG.appKey),
    host: String(raw.host || SOKETI_CONFIG.host),
    port: toPort(raw.port) ?? SOKETI_CONFIG.port,
    secure: scheme === "https" || scheme === "wss",
    path: String(raw.path || raw.ws_path || SOKETI_CONFIG.path),
    socketUrl: raw.socket_url || raw.ws_url || undefined,
  };
}

/**
 * Reads (and caches) the realtime configuration for the signed-in user.
 *
 * Rejects when the request fails so callers can decide whether realtime is
 * optional — the realtime client treats it as optional and never blocks chat
 * REST data loading on it.
 */
export async function getRealtimeConfig(): Promise<RealtimeConfig> {
  if (cached) return cached;

  if (!pending) {
    pending = meydanApi<ApiRealtimeConfig>("/chat/realtime/config")
      .then((raw) => {
        const config = normalize(raw);
        cached = config;
        return config;
      })
      .finally(() => {
        pending = null;
      });
  }

  return pending;
}

/** Current user id for private channels; `""` when realtime config is unavailable. */
export async function getRealtimeUserId(): Promise<string> {
  try {
    return (await getRealtimeConfig()).userId;
  } catch {
    return "";
  }
}

/** Drops the cached identity, e.g. after a logout or account switch. */
export function resetRealtimeConfig(): void {
  cached = null;
  pending = null;
}
