import { meydanApi } from "@/lib/meydan-api";

/** Pusher-compatible private-channel authorization payload. */
export type RealtimeChannelAuthorization = {
  auth: string;
  channel_data?: string;
  shared_secret?: string;
};

type ApiChannelAuthorization = RealtimeChannelAuthorization & { auth?: string };

/**
 * Pusher-compatible private-channel authorization.
 *
 * Goes through the existing Meydan API layer so the WordPress session cookie
 * (`/api/meydan` proxy) is the only credential involved. The backend signs
 * `socket_id:channel_name` with APP_SECRET and returns `{ auth, channel_data? }`
 * — the secret never reaches the browser.
 */
export async function authorizeRealtimeChannel(
  socketId: string,
  channelName: string,
): Promise<RealtimeChannelAuthorization> {
  if (!socketId || !channelName) {
    throw new Error("Realtime authorization requires both socket_id and channel_name.");
  }

  const result = await meydanApi<ApiChannelAuthorization>("/chat/realtime/auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
  });

  if (!result?.auth) {
    throw new Error("Realtime authorization response is missing the auth signature.");
  }

  return {
    auth: result.auth,
    channel_data: result.channel_data,
    shared_secret: result.shared_secret,
  };
}
