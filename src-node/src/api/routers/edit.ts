import { z } from "zod"
import { TRPCError } from "@trpc/server"
import type { BotEditSessionStore } from "@timeline-studio/core"
import { NodeTelegramBotWorker, type NodeBotWorkflowService } from "@timeline-studio/adapters/node"
import { router, protectedProcedure } from "../trpc"
import { toSessionSummary } from "./session"

/**
 * Gateway edit-mutation router (#329).
 *
 * Mutations reuse the bot's own review logic instead of re-implementing it: the
 * gateway drives a NodeTelegramBotWorker (bound to the shared edit-session store)
 * with a synthesized `/approve` update, scoped to the authenticated user. This
 * keeps approval semantics identical to the bot and writes to the same store.
 *
 * `approve` records the operator decision (status -> approved, approvedBy). It
 * intentionally does NOT publish: delivery needs a publish service and is a
 * follow-up, so this endpoint has no external side effects.
 */

// The approve path never touches the workflow service; a stub satisfies the type.
const stubWorkflow = {
  runWorkflow: async () => {
    throw new Error("workflow execution is not available via the gateway")
  },
  runTelegramLikePayload: async () => {
    throw new Error("workflow execution is not available via the gateway")
  },
  cancelRenderJob: async () => false,
} as unknown as NodeBotWorkflowService

function requireStore(store: BotEditSessionStore | undefined): BotEditSessionStore {
  if (!store) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Edit-session store is not configured (TELEGRAM_BOT_EDIT_SESSION_DIR missing)",
    })
  }
  return store
}

export const editRouter = router({
  /**
   * Approve the caller's review session (concierge approval from the Mini App),
   * reusing the bot's approveEditSession via a synthesized `/approve`. Idempotent
   * on an already-approved session; conflicts when not in a preview-ready state.
   */
  approve: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const store = requireStore(ctx.editSessionStore)
      const session = await store.readSession(input.id)
      if (!session || session.userId !== ctx.auth.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }

      const worker = new NodeTelegramBotWorker({ workflow: stubWorkflow, editSessionStore: store })
      await worker.handleUpdate({
        update_id: 0,
        message: {
          message_id: `gateway-approve-${input.id}`,
          chat: { id: session.chatId ?? ctx.auth.userId },
          from: { id: ctx.auth.userId },
          text: "/approve",
        },
      })

      const updated = await store.readSession(input.id)
      if (!updated || updated.status !== "approved") {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Session cannot be approved in its current state (${updated?.status ?? "missing"})`,
        })
      }
      return toSessionSummary(updated)
    }),
})
