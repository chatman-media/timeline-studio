import { router, protectedProcedure } from "../trpc"

/**
 * Gateway auth router (#329).
 *
 * Endpoints behind {@link protectedProcedure} require a valid Telegram Mini App
 * `initData`. `me` echoes the verified identity — the smallest proof that the
 * gateway authenticates the same userId/chatId the bot uses.
 */
export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ({
    userId: ctx.auth.userId,
    chatId: ctx.auth.chatId ?? null,
    username: ctx.auth.user?.username ?? null,
  })),
})
