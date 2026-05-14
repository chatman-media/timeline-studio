/**
 * tRPC Client for Node.js Backend
 *
 * Type-safe client for communicating with the Node.js media processing backend
 */

import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"

// AppRouter type imported at runtime from src-node; using any here avoids
// pulling Bun-specific types into the frontend TypeScript compilation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AppRouter = any

const getBackendUrl = (): string => {
  // Check environment variable first
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_NODE_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_NODE_BACKEND_URL
  }

  // Fallback to default
  return "http://localhost:3001"
}

/**
 * tRPC client for Node.js backend
 *
 * Usage:
 * ```typescript
 * // Check health
 * const health = await nodeBackendClient.health.check.query()
 *
 * // Get metadata
 * const metadata = await nodeBackendClient.media.getMetadata.query({
 *   filePath: "/path/to/video.mp4"
 * })
 *
 * // Scan folder with thumbnails
 * const files = await nodeBackendClient.media.scanWithThumbnails.mutate({
 *   folderPath: "/path/to/folder",
 *   width: 320,
 *   height: 180
 * })
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeBackendClient: any = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBackendUrl()}/trpc`,
      headers() {
        return {}
      },
    }),
  ],
})

export type NodeBackendClient = typeof nodeBackendClient
