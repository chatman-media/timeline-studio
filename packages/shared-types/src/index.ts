/**
 * @timeline/shared-types
 *
 * Shared TypeScript types for Timeline Studio (#104).
 *
 * Two namespaces:
 *
 * - **schema** — ProjectSchema types from Rust `ts-schema` crate via schemars JSON Schema.
 *   Use these for: headless rendering input, CLI tools, agent payloads.
 *
 * - **state** — Runtime state types from Rust src-tauri via specta.
 *   Use these for: UI state snapshots, agent state consumption, external dashboards.
 *
 * @example
 * ```ts
 * // Import schema types
 * import type { ProjectSchema, Timeline, Track } from "@timeline/shared-types"
 *
 * // Import state types
 * import type { ProjectState, MediaItem } from "@timeline/shared-types"
 * ```
 *
 * @example
 * ```ts
 * // Import from sub-paths for tree-shaking
 * import type { ProjectSchema } from "@timeline/shared-types/schema"
 * import type { ProjectState } from "@timeline/shared-types/state"
 * ```
 */

// Re-export everything from both namespaces.
// Conflicting names are resolved by aliasing (e.g. SchemaResolution vs StateResolution).
export * from "./schema"
export * from "./state"

// Version of the shared-types contract (matches project version)
export const SHARED_TYPES_VERSION = "1.0.0"
