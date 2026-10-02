/**
 * Channel and event names of the unified Soketi transport.
 *
 * These strings are a backend contract: the WordPress plugin authorizes
 * `private-user-{id}` and publishes exactly these event names
 * (`SoketiRealtime` / `ChatController`). Never invent an event name on the
 * client — change the backend first and update this list with it.
 */

/** Every authenticated user listens on their own private channel. */
export const USER_CHANNEL_PREFIX = "private-user-";

export function userChannelName(userId: string | number): string {
  return `${USER_CHANNEL_PREFIX}${String(userId)}`;
}

/** Events the Meydan backend publishes to `private-user-{id}`. */
export const USER_CHANNEL_EVENTS = [
  "conversation:updated",
  "message:created",
  "message:updated",
  "message:deleted",
  "message:reaction",
  "receipt:read",
  "typing:changed",
  "notification:created",
  "notification:updated",
  "presence:changed",
  "work:message:created",
  "work:message:updated",
  "work:message:deleted",
  "work:updated",
  "work:read",
] as const;

export type RealtimeEventName = (typeof USER_CHANNEL_EVENTS)[number];
