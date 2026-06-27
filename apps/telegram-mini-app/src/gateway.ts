/**
 * Type-safe API client to the bot-first gateway (#330).
 *
 * Reuses the gateway's `AppRouter` type for end-to-end type safety. Queries and
 * mutations send the Telegram `initData` as `Authorization: tma <initData>`.
 * Subscriptions (e.g. `render.events`) go over SSE via httpSubscriptionLink —
 * EventSource can't set headers, so initData is passed as the `initData` query
 * param, which the gateway also accepts.
 */

import { createTRPCClient, httpBatchLink, httpSubscriptionLink, splitLink } from "@trpc/client"
import type { AppRouter } from "@gateway/api/root"
import { getInitData } from "./telegram"

const GATEWAY_URL = (import.meta.env.VITE_GATEWAY_URL as string | undefined) ?? "/trpc"

/** SSE URL carrying initData in the query string (EventSource has no headers). */
function subscriptionUrl(): string {
  const initData = getInitData()
  if (!initData) return GATEWAY_URL
  const separator = GATEWAY_URL.includes("?") ? "&" : "?"
  return `${GATEWAY_URL}${separator}initData=${encodeURIComponent(initData)}`
}

export const gateway = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: httpSubscriptionLink({ url: subscriptionUrl }),
      false: httpBatchLink({
        url: GATEWAY_URL,
        headers() {
          const initData = getInitData()
          return initData ? { authorization: `tma ${initData}` } : {}
        },
      }),
    }),
  ],
})
