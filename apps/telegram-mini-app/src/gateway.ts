/**
 * Type-safe API client to the bot-first gateway (#330).
 *
 * Reuses the gateway's `AppRouter` type for end-to-end type safety, and sends
 * the Telegram `initData` as `Authorization: tma <initData>` on every request —
 * the header the gateway's protectedProcedure verifies.
 *
 * Queries/mutations only for this slice; the `render.events` SSE subscription is
 * a follow-up (it needs EventSource-friendly auth).
 */

import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { AppRouter } from "@gateway/api/root"
import { getInitData } from "./telegram"

const GATEWAY_URL = (import.meta.env.VITE_GATEWAY_URL as string | undefined) ?? "/trpc"

export const gateway = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: GATEWAY_URL,
      headers() {
        const initData = getInitData()
        return initData ? { authorization: `tma ${initData}` } : {}
      },
    }),
  ],
})
