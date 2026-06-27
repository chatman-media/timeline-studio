/**
 * Ambient shims for Bun APIs (#330).
 *
 * The Mini App consumes the gateway's `AppRouter` TYPE for end-to-end safety.
 * That type transitively references gateway source that imports Bun runtime APIs
 * (`bun:sqlite`, the `bun` module, the `Bun` global). The Mini App never runs
 * that code — it only needs the types to resolve — so these loose declarations
 * let the browser-targeted tsconfig type-check the router without pulling in
 * `@types/bun` (which would wrongly imply a Bun runtime in the browser bundle).
 */

declare module "bun:sqlite" {
  // biome-ignore lint/suspicious/noExplicitAny: type-only shim for an unused runtime API.
  export class Database {
    constructor(filename?: string, options?: unknown)
    query(sql: string): any
    run(sql: string, ...params: unknown[]): any
    exec(sql: string): void
    close(): void
  }
}

declare module "bun" {
  export const env: Record<string, string | undefined>
  // biome-ignore lint/suspicious/noExplicitAny: type-only shim for an unused runtime API.
  export const $: any
}

// biome-ignore lint/suspicious/noExplicitAny: type-only shim for the Bun global.
declare const Bun: any
