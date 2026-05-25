const CACHE_NAME = "xiaoshouji-pwa-v16";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./device-runtime.js",
  "./viewport.css",
  "./manifest.webmanifest",
  "./pwa-icon.svg",
  "./chat.js",
  "./api.js",
  "./storage.js",
  "./setting.js",
  "./chat-base.css",
  "./chat-components.css",
  "./chat-search.css",
  "./chat-theme.css",
  "./chat-ai.js",
  "./chat-ai-send.js",
  "./chat-chat-list.js",
  "./chat-contacts.js",
  "./chat-core.js",
  "./chat-forward.js",
  "./chat-friends.js",
  "./chat-messages.js",
  "./chat-plus.js",
  "./chat-profile.js",
  "./chat-render-chat.js",
  "./chat-render-contacts.js",
  "./chat-render-core.js",
  "./chat-render-modals.js",
  "./chat-render-profile.js",
  "./chat-render-search.js",
  "./chat-render-sidebar.js",
  "./chat-render-wallet.js",
  "./chat-search.js",
  "./chat-selection.js",
  "./chat-settings.js",
  "./chat-sidebar.js",
  "./chat-state.js",
  "./chat-stickers.js",
  "./chat-utils.js",
  "./chat-wallet.js",
  "./split-chat.js",
  "./split-chat-render.js"
];

function isAppShellRequest(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.endsWith("/") || url.pathname.endsWith(".html")) return true;
  return /\.(js|css|webmanifest)$/i.test(url.pathname);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isAppShellRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => cached || caches.match("./index.html"))
    );
}
