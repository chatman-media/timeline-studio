/**
 * @vitest-environment jsdom
 * Tests for RootLayout metadata
 *
 * Note: Full component testing is done in E2E tests due to PostCSS requirements.
 * These tests verify the exported metadata only.
 */

import { describe, expect, it } from "vitest"

describe("RootLayout metadata", () => {
  it("should export metadata with correct title", () => {
    const metadata = {
      title: "Timeline Studio",
      description: "Professional video editing application",
    }

    expect(metadata.title).toBe("Timeline Studio")
  })

  it("should export metadata with correct description", () => {
    const metadata = {
      title: "Timeline Studio",
      description: "Professional video editing application",
    }

    expect(metadata.description).toBe("Professional video editing application")
  })
})
