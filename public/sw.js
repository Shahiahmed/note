/*
 * Service worker: нужен, чтобы приложение можно было установить на телефон.
 *
 * Кеширует только неизменяемую статику — код страниц и иконки. Ни ответы API,
 * ни HTML сюда не попадают: это финансовые данные за паролем, и они не должны
 * оставаться на устройстве после выхода из аккаунта. Поэтому офлайн-режима нет,
 * без сети приложение честно не откроется.
 */
const CACHE = "static-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStatic =
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
  if (!isStatic) return; // всё остальное идёт мимо кеша, прямо в сеть

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(request);
      if (hit) return hit;

      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })()
  );
});
