import { initTRPC, TRPCError } from "@trpc/server"
import { verifyTelegramInitData } from "@timeline-studio/adapters/node"
import type { Context } from "./context"

/**
 * Initialization of tRPC backend
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape }) {
    return shape
  },
})

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure

/**
 * Telegram Mini App gateway auth (#329). Verifies the request's `initData`
 * against the bot token and augments the context with the resolved
 * `auth.userId` / `auth.chatId`. Rejects unauthenticated requests with `401`.
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.botToken) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Gateway auth is not configured (TELEGRAM_BOT_TOKEN missing)",
    })
  }
  if (!ctx.initData) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing Telegram initData" })
  }

  const verification = verifyTelegramInitData(
    ctx.initData,
    ctx.botToken,
    ctx.initDataMaxAge ? { maxAgeSeconds: ctx.initDataMaxAge } : {},
  )
  if (!verification.valid) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: `Invalid initData: ${verification.reason}` })
  }

  return next({
    ctx: {
      auth: {
        userId: verification.data.userId,
        chatId: verification.data.chatId,
        user: verification.data.user,
      },
    },
  })
})
