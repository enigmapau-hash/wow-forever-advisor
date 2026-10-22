"use strict";

// Incrementar la versión al publicar cambios en los archivos de la aplicación.
const CACHE_PREFIX = `wow-forever-advisor:${self.registration.scope}:`;
const CACHE_NAME = `${CACHE_PREFIX}v3`;
const APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./data/race-advisor.json",
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

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
