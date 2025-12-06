/**
 * Mock implementation of @tauri-apps/plugin-notification
 */
import { vi } from "vitest"

// Mock permission state
let permissionGranted = true

export const sendNotification = vi.fn().mockImplementation(async (options: any) => {
  // Silent mock - don't actually show notifications during tests
  console.log("[Mock] Notification:", options)
  return Promise.resolve()
})

export const isPermissionGranted = vi.fn().mockImplementation(async () => {
  return Promise.resolve(permissionGranted)
})

export const requestPermission = vi.fn().mockImplementation(async () => {
  permissionGranted = true
  return Promise.resolve("granted")
})

// Helper to reset mocks
export function resetNotificationMocks() {
  sendNotification.mockClear()
  isPermissionGranted.mockClear()
  requestPermission.mockClear()
  permissionGranted = true
}

// Helper to simulate permission denied
export function setPermissionDenied() {
  permissionGranted = false
}

// Helper to simulate permission granted
export function setPermissionGranted() {
  permissionGranted = true
}
