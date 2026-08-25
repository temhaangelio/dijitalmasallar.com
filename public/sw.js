/*
 * diji.news service worker.
 *
 * It exists for two things: web push, and making the site installable. It deliberately caches
 * nothing — a news feed that serves yesterday's notes from a cache is worse than one that says it
 * needs the network — so the fetch handler passes every request straight through.
 */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

/*
 * A pass-through handler, kept on purpose: browsers look for a fetch listener before offering the
 * install prompt, and this one adds no caching layer of its own.
 */
self.addEventListener("fetch", () => {});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "diji.news";
  const options = {
    body: payload.body || "",
    icon: "/icon-192.png",
    badge: "/badge-96.png",
    lang: payload.lang || "en",
    // One note replaces the previous one rather than stacking a column of them, and `renotify`
    // makes the replacement still buzz.
    tag: payload.tag || "diji-news-note",
    renotify: true,
    data: { url: payload.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    // An open tab is reused — focused, then pointed at the note — so tapping notifications does not
    // leave a trail of windows behind.
    const already = windows.find((client) => client.url === target);
    if (already) return already.focus();
    const open = windows.find((client) => "focus" in client);
    if (open) {
      await open.focus();
      return "navigate" in open ? open.navigate(target) : undefined;
    }
    return self.clients.openWindow(target);
  })());
});
