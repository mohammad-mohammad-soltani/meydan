/**
 * Single source of truth for the public Soketi (Pusher-compatible) endpoint.
 *
 * The browser connects directly to the dedicated socket subdomain.
 */
export const SOKETI_CONFIG = {
  host: "socket.naghshman.ir",
  port: 443,
  secure: true,
  path: "",
  appKey: "naghsh-b5a7e6394b1c637cfee7eb2d7762a156",
} as const;

/**
 * Public WebSocket URL for the unified realtime endpoint.
 */
export function getSoketiUrl() {
  const { host, appKey } = SOKETI_CONFIG;

  return `wss://${host}/app/${appKey}?protocol=7&client=js&version=8.6.0&flash=false`;
}
