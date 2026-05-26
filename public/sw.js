self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || "TF College Group", {
      body: data.body || "",
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: data.url || "/athlete" },
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = e.notification.data?.url || "/athlete";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
