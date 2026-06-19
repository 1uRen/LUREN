const CACHE_NAME = "xiaoshouji-pwa-v133";

const PRECACHE_URLS = [
  "./index.html",
  "./manifest.webmanifest",
  "./pwa-icon-192.png",
  "./pwa-icon-512.png",
  "./service-worker.js"
];

function isAppShellRequest(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.endsWith("/service-worker.js")) return false;
  if (url.pathname.endsWith("/") || url.pathname.endsWith(".html")) return true;
  return /\.(js|css|webmanifest|svg|png|webp|ico)$/i.test(url.pathname);
}

function isNavigationRequest(request) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

function putInCache(request, response) {
  if (!response || response.status !== 200) return;
  const copy = response.clone();
  caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
}

function cacheFirst(request) {
  return caches.match(request).then((cached) => {
    if (cached) {
      fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => {});
      return cached;
    }
    return fetch(request)
      .then((response) => {
        putInCache(request, response);
        return response;
      })
      .catch(() => caches.match("./index.html"));
  });
}

function navigationHandler(request) {
  return caches.match(request).then((cached) => {
    const networkFetch = fetch(request)
      .then((response) => {
        putInCache(request, response);
        return response;
      })
      .catch(() => null);

    if (cached) {
      networkFetch.catch(() => {});
      return cached;
    }

    return networkFetch.then(
      (response) => response || caches.match("./index.html") || caches.match("./")
    );
  });
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
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
    event.respondWith(fetch(event.request));
    return;
  }

  if (isNavigationRequest(event.request)) {
    event.respondWith(navigationHandler(event.request));
    return;
  }

  if (isAppShellRequest(event.request)) {
    event.respondWith(cacheFirst(event.request));
  }
});
