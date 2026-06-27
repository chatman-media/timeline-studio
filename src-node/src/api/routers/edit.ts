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
 * `approve` records the operator decision (status -> approved, approvedBy). When
 * delivery-on-approve is opted in (a publish service in context), the reused bot
 * logic also publishes the result (status -> done/failed). Off by default, so the
 * gateway has no external side effects unless explicitly configured.
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

      const worker = new NodeTelegramBotWorker({
        workflow: stubWorkflow,
        editSessionStore: store,
        ...(ctx.publishService ? { publishService: ctx.publishService } : {}),
      })
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
      // "approved": recorded (no delivery). "done": approved + published.
      if (updated && (updated.status === "approved" || updated.status === "done")) {
        return toSessionSummary(updated)
      }
      // "failed" after our approve means delivery failed — surface it.
      if (updated?.status === "failed") {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: `Delivery failed: ${updated.failure ?? "unknown error"}`,
        })
      }
      throw new TRPCError({
        code: "CONFLICT",
        message: `Session cannot be approved in its current state (${updated?.status ?? "missing"})`,
      })
    }),

  /**
   * Revise the caller's preview-ready session with a natural-language
   * instruction, reusing the bot's applyReviewFeedback via a synthesized
   * `/revise <instruction>`. Requires an AI project editor to be configured.
   */
  revise: protectedProcedure
    .input(z.object({ id: z.string().min(1), instruction: z.string().trim().min(1).max(2000) }))
    .mutation(async ({ ctx, input }) => {
      const store = requireStore(ctx.editSessionStore)
      if (!ctx.aiProjectEditor) {
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
          message: "Revise is not enabled (GATEWAY_AI_EDITOR_API_KEY missing)",
        })
      }
      const session = await store.readSession(input.id)
      if (!session || session.userId !== ctx.auth.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }
      if (session.status !== "preview_ready") {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Session cannot be revised in its current state (${session.status})`,
        })
      }

      const worker = new NodeTelegramBotWorker({
        workflow: stubWorkflow,
        editSessionStore: store,
        aiProjectEditor: ctx.aiProjectEditor,
      })
      await worker.handleUpdate({
        update_id: 0,
        message: {
          message_id: `gateway-revise-${input.id}`,
          chat: { id: session.chatId ?? ctx.auth.userId },
          from: { id: ctx.auth.userId },
          text: `/revise ${input.instruction}`,
        },
      })

      const updated = await store.readSession(input.id)
      if (updated?.status === "preview_ready") {
        return toSessionSummary(updated)
      }
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: `Revision failed: ${updated?.failure ?? `unexpected state ${updated?.status ?? "missing"}`}`,
      })
    }),

  /**
   * Cancel (discard) the caller's review session, reusing the bot's
   * cancelEditSession via a synthesized `/cancel`. Idempotent on an
   * already-cancelled session; conflicts on a completed (done/failed) one.
   */
  cancel: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const store = requireStore(ctx.editSessionStore)
      const session = await store.readSession(input.id)
      if (!session || session.userId !== ctx.auth.userId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Session not found" })
      }
      if (session.status === "cancelled") {
        return toSessionSummary(session) // idempotent
      }
      if (session.status === "done" || session.status === "failed") {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Session cannot be cancelled in its current state (${session.status})`,
        })
      }

      const worker = new NodeTelegramBotWorker({ workflow: stubWorkflow, editSessionStore: store })
      await worker.handleUpdate({
        update_id: 0,
        message: {
          message_id: `gateway-cancel-${input.id}`,
          chat: { id: session.chatId ?? ctx.auth.userId },
          from: { id: ctx.auth.userId },
          text: "/cancel",
        },
      })

      const updated = await store.readSession(input.id)
      if (updated?.status !== "cancelled") {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Session could not be cancelled (${updated?.status ?? "missing"})`,
        })
      }
      return toSessionSummary(updated)
    }),
})
