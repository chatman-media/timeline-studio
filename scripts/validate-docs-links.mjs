#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import path from "node:path"

const rootDir = process.cwd()

const defaultFiles = [
  "docs/README.md",
  "docs/10_project_state/current-status.md",
  "docs/10_project_state/roadmap.md",
  "docs/04_api_reference/README.md",
  "docs/03_architecture/frontend/state-management.md",
  "docs/03_architecture/backend/telemetry.md",
  "docs/02_requirements/feature-specification.md",
  "docs/05_development/README.md",
  "docs/14_quality_assurance/README.md",
  "docs/14_quality_assurance/module-finalization-checklist.md",
]

const args = new Set(process.argv.slice(2).filter((arg) => arg.startsWith("--")))
const positionalFiles = process.argv.slice(2).filter((arg) => !arg.startsWith("--"))
const scanAll = args.has("--all")
const reportOnly = args.has("--report")
const jsonOutput = args.has("--json")

function collectMarkdownFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(entryPath))
      continue
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.relative(rootDir, entryPath))
    }
  }

  return files
}

function stripCodeBlocks(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "")
}

function parseHref(rawHref) {
  const trimmed = rawHref.trim()

  if (trimmed.startsWith("<")) {
    const end = trimmed.indexOf(">")
    return end === -1 ? trimmed.slice(1) : trimmed.slice(1, end)
  }

  const quoteIndex = trimmed.search(/\s["']/)
  return quoteIndex === -1 ? trimmed : trimmed.slice(0, quoteIndex)
}

function extractLinks(markdown) {
  const links = []
  const text = stripCodeBlocks(markdown)
  const inlineLinkPattern = /!?\[[^\]\n]*\]\(([^)\n]+)\)/g
  const referenceLinkPattern = /^\s*\[[^\]\n]+\]:\s*(\S+)/gm

  for (const match of text.matchAll(inlineLinkPattern)) {
    if (match[0].startsWith("!")) continue
    links.push(parseHref(match[1]))
  }

  for (const match of text.matchAll(referenceLinkPattern)) {
    links.push(parseHref(match[1]))
  }

  return links
}

function isExternalHref(href) {
  return (
    href.startsWith("#") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    /^[a-z][a-z0-9+.-]*:/i.test(href)
  )
}

function localTargetFor(file, href) {
  if (!href || isExternalHref(href)) return null

  const withoutAnchor = href.split("#")[0]
  if (!withoutAnchor) return null

  const withoutQuery = withoutAnchor.split("?")[0]
  const decodedHref = safeDecodeUri(withoutQuery)

  if (decodedHref.startsWith("/")) {
    return path.join(rootDir, decodedHref.slice(1))
  }

  return path.resolve(rootDir, path.dirname(file), decodedHref)
}

function safeDecodeUri(value) {
  try {
    return decodeURI(value)
  } catch {
    return value
  }
}

function targetExists(target) {
  if (existsSync(target)) return true
  if (existsSync(`${target}.md`)) return true
  if (existsSync(path.join(target, "README.md"))) return true
  return false
}

function filesToScan() {
  if (scanAll) return collectMarkdownFiles(path.join(rootDir, "docs")).sort()
  if (positionalFiles.length > 0) return positionalFiles
  return defaultFiles
}

const brokenLinks = []
const scannedFiles = filesToScan().filter((file) => {
  const target = path.resolve(rootDir, file)
  return existsSync(target) && statSync(target).isFile()
})

for (const file of scannedFiles) {
  const absoluteFile = path.resolve(rootDir, file)
  const markdown = readFileSync(absoluteFile, "utf8")

  for (const href of extractLinks(markdown)) {
    const target = localTargetFor(file, href)

    if (target && !targetExists(target)) {
      brokenLinks.push({
        file,
        href,
        target: path.relative(rootDir, target),
      })
    }
  }
}

if (jsonOutput) {
  console.log(
    JSON.stringify(
      {
        scannedFiles: scannedFiles.length,
        brokenLinks,
      },
      null,
      2,
    ),
  )
} else if (brokenLinks.length === 0) {
  console.log(`Docs link check passed: ${scannedFiles.length} files scanned.`)
} else {
  console.error(`Docs link check found ${brokenLinks.length} broken link(s) in ${scannedFiles.length} file(s):`)

  for (const brokenLink of brokenLinks) {
    console.error(`- ${brokenLink.file}: ${brokenLink.href} -> ${brokenLink.target}`)
  }
}

if (brokenLinks.length > 0 && !reportOnly) {
  process.exitCode = 1
}
