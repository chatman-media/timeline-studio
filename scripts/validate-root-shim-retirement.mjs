#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const retiredCliEntrypoint = "src/cli/index.ts"

const scannedPaths = [
  ".github",
  "apps/cli",
  "config",
  "docs/06_deployment",
  "docs/10_project_state",
  "docs/engineering",
  "docs/README.md",
  "examples",
  "package.json",
  "scripts",
]

const skippedDirectories = new Set(["node_modules", ".git", "coverage", "dist", "build", ".next", "target"])
const allowedDeclarationFiles = new Set([
  "docs/engineering/root-compatibility-shims.md",
  "scripts/validate-root-shim-retirement.mjs",
])
const textExtensions = new Set([".json", ".md", ".mjs", ".service", ".timer", ".ts", ".tsx", ".yml", ".yaml"])
const errors = []

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function collectFiles(filePath, files = []) {
  const stat = await fs.stat(filePath)

  if (stat.isFile()) {
    if (textExtensions.has(path.extname(filePath)) || path.basename(filePath) === "package.json") {
      files.push(filePath)
    }
    return files
  }

  if (!stat.isDirectory()) {
    return files
  }

  const entries = await fs.readdir(filePath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) {
      continue
    }

    await collectFiles(path.join(filePath, entry.name), files)
  }

  return files
}

for (const scannedPath of scannedPaths) {
  const absolutePath = path.join(repoRoot, scannedPath)
  if (!(await pathExists(absolutePath))) {
    continue
  }

  const files = await collectFiles(absolutePath)
  for (const file of files) {
    const relativePath = path.relative(repoRoot, file)
    if (allowedDeclarationFiles.has(relativePath)) {
      continue
    }

    const raw = await fs.readFile(file, "utf8")
    if (raw.includes(retiredCliEntrypoint)) {
      errors.push(`${relativePath} still references retired ${retiredCliEntrypoint}`)
    }
  }
}

if (errors.length > 0) {
  console.error("Root shim retirement validation failed:")
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log("Root shim retirement validation passed.")
