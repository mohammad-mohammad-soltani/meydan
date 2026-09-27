// First-party Meydan service worker entrypoint.
// The cache/offline worker and Web Push worker share one root registration.
importScripts("/sw.js");

const SUMMARY_TAG = "role-notifications";
const MAX_SUMMARY_ENTRIES = 3;
let pushQueue = Promise.resolve();

function pushPayload(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    try {
      return { body: event.data.text() };
    } catch {
      return {};
    }
  }
}

function safeTarget(value) {
  try {
    const target = new URL(typeof value === "string" && value ? value : "/", self.location.origin);
    return target.origin === self.location.origin ? target.href : self.location.origin + "/";
  } catch {
    return self.location.origin + "/";
  }
}

// The transport supplies a human-readable `type` and `message` for every
// notification. Older queued payloads only have title/body, so keep them
// readable during the rollout as well.
function notificationContent(payload) {
  const type = typeof payload.type === "string" && payload.type
    ? payload.type
    : typeof payload.title === "string" && payload.title
      ? payload.title
      : "اعلان جدید";
  const message = typeof payload.message === "string"
    ? payload.message
    : typeof payload.body === "string"
      ? payload.body
      : "";
  return [type, message].filter(Boolean).join("\n");
}

function summaryEntry(payload) {
  return {
    content: notificationContent(payload),
    url: safeTarget(payload.url),
  };
}

async function recentEntries() {
  const notifications = await self.registration.getNotifications({ tag: SUMMARY_TAG });
  const entries = notifications[0]?.data?.entries;
  return Array.isArray(entries)
    ? entries.filter((entry) => entry && typeof entry.content === "string" && entry.content).slice(0, MAX_SUMMARY_ENTRIES)
    : [];
}

async function showPushSummary(payload) {
  const entry = summaryEntry(payload);
  const entries = [entry, ...(await recentEntries())].slice(0, MAX_SUMMARY_ENTRIES);
  const icon = typeof payload.icon === "string" && payload.icon ? payload.icon : "/icon.svg";
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};

  await self.registration.showNotification("نقش من", {
    body: entries.map((item) => item.content).join("\n\n"),
    icon,
    badge: "/icon.svg",
    tag: SUMMARY_TAG,
    renotify: true,
    dir: "rtl",
    lang: "fa",
    data: { ...data, url: entry.url, entries },
  });
}

self.addEventListener("push", (event) => {
  const payload = pushPayload(event);
  pushQueue = pushQueue.then(() => showPushSummary(payload), () => showPushSummary(payload));
  event.waitUntil(pushQueue);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = safeTarget(event.notification?.data?.url);

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (client.url === target && "focus" in client) {
          await client.focus();
          return;
        }
      }

      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin && "navigate" in client && "focus" in client) {
          await client.navigate(target);
          await client.focus();
          return;
        }
      }

      if (self.clients.openWindow) await self.clients.openWindow(target);
    })(),
  );
});
