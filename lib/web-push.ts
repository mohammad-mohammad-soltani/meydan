import { meydanApi } from "@/lib/meydan-api";

export type WebPushConfig = {
  provider: "web-push";
  enabled: boolean;
  vapid_public_key: string;
};

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function sameApplicationServerKey(subscription: PushSubscription, expected: Uint8Array<ArrayBuffer>): boolean {
  const current = subscription.options.applicationServerKey;
  if (!current) return false;
  const bytes = new Uint8Array(current);
  if (bytes.byteLength !== expected.byteLength) return false;
  for (let i = 0; i < bytes.byteLength; i += 1) {
    if (bytes[i] !== expected[i]) return false;
  }
  return true;
}

async function registration(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) throw new Error("Service workers are unavailable.");
  return navigator.serviceWorker.ready;
}

async function saveSubscription(subscription: PushSubscription, background: boolean): Promise<void> {
  const json = subscription.toJSON();
  await meydanApi<{ subscribed: boolean }>("/push/subscriptions", {
    method: "POST",
    suppressAuthRedirect: background,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: json.keys ?? {},
    }),
  });
}

/**
 * Creates/repairs the browser subscription and binds it to the authenticated
 * Meydan user. Permission is only requested from an explicit user gesture.
 */
export async function enableWebPush(config: WebPushConfig, interactive: boolean): Promise<"enabled" | "prompt" | "unsupported" | "denied"> {
  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return "unsupported";
  }

  if (!config.enabled || !config.vapid_public_key) return "unsupported";
  if (Notification.permission === "denied") return "denied";

  if (Notification.permission !== "granted") {
    if (!interactive) return "prompt";
    const permission = await Notification.requestPermission();
    if (permission === "denied") return "denied";
    if (permission !== "granted") return "prompt";
  }

  const reg = await registration();
  const applicationServerKey = decodeBase64Url(config.vapid_public_key);
  let subscription = await reg.pushManager.getSubscription();

  // A VAPID key rotation makes an existing subscription unusable for the new
  // sender. Replace it locally instead of leaving a silently broken endpoint.
  if (subscription && !sameApplicationServerKey(subscription, applicationServerKey)) {
    await subscription.unsubscribe().catch(() => false);
    subscription = null;
  }

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  await saveSubscription(subscription, !interactive);
  return "enabled";
}

/**
 * Invalidates the browser endpoint on signed-out pages. The backend will also
 * prune the now-invalid endpoint on the next attempted delivery (404/410).
 */
export async function clearWebPushSubscription(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false;
  }

  try {
    const reg = await registration();
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) return true;
    return await subscription.unsubscribe();
  } catch {
    return false;
  }
}
