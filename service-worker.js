const CACHE_NAME = "xiaoshouji-pwa-v19";
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
  if (url.pathname.endsWith("/service-worker.js")) return false;
  if (url.pathname.endsWith("/") || url.pathname.endsWith(".html")) return true;
  return /\.(js|css|webmanifest)$/i.test(url.pathname);
}

function isNavigationRequest(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function fetchNoStore(request) {
  return fetch(new Request(request, { cache: "no-store" }));
}

function putInCache(request, response) {
  if (!response || response.status !== 200) return;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
}

function networkFirst(request) {
  return fetchNoStore(request)
    .then((response) => {
      putInCache(request, response);
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => cached || caches.match("./index.html"))
    );
}

function networkOnly(request) {
  return fetchNoStore(request).catch(() =>
    caches.match(request).then((cached) => cached || caches.match("./index.html"))
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(CORE_ASSETS.map((asset) => cache.add(asset)))
    )
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
      ).then(() => self.clients.claim())
    )
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/service-worker.js")) {
    event.respondWith(fetchNoStore(event.request));
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(networkOnly(event.request));
    return;
  }

  if (isAppShellRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
  }
});
