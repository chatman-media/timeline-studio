#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const toPosix = (value) => value.split(path.sep).join("/")

const files = {
  quickstart: "docs/09_examples/bot-headless-sdk-quickstart.md",
  docsIndex: "docs/README.md",
  currentStatus: "docs/10_project_state/current-status.md",
  roadmap: "docs/10_project_state/roadmap.md",
  externalContracts: "docs/engineering/external-headless-contracts.md",
  botContract: "docs/engineering/bot-first-production-contract.md",
  packageJson: "package.json",
  projectFixture: "examples/headless-postim/project-schema.json",
  renderJobFixture: "examples/headless-postim/render-job.json",
  botWorkflowFixture: "examples/headless-postim/bot-workflow-payload.json",
}

const errors = []

function addError(message) {
  errors.push(message)
}

function assert(condition, message) {
  if (!condition) {
    addError(message)
  }
}

async function readText(relativePath) {
  return fs.readFile(path.join(repoRoot, relativePath), "utf8")
}

async function readJson(relativePath) {
  try {
    return JSON.parse(await readText(relativePath))
  } catch (error) {
    addError(`${relativePath} is not valid JSON: ${error.message}`)
    return null
  }
}

function extractCodeBlocks(source) {
  return [...source.matchAll(/```(?:\w+)?\n([\s\S]*?)```/g)].map((match) => match[1])
}

function scanCodeBlocks(relativePath, source) {
  const forbiddenPatterns = [
    {
      pattern: /from\s+["']@\//,
      message: "must not import root aliases",
    },
    {
      pattern: /import\(["']@\//,
      message: "must not dynamically import root aliases",
    },
    {
      pattern: /from\s+["']packages\/[^"']+\/src\//,
      message: "must not import package-private package source",
    },
    {
      pattern: /import\(["']packages\/[^"']+\/src\//,
      message: "must not dynamically import package-private package source",
    },
    {
      pattern: /src-tauri\//,
      message: "must not reference src-tauri internals in runnable snippets",
    },
  ]

  for (const [index, block] of extractCodeBlocks(source).entries()) {
    for (const { pattern, message } of forbiddenPatterns) {
      if (pattern.test(block)) {
        addError(`${relativePath} code block ${index + 1} ${message}`)
      }
    }
  }
}

const quickstart = await readText(files.quickstart)
const docsIndex = await readText(files.docsIndex)
const currentStatus = await readText(files.currentStatus)
const roadmap = await readText(files.roadmap)
const externalContracts = await readText(files.externalContracts)
const botContract = await readText(files.botContract)
const packageJson = await readJson(files.packageJson)
const projectFixture = await readJson(files.projectFixture)
const renderJobFixture = await readJson(files.renderJobFixture)
const botWorkflowFixture = await readJson(files.botWorkflowFixture)

for (const required of [
  "ProjectSchema",
  "render-job",
  "bot-workflow",
  "bot-worker",
  "bot-cleanup",
  "@timeline/shared-types/schema",
  "examples/headless-postim/project-schema.json",
  "examples/headless-postim/render-job.json",
  "examples/headless-postim/bot-workflow-payload.json",
  "config/bot-worker.sandbox.env.example",
  "config/bot-worker.production.env.example",
  "timeline publish telegram",
  "--validate-only",
  "bun run check:examples:headless-sdk",
]) {
  assert(quickstart.includes(required), `${files.quickstart} must mention ${required}`)
}

scanCodeBlocks(files.quickstart, quickstart)

const quickstartLink = "09_examples/bot-headless-sdk-quickstart.md"
assert(docsIndex.includes(quickstartLink), `${files.docsIndex} must link the SDK quickstart`)
assert(currentStatus.includes("../09_examples/bot-headless-sdk-quickstart.md"), `${files.currentStatus} must link the SDK quickstart`)
assert(roadmap.includes("../09_examples/bot-headless-sdk-quickstart.md"), `${files.roadmap} must link the SDK quickstart`)
assert(externalContracts.includes("../09_examples/bot-headless-sdk-quickstart.md"), `${files.externalContracts} must link the SDK quickstart`)
assert(botContract.includes("../09_examples/bot-headless-sdk-quickstart.md"), `${files.botContract} must link the SDK quickstart`)

assert(
  packageJson?.scripts?.["check:examples:headless-sdk"] === "node scripts/validate-bot-headless-sdk-docs.mjs",
  "package.json must expose check:examples:headless-sdk",
)

assert(projectFixture?.version === "1.0.0", `${files.projectFixture} must be a ProjectSchema fixture`)
assert(renderJobFixture?.project?.path === "examples/headless-postim/project-schema.json", `${files.renderJobFixture} must point at ProjectSchema fixture`)
assert(
  (botWorkflowFixture?.text ?? botWorkflowFixture?.caption ?? "").includes("project=examples/headless-postim/project-schema.json"),
  `${files.botWorkflowFixture} must include a project hint`,
)

if (errors.length > 0) {
  console.error("Bot/headless SDK docs validation failed:")
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log(`Bot/headless SDK docs validation passed for ${toPosix(files.quickstart)}.`)
