#!/usr/bin/env bun

import { runRustAIReviewSmoke } from "@timeline-studio/adapters/node/rust-ai-review-smoke"

const result = await runRustAIReviewSmoke({
  repoRoot: process.cwd(),
  keepTemp: process.env.AI_REVIEW_RUST_SMOKE_KEEP_TEMP !== "0",
})

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (!result.ok) {
  process.exitCode = 1
}
