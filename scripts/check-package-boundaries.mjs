#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const defaultConfigPath = path.join(repoRoot, "config/package-boundaries.json")
const supportedExtensions = new Set([".ts", ".tsx"])
const maxDetailsDefault = 50

const args = process.argv.slice(2)
const strict = args.includes("--strict")
const json = args.includes("--json")
const maxDetails = Number.parseInt(
  args.find((arg) => arg.startsWith("--max-details="))?.split("=")[1] ?? String(maxDetailsDefault),
  10,
)
const configPath = path.resolve(
  repoRoot,
  args.find((arg) => arg.startsWith("--config="))?.split("=")[1] ?? defaultConfigPath,
)
const baselineArg = args.find((arg) => arg.startsWith("--baseline="))
const baselinePath = baselineArg ? path.resolve(repoRoot, baselineArg.split("=")[1]) : null

const toPosix = (value) => value.split(path.sep).join("/")

function normalizePattern(pattern) {
  return pattern.replaceAll("\\", "/")
}

function matchesPattern(relativePath, pattern) {
  const normalizedPath = toPosix(relativePath)
  const normalizedPattern = normalizePattern(pattern)

  if (normalizedPattern.startsWith("**/") && normalizedPattern.endsWith("/**")) {
    const segment = normalizedPattern.slice(3, -3)
    return normalizedPath.includes(`/${segment}/`) || normalizedPath.startsWith(`${segment}/`)
  }

  if (normalizedPattern.startsWith("**/*.")) {
    return normalizedPath.endsWith(normalizedPattern.slice(4))
  }

  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3)
    return normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  }

  return normalizedPath === normalizedPattern
}

function classifyPath(relativePath, packages) {
  const normalizedPath = toPosix(relativePath)

  for (const packageInfo of packages) {
    for (const packagePath of packageInfo.paths) {
      if (matchesPattern(normalizedPath, packagePath)) {
        return packageInfo.name
      }
    }
  }

  return null
}

function resolveInternalSpecifier(sourceFile, specifier) {
  const cleanSpecifier = specifier.split("?")[0]

  if (cleanSpecifier.startsWith("@/")) {
    return `src/${cleanSpecifier.slice(2)}`
  }

  if (cleanSpecifier.startsWith("@domains/")) {
    return `src/domains/${cleanSpecifier.slice("@domains/".length)}`
  }

  if (cleanSpecifier.startsWith("@features/")) {
    return `src/features/${cleanSpecifier.slice("@features/".length)}`
  }

  if (cleanSpecifier.startsWith("@ui/")) {
    return `src/components/ui/${cleanSpecifier.slice("@ui/".length)}`
  }

  if (cleanSpecifier.startsWith("@types/")) {
    return `src/types/${cleanSpecifier.slice("@types/".length)}`
  }

  if (cleanSpecifier === "@timeline-studio/core") {
    return "src/core"
  }

  if (cleanSpecifier.startsWith("@timeline-studio/core/")) {
    return `src/core/${cleanSpecifier.slice("@timeline-studio/core/".length)}`
  }

  if (cleanSpecifier.startsWith("@timeline-studio/domains/")) {
    return `src/domains/${cleanSpecifier.slice("@timeline-studio/domains/".length)}`
  }

  if (cleanSpecifier === "@timeline-studio/adapters") {
    return "src/adapters"
  }

  if (cleanSpecifier.startsWith("@timeline-studio/adapters/")) {
    return `src/adapters/${cleanSpecifier.slice("@timeline-studio/adapters/".length)}`
  }

  if (cleanSpecifier.startsWith("@timeline-studio/ui/features/")) {
    return `src/features/${cleanSpecifier.slice("@timeline-studio/ui/features/".length)}`
  }

  if (cleanSpecifier.startsWith("@timeline-studio/ui/components/")) {
    return `src/components/ui/${cleanSpecifier.slice("@timeline-studio/ui/components/".length)}`
  }

  if (cleanSpecifier.startsWith(".")) {
    return toPosix(path.normalize(path.join(path.dirname(sourceFile), cleanSpecifier)))
  }

  return null
}

async function readConfig() {
  const rawConfig = await fs.readFile(configPath, "utf8")
  return JSON.parse(rawConfig)
}

async function readBaseline() {
  if (!baselinePath) {
    return null
  }

  const rawBaseline = await fs.readFile(baselinePath, "utf8")
  return JSON.parse(rawBaseline)
}

async function collectFiles(directory, config, files = []) {
  const entries = await fs.readdir(directory, { withFileTypes: true })

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    const relativePath = toPosix(path.relative(repoRoot, absolutePath))

    if (entry.isDirectory()) {
      if (matchesPattern(relativePath, "**/__tests__/**") || matchesPattern(relativePath, "**/__mocks__/**")) {
        continue
      }
      await collectFiles(absolutePath, config, files)
      continue
    }

    if (!entry.isFile() || !supportedExtensions.has(path.extname(entry.name))) {
      continue
    }

    if (config.ignore.some((pattern) => matchesPattern(relativePath, pattern))) {
      continue
    }

    files.push(relativePath)
  }

  return files
}

function extractImports(source) {
  const imports = []
  const staticPattern =
    /(?:^|[\n;])\s*(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s*)?["']([^"']+)["']/g
  const dynamicPattern = /\b(?:import|require)\(\s*["']([^"']+)["']\s*\)/g

  for (const pattern of [staticPattern, dynamicPattern]) {
    for (const match of source.matchAll(pattern)) {
      const startsAfterNewline = match[0].startsWith("\n")
      imports.push({
        specifier: match[1],
        line: source.slice(0, match.index).split("\n").length + (startsAfterNewline ? 1 : 0),
      })
    }
  }

  return imports
}

