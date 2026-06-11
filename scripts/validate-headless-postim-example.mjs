#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const exampleDir = path.join(repoRoot, "examples/headless-postim")
const toPosix = (value) => value.split(path.sep).join("/")

const files = {
  readme: path.join(exampleDir, "README.md"),
  project: path.join(exampleDir, "project-schema.json"),
  renderJob: path.join(exampleDir, "render-job.json"),
  botWorkflow: path.join(exampleDir, "bot-workflow-payload.json"),
}

const expectedProjectPath = "examples/headless-postim/project-schema.json"
const errors = []

function addError(message) {
  errors.push(message)
}

async function readJson(filePath) {
  const relativePath = toPosix(path.relative(repoRoot, filePath))

  try {
    const raw = await fs.readFile(filePath, "utf8")
    return JSON.parse(raw)
  } catch (error) {
    addError(`${relativePath} is not valid JSON: ${error.message}`)
    return null
  }
}

function assert(condition, message) {
  if (!condition) {
    addError(message)
  }
}

function scanMachineReadablePayload(relativePath, value) {
  const raw = typeof value === "string" ? value : JSON.stringify(value, null, 2)
  const forbiddenPatterns = [
    {
      pattern: /src-tauri(?:\/|\\|\b)/,
      message: "must not reference src-tauri internals",
    },
    {
      pattern: /@\/(?:core|domains|adapters|features|components|types|config|app)(?:\/|\b)/,
      message: "must not reference root @/* aliases",
    },
    {
      pattern: /packages\/[^/\s]+\/src\//,
      message: "must not reference package-private packages/*/src paths",
    },
    {
      pattern: /apps\/(?!cli\/src\/index\.ts\b)[^/\s]+\/src\//,
      message: "must not reference package-private apps/*/src paths",
    },
  ]

  for (const { pattern, message } of forbiddenPatterns) {
    if (pattern.test(raw)) {
      addError(`${relativePath} ${message}`)
    }
  }
}

function validateProjectSchema(project) {
  if (!project) {
    return
  }

  assert(project.version === "1.0.0", "project-schema.json must use ProjectSchema version 1.0.0")
  assert(project.metadata?.name === "postim-headless-example", "project-schema.json must name the fixture")
  assert(project.timeline?.fps === 30, "project-schema.json must define a 30fps timeline")
  assert(project.timeline?.resolution?.[0] === 1920, "project-schema.json must use 1920px width")
  assert(project.timeline?.resolution?.[1] === 1080, "project-schema.json must use 1080px height")
  assert(Array.isArray(project.tracks) && project.tracks.length === 1, "project-schema.json must contain one video track")

  const track = project.tracks?.[0]
  assert(track?.track_type === "Video", "project-schema.json track must be Video")
  assert(Array.isArray(track?.clips) && track.clips.length === 1, "project-schema.json must contain one video clip")

  const clip = track?.clips?.[0]
  assert(
    clip?.source?.File === "examples/headless-postim/media/input.mp4",
    "project-schema.json clip must use the documented placeholder media path",
  )
  assert(clip?.end_time > clip?.start_time, "project-schema.json clip end_time must be greater than start_time")
  assert(project.settings?.export?.format === "Mp4", "project-schema.json export format must be Mp4")
  assert(project.settings?.custom?.externalConsumer === "postim", "project-schema.json must identify postim as consumer")
}

function validateRenderJob(renderJob) {
  if (!renderJob) {
    return
  }

  assert(renderJob.source === "cli", "render-job.json source must be cli")
  assert(renderJob.project?.type === "file", "render-job.json project must be a file handoff")
  assert(renderJob.project?.path === expectedProjectPath, "render-job.json must point at the example ProjectSchema")
  assert(renderJob.output?.format === "mp4", "render-job.json output format must be mp4")
  assert(renderJob.output?.destination === "file", "render-job.json destination must be file")
  assert(renderJob.output?.path === ".tmp/postim-headless/render-job.mp4", "render-job.json must use the example output path")
  assert(renderJob.params?.publishHandoff === "file-only", "render-job.json must keep publish handoff file-only")
}

function validateBotWorkflowPayload(payload) {
  if (!payload) {
    return
  }

  const text = payload.text ?? payload.caption ?? ""
  assert(payload.chat?.id === "postim-demo-chat", "bot-workflow-payload.json must include a stable demo chat id")
  assert(payload.from?.id === "postim-demo-user", "bot-workflow-payload.json must include a stable demo user id")
  assert(text.includes(`project=${expectedProjectPath}`), "bot-workflow-payload.json must include the project hint")
  assert(text.includes("destination=file"), "bot-workflow-payload.json must include file destination hint")
  assert(text.includes("output=.tmp/postim-headless/bot-workflow.mp4"), "bot-workflow-payload.json must include output hint")
  assert(text.includes("resolution=1080p"), "bot-workflow-payload.json must include resolution hint")
}

async function validateReadme() {
  const raw = await fs.readFile(files.readme, "utf8")
  const relativePath = toPosix(path.relative(repoRoot, files.readme))

  assert(raw.includes("bun run check:examples:postim"), `${relativePath} must document the validation command`)
  assert(raw.includes("@timeline/shared-types/schema"), `${relativePath} must document the public ProjectSchema import`)
  assert(raw.includes("timeline publish ... --json"), `${relativePath} must document Rust publish ownership`)
  assert(raw.includes("Streaming Boundary"), `${relativePath} must call out the streaming boundary`)
  assert(raw.includes("Unsupported Integration Surfaces"), `${relativePath} must call out unsupported surfaces`)

  const codeBlocks = [...raw.matchAll(/```(?:\w+)?\n([\s\S]*?)```/g)].map((match) => match[1])
  for (const [index, block] of codeBlocks.entries()) {
    scanMachineReadablePayload(`${relativePath} code block ${index + 1}`, block)
  }
}

const project = await readJson(files.project)
const renderJob = await readJson(files.renderJob)
const botWorkflow = await readJson(files.botWorkflow)

validateProjectSchema(project)
validateRenderJob(renderJob)
validateBotWorkflowPayload(botWorkflow)
await validateReadme()

scanMachineReadablePayload(toPosix(path.relative(repoRoot, files.project)), project)
scanMachineReadablePayload(toPosix(path.relative(repoRoot, files.renderJob)), renderJob)
scanMachineReadablePayload(toPosix(path.relative(repoRoot, files.botWorkflow)), botWorkflow)

if (errors.length > 0) {
  console.error("Postim headless example validation failed:")
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log("Postim headless example validation passed.")
