/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the gateway tRPC endpoint (defaults to `/trpc`). */
  readonly VITE_GATEWAY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
