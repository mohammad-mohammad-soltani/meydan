// First-party Meydan service worker entrypoint.
// The cache/offline worker and Web Push worker share one root registration.
importScripts("/sw.js");

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

self.addEventListener("push", (event) => {
  const payload = pushPayload(event);
  const title = typeof payload.title === "string" && payload.title ? payload.title : "میدان";
  const body = typeof payload.body === "string" ? payload.body : "اعلان جدیدی دارید.";
  const icon = typeof payload.icon === "string" && payload.icon ? payload.icon : "/icon.svg";
  const tag = typeof payload.tag === "string" && payload.tag ? payload.tag : undefined;
  const url = safeTarget(payload.url);
  const data = payload.data && typeof payload.data === "object" ? payload.data : {};

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/icon.svg",
      tag,
      renotify: Boolean(tag),
      dir: "rtl",
      lang: "fa",
      data: { ...data, url },
    }),
  );
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
