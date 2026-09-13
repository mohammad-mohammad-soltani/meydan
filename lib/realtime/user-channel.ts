"use client";

import {
  USER_CHANNEL_EVENTS,
  userChannelName,
  type RealtimeEventName,
} from "./channels";
import { disconnectRealtime, getRealtimeClient } from "./client";
import { getRealtimeUserId, resetRealtimeConfig } from "./config";

type RealtimeChannel = import("pusher-js").Channel;

export type RealtimeEventHandler = (payload: unknown) => void;
export type UserChannelHandlers = Partial<Record<RealtimeEventName, RealtimeEventHandler>>;

/**
 * Subscription helpers for the authenticated user's private Soketi channel.
 *
 * There is one connection and one `private-user-{id}` channel per browser
 * session. Features register per-event listeners here; the channel itself is
 * shared and survives individual components unmounting. pusher-js re-subscribes
 * automatically after a reconnect, and `onSubscribed` runs again so callers can
 * resynchronize anything they may have missed.
 */

const eventHandlers = new Map<RealtimeEventName, Set<RealtimeEventHandler>>();
const subscribedListeners = new Set<() => void>();

let channel: RealtimeChannel | null = null;
let channelUserId = "";
let channelPromise: Promise<void> | null = null;

function dispatch(event: RealtimeEventName, payload: unknown): void {
  const handlers = eventHandlers.get(event);
  if (!handlers) return;
  for (const handler of handlers) {
    try {
      handler(payload);
    } catch (error) {
      console.error(`[realtime] handler for "${event}" failed`, error);
    }
  }
}

async function ensureUserChannel(): Promise<void> {
  // Connect the shared transport first: realtime must come up even when the
  // identity lookup is temporarily failing, so a later retry can subscribe.
  const client = await getRealtimeClient();
  const userId = await getRealtimeUserId();

  if (!userId) {
    throw new Error("Realtime identity is unavailable; the private channel was not subscribed.");
  }
  if (channel && channelUserId === userId) return;
  if (channelPromise) return channelPromise;

  channelPromise = (async () => {
    // A different account signed in within the same tab: drop the old channel.
    if (channel && channelUserId && channelUserId !== userId) {
      client.unsubscribe(userChannelName(channelUserId));
      channel = null;
    }

    const next = client.subscribe(userChannelName(userId));
    for (const event of USER_CHANNEL_EVENTS) {
      next.bind(event, (payload: unknown) => dispatch(event, payload));
    }
    next.bind("pusher:subscription_succeeded", () => {
      for (const listener of subscribedListeners) listener();
    });
    next.bind("pusher:subscription_error", (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error ?? "subscription failed");
      console.error(`[realtime] subscription to ${userChannelName(userId)} failed: ${message}`);
    });

    channel = next;
    channelUserId = userId;
  })().finally(() => {
    channelPromise = null;
  });

  return channelPromise;
}

/**
 * Binds `events` to the shared private channel and resolves with an unbind
 * function. Multiple features can subscribe at once; each gets its own
 * listeners and removing one never disturbs the others.
 */
export async function subscribeToUserChannel(
  events: UserChannelHandlers,
  options: { onSubscribed?: () => void } = {},
): Promise<() => void> {
  const registered: Array<[RealtimeEventName, RealtimeEventHandler]> = [];

  for (const event of Object.keys(events) as RealtimeEventName[]) {
    const handler = events[event];
    if (!handler) continue;
    const handlers = eventHandlers.get(event) ?? new Set<RealtimeEventHandler>();
    handlers.add(handler);
    eventHandlers.set(event, handlers);
    registered.push([event, handler]);
  }

  const { onSubscribed } = options;
  if (onSubscribed) subscribedListeners.add(onSubscribed);

  const unbind = () => {
    for (const [event, handler] of registered) {
      const handlers = eventHandlers.get(event);
      if (!handlers) continue;
      handlers.delete(handler);
      if (!handlers.size) eventHandlers.delete(event);
    }
    if (onSubscribed) subscribedListeners.delete(onSubscribed);
  };

  try {
    await ensureUserChannel();
  } catch (error) {
    unbind();
    throw error;
  }

  if (onSubscribed && channel?.subscribed) onSubscribed();

  return unbind;
}

/** Drops the shared private channel (logout / account switch). */
export function releaseUserChannel(): void {
  const activeChannel = channel;
  const activeUserId = channelUserId;

  channel = null;
  channelUserId = "";
  channelPromise = null;
  eventHandlers.clear();
  subscribedListeners.clear();

  if (!activeChannel) return;
  void getRealtimeClient()
    .then((client) => client.unsubscribe(activeUserId ? userChannelName(activeUserId) : activeChannel.name))
    .catch(() => undefined);
}

/**
 * Full teardown for a logout: unbinds every listener, drops the private
 * channel, closes the socket and forgets the cached identity so the next
 * session starts clean.
 */
export function closeRealtimeSession(): void {
  releaseUserChannel();
  disconnectRealtime();
  resetRealtimeConfig();
}
