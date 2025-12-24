/**
 * tRPC Client for Node.js Backend
 *
 * Type-safe client for communicating with the Node.js media processing backend
 */

import { createTRPCProxyClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "../../../src-node/src/api/root"

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
export const nodeBackendClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${getBackendUrl()}/trpc`,
      // Optional: add headers
      headers() {
        return {
          // Add auth headers if needed
        }
      },
    }),
  ],
})

// Export type for use in React hooks
export type NodeBackendClient = typeof nodeBackendClient
