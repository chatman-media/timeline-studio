import { vi } from "vitest"

export function setupDOMMocks() {
  // ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))

  // matchMedia
  global.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    dispatchEvent: vi.fn(),
    onchange: null,
  }))

  // localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString()
      },
      removeItem: (key: string) => {
        store = Object.fromEntries(Object.entries(store).filter(([k]) => k !== key))
      },
      clear: () => {
        store = {}
      },
    }
  })()

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
  })

  // navigator.clipboard
  Object.defineProperty(navigator, "clipboard", {
    value: {
      writeText: vi.fn(),
      readText: vi.fn(),
    },
    writable: true,
    configurable: true,
  })

  // URL object methods
  global.URL.createObjectURL = vi.fn().mockImplementation(() => {
    return `blob:mock-url-${Math.random().toString(36).substring(2, 11)}`
  })

  global.URL.revokeObjectURL = vi.fn()
}

// Helper to simulate media query changes
export function setMediaQuery(query: string, matches: boolean) {
  ;(global.matchMedia as any).mockImplementation((q: string) => ({
    matches: q === query ? matches : false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    onchange: null,
  }))
}

// Helper to simulate window resize
export function simulateResize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  })

  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  })

  window.dispatchEvent(new Event("resize"))
}

// Helper to trigger ResizeObserver callbacks
export function triggerResizeObserver(entries: any[] = []) {
  const observers = (global.ResizeObserver as any).mock.instances
  observers.forEach((observer: any) => {
    const callback = (global.ResizeObserver as any).mock.calls.find((call: any[]) => call[0] === observer)?.[0]
    if (callback) {
      callback(entries)
    }
  })
}

// Helper to trigger IntersectionObserver callbacks
export function triggerIntersectionObserver(entries: any[] = []) {
  const observers = (global.IntersectionObserver as any).mock.instances
  observers.forEach((observer: any) => {
    const callback = (global.IntersectionObserver as any).mock.calls.find((call: any[]) => call[0] === observer)?.[0]
    if (callback) {
      callback(entries)
    }
  })
}

// Helper to reset DOM mocks
export function resetDOMMocks() {
  vi.clearAllMocks()
  setupDOMMocks()
}
