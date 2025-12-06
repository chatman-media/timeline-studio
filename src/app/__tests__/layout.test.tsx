/**
 * Tests for RootLayout component
 *
 * Note: layout.tsx imports CSS files which require PostCSS processing.
 * Full testing of RootLayout happens in E2E tests.
 * These tests verify the file structure and exports.
 */

import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const layoutPath = path.join(__dirname, "../layout.tsx")

describe("RootLayout file", () => {
  it("should exist", () => {
    expect(fs.existsSync(layoutPath)).toBe(true)
  })

  it("should export default function", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain("export default function RootLayout")
  })

  it("should export metadata", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain("export const metadata")
  })

  it("should have metadata title", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain('title: "Timeline Studio"')
  })

  it("should have metadata description", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain('description: "Professional video editing application"')
  })

  it("should import Providers", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain("import { Providers }")
  })

  it("should import AppErrorBoundary", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain("import { AppErrorBoundary }")
  })

  it("should include Tauri event plugin internals script", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain("__TAURI_EVENT_PLUGIN_INTERNALS__")
  })

  it("should set html lang to en", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain('lang="en"')
  })

  it("should have suppressHydrationWarning", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain("suppressHydrationWarning")
  })

  it("should have antialiased body class", () => {
    const content = fs.readFileSync(layoutPath, "utf-8")
    expect(content).toContain('className="antialiased"')
  })
})
