import { z } from "zod"
import { TRPCError } from "@trpc/server"
import type { BotEditSession, BotEditSessionStore } from "@timeline-studio/core"
import { router, protectedProcedure } from "../trpc"

/**
 * Gateway session router (#329).
 *
 * Read-only view over the bot's shared edit-session store: the Mini App lists and
 * inspects the same review sessions the bot writes. Every endpoint is scoped to
 * the authenticated `userId` — a caller can only see their own sessions.
 */

/** Client-safe projection — internal ProjectSchema/artifacts are not exposed. */
export function toSessionSummary(session: BotEditSession) {
  return {
    id: session.id,
    status: session.status,
    goal: session.goal ?? null,
    revisionCount: session.revisionCounter,
    approvedRevisionId: session.approvedRevisionId ?? null,
    approvedAt: session.approvedAt ?? null,
    publishedAt: session.publishedAt ?? null,
    failure: session.failure ?? null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }
}

function requireStore(store: BotEditSessionStore | undefined): BotEditSessionStore {
  if (!store) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Edit-session store is not configured (TELEGRAM_BOT_EDIT_SESSION_DIR missing)",
    })
  }
  return store
}

export const sessionRouter = router({
  /** List the caller's edit sessions, newest first. */
  list: protectedProcedure
    .input(
      z
        .object({ limit: z.number().int().positive().max(100).optional() })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const store = requireStore(ctx.editSessionStore)
      const sessions = await store.listSessions({
        source: "telegram",
        userId: ctx.auth.userId,
        ...(input?.limit ? { limit: input.limit } : {}),
      })
      return sessions.map(toSessionSummary)
    }),

  /** Read a single session by id; only the owner may read it. */
  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const store = requireStore(ctx.editSessionStore)
      const session = await store.readSession(input.id)
      // Hide existence of sessions the caller does not own.
      if (!session || session.userId !== ctx.auth.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }
      return toSessionSummary(session)
    }),
})
