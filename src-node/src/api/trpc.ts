import { initTRPC } from "@trpc/server"
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
export const publicProcedure = t.procedure
