/**
 * Single source of truth for the public Soketi (Pusher-compatible) endpoint.
 *
 * The browser connects to `wss://naghshman.ir/socket/app/{APP_KEY}` through the
 * reverse proxy in front of Soketi. Chat, notifications and every future
 * realtime feature share this one endpoint — never add a second host or an
 * environment-specific socket URL here. APP_SECRET must never live in frontend
 * code; private channels are authorized server-side through `/chat/realtime/auth`.
 */
export const SOKETI_CONFIG = {
  host: "naghshman.ir",
  port: 443,
  secure: true,
  /** Reverse-proxy prefix in front of Soketi's canonical `/app/...` path. */
  path: "/socket",
  appKey: "naghsh-b5a7e6394b1c637cfee7eb2d7762a156",
} as const;

/**
 * Public WebSocket URL for the unified realtime endpoint.
 *
 * Exported for diagnostics/health checks; the live client is built by
 * `lib/realtime/client.ts`, which feeds the same values into pusher-js.
 */
export function getSoketiUrl() {
  const { host, path, appKey } = SOKETI_CONFIG;

  return `wss://${host}${path}/app/${appKey}?protocol=7&client=js&version=8.4.0&flash=false`;
}
