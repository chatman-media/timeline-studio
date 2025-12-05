/**
 * Global Polyfills and Shims
 *
 * Выполняется при инициализации приложения.
 * Добавляет недостающие API и исправления для старых браузеров.
 *
 * НЕ импортируйте этот файл вручную!
 * Подключается автоматически через layout или entry point.
 */

// Example: ResizeObserver polyfill check
if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  console.warn("[Polyfills] ResizeObserver not available - some features may not work")
  // В production здесь можно динамически загружать полифилл:
  // import('resize-observer-polyfill')
}

// Example: requestIdleCallback polyfill
if (typeof window !== "undefined" && !("requestIdleCallback" in window)) {
  ;(window as any).requestIdleCallback = (callback: IdleRequestCallback) => {
    const start = Date.now()
    return setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      })
    }, 1)
  }
  ;(window as any).cancelIdleCallback = (id: number) => {
    clearTimeout(id)
  }
}

// Исправление для Math.imul в старых браузерах
if (!Math.imul) {
  Math.imul = (a, b) => {
    const ah = (a >>> 16) & 0xffff
    const al = a & 0xffff
    const bh = (b >>> 16) & 0xffff
    const bl = b & 0xffff
    return (al * bl + (((ah * bl + al * bh) << 16) >>> 0)) | 0
  }
}

export {}
