"use strict";

importScripts("./icons/icon-map.js");
const ICON_URLS = new Set(self.WOW_ICON_URLS);

// Incrementar la versión al publicar cambios en los archivos de la aplicación.
const CACHE_PREFIX = `wow-forever-advisor:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v13`;
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./icons/icon-map.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./data/race-advisor.json",
  "./data/profession-advisor.json",
  "./data/talent-advisor-warrior.json",
  "./data/racials.json",
  "./data/workbook-context.json",
  "./data/export-report.json",
].map((file) => new URL(file, self.registration.scope).href);

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_FILES.map((url) => new Request(url, { cache: "reload" })));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

// Guardar en la caché privada del dispositivo los iconos propiedad de Blizzard servidos por Wowhead,
// sin copiar sus archivos al repositorio. Se toleran respuestas opacas no-CORS.
async function cacheIcon(request) {
  const cache = await caches.open(CACHE_NAME);
  const saved = await cache.match(request);
  if (saved) return saved;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    await cache.put(request, response.clone());
  }
  return response;
}

// Completa la colección en segundo plano tras la primera visita online.
// Fallos de red individuales no impiden usar la PWA ni activar el SW.
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_WOW_ICONS") return;
  event.waitUntil((async () => {
    const icons = [...ICON_URLS];
    for (let i = 0; i < icons.length; i += 4) {
      await Promise.allSettled(icons.slice(i, i + 4).map((url) =>
        cacheIcon(new Request(url, { mode: "no-cors" }))
      ));
    }
  })());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (ICON_URLS.has(event.request.url)) {
    event.respondWith(cacheIcon(event.request).catch(() => Response.error()));
    return;
  }
  const url = new URL(event.request.url);
  url.search = "";
  url.hash = "";
  if (!APP_FILES.includes(url.href)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // La red tiene prioridad para no retener versiones antiguas al volver online.
      const response = await fetch(event.request, { cache: "no-cache" });
      if (response.ok) await cache.put(url.href, response.clone());
      return response;
    } catch (error) {
      const cached = await cache.match(url.href);
      if (cached) return cached;
      throw error;
    }
  })());
});
