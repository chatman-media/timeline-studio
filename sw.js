const CACHE_NAME = "timeline-studio-promo-v1"
const urlsToCache = [
  "/",
  "/index.html",
  "/favicon/favicon.ico",
  "/favicon/favicon-96x96.png",
  "/favicon/apple-touch-icon.png",
]

// Установка Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()),
  )
})

// Активация Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Стратегия кэширования: сеть с откатом на кэш
self.addEventListener("fetch", (event) => {
  // Пропускаем не-GET запросы
  if (event.request.method !== "GET") return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Проверяем валидность ответа
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        // Клонируем ответ для кэша
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
      .catch(() => {
        // Если сеть недоступна, пробуем кэш
        return caches.match(event.request)
      }),
  )
})
