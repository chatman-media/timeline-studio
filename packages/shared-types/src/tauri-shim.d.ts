/**
 * Shim declarations for @tauri-apps/api — only needed to satisfy
 * the TypeScript compiler when importing types from tauri-bindings.ts.
 * At runtime, these are only used inside the Tauri app (not in this package).
 */
declare module "@tauri-apps/api/core" {
  export function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T>
  export class Channel<T = unknown> {
    id: number
    onmessage: (response: T) => void
    toJSON(): string
  }
}
declare module "@tauri-apps/api/event" {
  export type EventCallback<T> = (event: { payload: T; id: number; event: string }) => void
  export type UnlistenFn = () => void
  export function listen<T>(event: string, handler: EventCallback<T>): Promise<UnlistenFn>
  export function once<T>(event: string, handler: EventCallback<T>): Promise<UnlistenFn>
  export function emit(event: string, payload?: unknown): Promise<void>
}
declare module "@tauri-apps/api/webviewWindow" {
  import type { UnlistenFn, EventCallback } from "@tauri-apps/api/event"
  export class WebviewWindow {
    static getByLabel(label: string): WebviewWindow | null
    listen<T>(event: string, handler: EventCallback<T>): Promise<UnlistenFn>
    once<T>(event: string, handler: EventCallback<T>): Promise<UnlistenFn>
    emit(event: string, payload?: unknown): Promise<void>
  }
  export function getCurrentWebviewWindow(): WebviewWindow
}