function findRule(config, sourcePackage, targetPackage) {
  return config.rules.find(
    (rule) => rule.from === sourcePackage && rule.disallow.includes(targetPackage),
  )
}

function summarizeViolations(violations) {
  return violations.reduce(
    (summary, violation) => {
      summary.bySeverity[violation.severity] = (summary.bySeverity[violation.severity] ?? 0) + 1
      const edge = `${violation.from} -> ${violation.to}`
      summary.byEdge[edge] = (summary.byEdge[edge] ?? 0) + 1
      return summary
    },
    { bySeverity: {}, byEdge: {} },
  )
}

function printTextReport(config, files, violations) {
  const summary = summarizeViolations(violations)
  const mode = strict ? "strict" : "report-only"

  console.log("Package boundary report")
  console.log(`Config: ${toPosix(path.relative(repoRoot, configPath))}`)
  console.log(`Mode: ${mode}`)
  console.log(`Scanned files: ${files.length}`)
  console.log(`Violations: ${violations.length}`)

  if (violations.length === 0) {
    console.log("Result: no package boundary violations found.")
    return
  }

  console.log("")
  console.log("By severity:")
  for (const [severity, count] of Object.entries(summary.bySeverity).sort()) {
    console.log(`- ${severity}: ${count}`)
  }

  console.log("")
  console.log("By edge:")
  for (const [edge, count] of Object.entries(summary.byEdge).sort()) {
    console.log(`- ${edge}: ${count}`)
  }

  console.log("")
  console.log(`Details (first ${Math.min(maxDetails, violations.length)}):`)
  for (const violation of violations.slice(0, maxDetails)) {
    console.log(
      `[${violation.severity}] ${violation.file}:${violation.line} ${violation.from} -> ${violation.to} via "${violation.specifier}"`,
    )
    console.log(`  ${violation.reason}`)
  }

  if (!strict) {
    console.log("")
    console.log("Report-only mode: exiting 0. Use --strict after the Phase F baseline is burned down.")
  }
}

function compareBaseline(violations, baseline) {
  const summary = summarizeViolations(violations)
  const failures = []
  const allowedViolations = baseline.violations ?? baseline.totalViolations

  if (typeof allowedViolations === "number" && violations.length > allowedViolations) {
    failures.push(`violations ${violations.length} > baseline ${allowedViolations}`)
  }

  for (const [severity, count] of Object.entries(summary.bySeverity)) {
    const allowed = baseline.bySeverity?.[severity] ?? 0
    if (count > allowed) {
      failures.push(`severity ${severity} ${count} > baseline ${allowed}`)
    }
  }

  for (const [edge, count] of Object.entries(summary.byEdge)) {
    const allowed = baseline.byEdge?.[edge] ?? 0
    if (count > allowed) {
      failures.push(`edge ${edge} ${count} > baseline ${allowed}`)
    }
  }

  return { failures, summary }
}

function printBaselineReport(comparison) {
  console.log("")
  console.log(`Baseline: ${toPosix(path.relative(repoRoot, baselinePath))}`)

  if (comparison.failures.length === 0) {
    console.log("Baseline gate: passed. No package boundary count increased.")
    return
  }

  console.log("Baseline gate: failed.")
  for (const failure of comparison.failures) {
    console.log(`- ${failure}`)
  }
}

async function main() {
  const config = await readConfig()
  const baseline = await readBaseline()
  const sourceRoot = path.join(repoRoot, config.sourceRoot)
  const files = await collectFiles(sourceRoot, config)
  const violations = []

  for (const file of files) {
    const sourcePackage = classifyPath(file, config.packages)

    if (!sourcePackage) {
      continue
    }

    const source = await fs.readFile(path.join(repoRoot, file), "utf8")

    for (const importInfo of extractImports(source)) {
      const targetPath = resolveInternalSpecifier(file, importInfo.specifier)

      if (!targetPath) {
        continue
      }

      const targetPackage = classifyPath(targetPath, config.packages)

      if (!targetPackage || targetPackage === sourcePackage) {
        continue
      }

      const rule = findRule(config, sourcePackage, targetPackage)

      if (!rule) {
        continue
      }

      violations.push({
        file,
        line: importInfo.line,
        specifier: importInfo.specifier,
        from: sourcePackage,
        to: targetPackage,
        severity: rule.severity,
        reason: rule.reason,
      })
    }
  }

  violations.sort((left, right) => {
    const severityOrder = { error: 0, warn: 1 }
    return (
      (severityOrder[left.severity] ?? 99) - (severityOrder[right.severity] ?? 99)
      || left.file.localeCompare(right.file)
      || left.line - right.line
    )
  })

  const baselineComparison = baseline ? compareBaseline(violations, baseline) : null

  if (json) {
    console.log(
      JSON.stringify(
        {
          files: files.length,
          violations,
          summary: summarizeViolations(violations),
          baseline: baselineComparison
            ? {
                path: toPosix(path.relative(repoRoot, baselinePath)),
                failures: baselineComparison.failures,
              }
            : undefined,
        },
        null,
        2,
      ),
    )
  } else {
    printTextReport(config, files, violations)
    if (baselineComparison) {
      printBaselineReport(baselineComparison)
    }
  }

  if (strict && violations.length > 0) {
    process.exitCode = 1
  }

  if (baselineComparison && baselineComparison.failures.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
