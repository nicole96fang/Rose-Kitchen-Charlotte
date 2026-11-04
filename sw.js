const CACHE_PREFIX = "my-kitchen-rose-";
const CACHE_NAME = CACHE_PREFIX + "pwa-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./src/styles.css?v=9",
  "./src/main.js?v=10",
  "./src/app.js?v=9",
  "./src/store.js?v=9",
  "./assets/app-background.jpg",
  "./assets/avatar-profile.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key =>
            key.startsWith(CACHE_PREFIX) &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // 不缓存其他网站资源，也不干涉跨域字体/CDN。
  if (url.origin !== self.location.origin) return;

  // 页面：网络优先，断网时才显示已缓存首页。
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put("./index.html", copy)
            );
          }
          return response;
        })
        .catch(async () =>
          (await caches.match("./index.html")) ||
          (await caches.match("./"))
        )
    );
    return;
  }

  // 同源静态资源：缓存优先；首次访问时联网并写入缓存。
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => {
          if (
            response &&
            response.ok &&
            (response.type === "basic" || response.type === "default")
          ) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(request, copy)
            );
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
