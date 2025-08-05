const CACHE_NAME = "timeline-studio-promo-v2"
const urlsToCache = [
  "/",
  "/index.html",
  "/favicon/favicon.ico",
  "/favicon/favicon-96x96.png",
  "/favicon/apple-touch-icon.png",
  "/fav.svg",
]

// Определяем типы ресурсов для разных стратегий кеширования
const isStaticAsset = (url) => {
  return /\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2|ttf|otf)$/i.test(url)
}

const isAPICall = (url) => {
  return url.includes("/api/") || url.includes("github.com")
}

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

// Стратегия кэширования
self.addEventListener("fetch", (event) => {
  // Пропускаем не-GET запросы
  if (event.request.method !== "GET") return

  const url = event.request.url

  // Для API запросов - всегда сеть
  if (isAPICall(url)) {
    event.respondWith(fetch(event.request))
    return
  }

  // Для статических ресурсов - кэш с откатом на сеть
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response
        }
        return fetch(event.request).then((response) => {
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
      }),
    )
    return
  }

  // Для HTML и остальных - сеть с откатом на кэш
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Проверяем валидность ответа
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }
        // Для HTML не кэшируем
        if (event.request.headers.get("accept")?.includes("text/html")) {
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
