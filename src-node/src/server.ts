import { fetchRequestHandler } from "@trpc/server/adapters/fetch"
import { appRouter } from "./api/root"
import { createContext } from "./api/context"
import { config } from "./config"
import { createLogger } from "./utils/logger"

const logger = createLogger("Server")

/**
 * Create HTTP server using Bun.serve
 */
export function createServer() {
  return Bun.serve({
    port: config.PORT,
    hostname: config.HOST,

    async fetch(request: Request) {
      // Handle CORS preflight
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": config.CORS_ORIGIN,
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        })
      }

      const url = new URL(request.url)

      // Log incoming request
      logger.trace("Incoming request", {
        method: request.method,
        path: url.pathname,
      })

      // Health check endpoint
      if (url.pathname === "/health") {
        return Response.json({
          status: "ok",
          timestamp: Date.now(),
          uptime: process.uptime(),
        })
      }

      // tRPC routes
      if (url.pathname.startsWith("/trpc")) {
        try {
          const response = await fetchRequestHandler({
            endpoint: "/trpc",
            req: request,
            router: appRouter,
            createContext,
          })

          // Add CORS headers
          const headers = new Headers(response.headers)
          headers.set("Access-Control-Allow-Origin", config.CORS_ORIGIN)

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          })
        } catch (error) {
          logger.error("tRPC handler error", { error })

          return new Response(
            JSON.stringify({
              error: "Internal Server Error",
              message:
                error instanceof Error ? error.message : "Unknown error",
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": config.CORS_ORIGIN,
              },
            }
          )
        }
      }

      // 404 for unknown routes
      return new Response("Not Found", {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": config.CORS_ORIGIN,
        },
      })
    },

    // Error handler
    error(error) {
      logger.error("Server error", { error })

      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error.message,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    },
  })
}
