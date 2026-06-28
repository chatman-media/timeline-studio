import crypto from "node:crypto"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { NodeTelegramBotWorker } from "@timeline-studio/adapters/node"
import { protectedProcedure, router } from "../trpc"

/**
 * Gateway idea-submission router (#330).
 *
 * `submit` lets the Mini App start a fresh review session from a plain idea,
 * reusing the bot's own first-cut workflow: the gateway drives a
 * NodeTelegramBotWorker (bound to the real workflow runner + an in-process
 * queue) with a synthesized plain-text message, scoped to the authenticated
 * user. With the queue wired, the worker enqueues and returns immediately; the
 * first cut renders in the background and the session surfaces in `session.list`
 * (and render-status SSE) once it reaches preview-ready.
 *
 * Disabled unless a script generator is configured (GATEWAY_SCRIPT_GENERATOR_API_KEY),
 * mirroring how edit.revise is gated on an AI editor.
 */
export const ideaRouter = router({
  submit: protectedProcedure
    .input(z.object({ text: z.string().trim().min(1).max(4000) }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.botWorkflow) {
        throw new TRPCError({
          code: "NOT_IMPLEMENTED",
          message: "Idea submission is not enabled (GATEWAY_SCRIPT_GENERATOR_API_KEY missing)",
        })
      }
      if (!ctx.editSessionStore) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Edit-session store is not configured (TELEGRAM_BOT_EDIT_SESSION_DIR missing)",
        })
      }

      const worker = new NodeTelegramBotWorker({
        workflow: ctx.botWorkflow,
        editSessionStore: ctx.editSessionStore,
        ...(ctx.workflowQueue ? { workflowQueue: ctx.workflowQueue } : {}),
        ...(ctx.workflowJobStore ? { workflowJobStore: ctx.workflowJobStore } : {}),
        ...(ctx.aiProjectEditor ? { aiProjectEditor: ctx.aiProjectEditor } : {}),
        ...(ctx.publishService ? { publishService: ctx.publishService } : {}),
      })

      const result = await worker.handleUpdate({
        update_id: 0,
        message: {
          // Unique id so the worker doesn't treat this as a duplicate of a prior job.
          message_id: `gateway-idea-${crypto.randomUUID()}`,
          chat: { id: ctx.auth.userId },
          from: { id: ctx.auth.userId },
          text: input.text,
        },
      })

      if (result.skipped) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Idea was not accepted (${result.reason ?? "skipped"})`,
        })
      }

      const queued = "queued" in result && result.queued === true
      const jobId = "queueId" in result && result.queueId ? result.queueId : null
      return {
        queued,
        jobId,
        status: queued ? ("queued" as const) : ("running" as const),
      }
    }),
})
