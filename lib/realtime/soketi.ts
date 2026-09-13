export const SOKETI_CONFIG = {
  host: "naghshman.ir",
  secure: true,
  path: "/socket",
  appKey: "naghsh-b5a7e6394b1c637cfee7eb2d7762a156",
} as const;

/**
 * Single realtime endpoint for all realtime features.
 * Chat, notifications and future realtime modules must use this endpoint.
 */
export function getSoketiUrl() {
  const { host, path, appKey } = SOKETI_CONFIG;

  return `wss://${host}${path}/app/${appKey}?protocol=7&client=js&version=8.4.0&flash=false`;
}
