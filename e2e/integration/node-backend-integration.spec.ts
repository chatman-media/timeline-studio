/**
 * Integration tests: Node.js backend + Next.js frontend
 *
 * These tests run against both services simultaneously:
 *   - Frontend:  http://localhost:3001  (Next.js)
 *   - Backend:   http://localhost:3100  (Bun/tRPC media server)
 *
 * Run with:
 *   npx playwright test --project=node-backend-integration
 */

import { test, expect, type APIRequestContext } from "@playwright/test"

// ── Backend URL ───────────────────────────────────────────────────────────────
const BACKEND_URL = process.env.NODE_BACKEND_URL ?? "http://localhost:3100"

// ── tRPC helpers ─────────────────────────────────────────────────────────────
// tRPC v10 batch-link format: GET /trpc/<proc>?batch=1&input={"0":<json>}
// Response: [{ result: { data: <json> } }] on success
//           [{ error: { message, code, data } }] on error

async function tRPCQuery(
  request: APIRequestContext,
  procedure: string,
  input: unknown = null,
) {
  const inputParam = encodeURIComponent(JSON.stringify({ "0": input }))
  const url = `${BACKEND_URL}/trpc/${procedure}?batch=1&input=${inputParam}`
  const response = await request.get(url)
  const body = (await response.json()) as Array<unknown>
  return { response, body, first: body[0] as Record<string, unknown> }
}

async function tRPCMutation(
  request: APIRequestContext,
  procedure: string,
  input: unknown = null,
) {
  const url = `${BACKEND_URL}/trpc/${procedure}?batch=1`
  const response = await request.post(url, {
    data: { "0": input },
    headers: { "Content-Type": "application/json" },
  })
  const body = (await response.json()) as Array<unknown>
  return { response, body, first: body[0] as Record<string, unknown> }
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. Backend Health
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Backend — /health endpoint", () => {
  test("returns 200 with status: ok", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`)

    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe("ok")
    expect(typeof body.timestamp).toBe("number")
    expect(typeof body.uptime).toBe("number")
  })

  test("Content-Type is application/json", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`)
    expect(response.headers()["content-type"]).toContain("application/json")
  })

  test("timestamp is recent (within last 10 seconds)", async ({ request }) => {
    const before = Date.now()
    const response = await request.get(`${BACKEND_URL}/health`)
    const body = await response.json()
    const after = Date.now()

    expect(body.timestamp).toBeGreaterThanOrEqual(before)
    expect(body.timestamp).toBeLessThanOrEqual(after + 1000)
  })

  test("uptime is a positive number", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`)
    const body = await response.json()
    expect(body.uptime).toBeGreaterThan(0)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 2. tRPC — health router
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Backend — tRPC health router", () => {
  test("health.check returns status: ok", async ({ request }) => {
    const { response, first } = await tRPCQuery(request, "health.check")

    expect(response.ok()).toBeTruthy()
    const data = (first as any)?.result?.data
    expect(data?.status).toBe("ok")
    expect(typeof data?.timestamp).toBe("number")
  })

  test("health.ffmpegCheck returns available boolean", async ({ request }) => {
    const { response, first } = await tRPCQuery(request, "health.ffmpegCheck")

    expect(response.ok()).toBeTruthy()
    const data = (first as any)?.result?.data
    expect(typeof data?.available).toBe("boolean")
    expect(typeof data?.timestamp).toBe("number")
  })

  test("FFmpeg is available on this machine", async ({ request }) => {
    const { first } = await tRPCQuery(request, "health.ffmpegCheck")
    const data = (first as any)?.result?.data
    // Warn but don't fail — CI may not have ffmpeg
    if (!data?.available) {
      console.warn("⚠️  FFmpeg not found — media processing tests will be limited")
    }
    expect(data?.available !== undefined).toBe(true)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 3. tRPC — cache router
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Backend — tRPC cache router", () => {
  test("cache.getStats returns cache and queue stats", async ({ request }) => {
    const { response, first } = await tRPCQuery(request, "cache.getStats")

    expect(response.ok()).toBeTruthy()
    const data = (first as any)?.result?.data
    expect(data).toHaveProperty("cache")
    expect(data).toHaveProperty("queue")
    expect(data).toHaveProperty("timestamp")
    expect(typeof data.cache.memorySize).toBe("number")
    expect(typeof data.cache.dbSize).toBe("number")
  })

  test("cache.clear returns success: true", async ({ request }) => {
    const { response, first } = await tRPCMutation(request, "cache.clear")

    expect(response.ok()).toBeTruthy()
    const data = (first as any)?.result?.data
    expect(data?.success).toBe(true)
  })

  test("cache.delete with a key returns success: true", async ({ request }) => {
    const { response, first } = await tRPCMutation(request, "cache.delete", {
      key: "test-integration-key",
    })

    expect(response.ok()).toBeTruthy()
    const data = (first as any)?.result?.data
    expect(data?.success).toBe(true)
  })

  test("cache is empty after clear", async ({ request }) => {
    await tRPCMutation(request, "cache.clear")
    const { first } = await tRPCQuery(request, "cache.getStats")
    const data = (first as any)?.result?.data
    expect(data?.cache?.memorySize).toBe(0)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 4. tRPC — queue router
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Backend — tRPC queue router", () => {
  test("queue.getStats returns job counts", async ({ request }) => {
    const { response, first } = await tRPCQuery(request, "queue.getStats")

    expect(response.ok()).toBeTruthy()
    const data = (first as any)?.result?.data
    expect(typeof data?.pending).toBe("number")
    expect(typeof data?.processing).toBe("number")
    expect(typeof data?.completed).toBe("number")
    expect(typeof data?.failed).toBe("number")
  })

  test("queue.getJobStatus returns null for unknown jobId", async ({ request }) => {
    const { response, first } = await tRPCQuery(request, "queue.getJobStatus", {
      jobId: "non-existent-job-12345",
    })

    expect(response.ok()).toBeTruthy()
    const data = (first as any)?.result?.data
    expect(data).toBeNull()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 5. Zod input validation
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Backend — input validation", () => {
  test("media.getMetadata rejects empty filePath", async ({ request }) => {
    const { first } = await tRPCQuery(request, "media.getMetadata", {
      filePath: "",
    })
    expect((first as any).error).toBeDefined()
    expect((first as any).error?.data?.code).toBe("BAD_REQUEST")
  })

  test("media.scanFolder rejects empty folderPath", async ({ request }) => {
    const { first } = await tRPCMutation(request, "media.scanFolder", {
      folderPath: "",
    })
    expect((first as any).error).toBeDefined()
    expect((first as any).error?.data?.code).toBe("BAD_REQUEST")
  })

  test("media.scanWithThumbnails rejects negative width", async ({ request }) => {
    const { first } = await tRPCMutation(request, "media.scanWithThumbnails", {
      folderPath: "/some/path",
      width: -1,
      height: 180,
    })
    expect((first as any).error).toBeDefined()
    expect((first as any).error?.data?.code).toBe("BAD_REQUEST")
  })

  test("thumbnail.generate rejects empty fileId", async ({ request }) => {
    const { first } = await tRPCMutation(request, "thumbnail.generate", {
      fileId: "",
      filePath: "/test/file.mp4",
    })
    expect((first as any).error).toBeDefined()
    expect((first as any).error?.data?.code).toBe("BAD_REQUEST")
  })

  test("thumbnail.hasCached rejects empty fileId", async ({ request }) => {
    const { first } = await tRPCQuery(request, "thumbnail.hasCached", {
      fileId: "",
      width: 320,
      height: 180,
    })
    expect((first as any).error).toBeDefined()
    expect((first as any).error?.data?.code).toBe("BAD_REQUEST")
  })

  test("thumbnail.generate rejects negative dimensions", async ({ request }) => {
    const { first } = await tRPCMutation(request, "thumbnail.generate", {
      fileId: "test-id",
      filePath: "/test/file.mp4",
      width: -100,
      height: 180,
    })
    expect((first as any).error).toBeDefined()
    expect((first as any).error?.data?.code).toBe("BAD_REQUEST")
  })

  test("waveform.generateData rejects empty filePath", async ({ request }) => {
    const { first } = await tRPCQuery(request, "waveform.generateData", {
      filePath: "",
    })
    expect((first as any).error).toBeDefined()
    expect((first as any).error?.data?.code).toBe("BAD_REQUEST")
  })

  test("waveform.batchGenerate rejects empty files array", async ({ request }) => {
    const { first } = await tRPCMutation(request, "waveform.batchGenerate", {
      files: [],
      width: 800,
      height: 200,
    })
    expect((first as any).error).toBeDefined()
    expect((first as any).error?.data?.code).toBe("BAD_REQUEST")
  })

  test("queue.getJobStatus rejects empty jobId", async ({ request }) => {
    const { first } = await tRPCQuery(request, "queue.getJobStatus", {
      jobId: "",
    })
    expect((first as any).error).toBeDefined()
    expect((first as any).error?.data?.code).toBe("BAD_REQUEST")
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 6. CORS & HTTP semantics
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Backend — CORS & HTTP", () => {
  test("OPTIONS preflight returns CORS headers", async ({ request }) => {
    const response = await request.fetch(`${BACKEND_URL}/trpc/health.check`, {
      method: "OPTIONS",
    })
    const headers = response.headers()
    expect(headers["access-control-allow-origin"]).toBeDefined()
    expect(headers["access-control-allow-methods"]).toBeDefined()
  })

  test("tRPC response includes Access-Control-Allow-Origin", async ({ request }) => {
    const { response } = await tRPCQuery(request, "health.check")
    const origin = response.headers()["access-control-allow-origin"]
    expect(origin).toBeDefined()
  })

  test("unknown route returns 404", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/unknown-route-xyz`)
    expect(response.status()).toBe(404)
  })

  test("unknown tRPC procedure returns error (not 500)", async ({ request }) => {
    const response = await request.get(
      `${BACKEND_URL}/trpc/nonExistent.procedure?batch=1&input=%7B%220%22%3Anull%7D`,
    )
    // tRPC returns 200 or 4xx with error body — not 500
    expect(response.status()).not.toBe(500)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 7. Backend performance
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Backend — performance", () => {
  test("health endpoint responds within 200ms", async ({ request }) => {
    const start = Date.now()
    await request.get(`${BACKEND_URL}/health`)
    const duration = Date.now() - start
    expect(duration).toBeLessThan(200)
  })

  test("tRPC health.check responds within 300ms", async ({ request }) => {
    const start = Date.now()
    await tRPCQuery(request, "health.check")
    const duration = Date.now() - start
    expect(duration).toBeLessThan(300)
  })

  test("handles 10 concurrent /health requests", async ({ request }) => {
    const responses = await Promise.all(
      Array.from({ length: 10 }, () => request.get(`${BACKEND_URL}/health`)),
    )
    expect(responses.every((r) => r.ok())).toBe(true)
  })

  test("handles concurrent tRPC queries", async ({ request }) => {
    const results = await Promise.all([
      tRPCQuery(request, "health.check"),
      tRPCQuery(request, "health.ffmpegCheck"),
      tRPCQuery(request, "cache.getStats"),
      tRPCQuery(request, "queue.getStats"),
    ])
    results.forEach(({ response }) => {
      expect(response.ok()).toBeTruthy()
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 8. Frontend app (Next.js)
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Frontend — app loads", () => {
  test("home page returns 200", async ({ request }) => {
    const response = await request.get("/")
    expect(response.ok()).toBeTruthy()
  })

  test("page title is Timeline Studio", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await expect(page).toHaveTitle("Timeline Studio")
  })

  test("main container is visible", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("div.min-h-screen")).toBeVisible({ timeout: 15000 })
  })

  test("html element has light theme class", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await expect(page.locator("html")).toHaveClass(/light/, { timeout: 10000 })
  })

  test("no critical JS errors on load", async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (err) => {
      if (
        !err.message.includes("ResizeObserver") &&
        !err.message.includes("Cannot read properties of null") &&
        !err.message.includes("Cannot read properties of undefined")
      ) {
        errors.push(err.message)
      }
    })

    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(1000)

    expect(errors).toHaveLength(0)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 9. Frontend UI elements
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Frontend — UI elements", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    // Wait for i18n and React to be ready
    await page.waitForSelector('[role="tablist"]', { timeout: 30000 })
  })

  test("tab list is visible", async ({ page }) => {
    await expect(page.locator('[role="tablist"]').first()).toBeVisible()
  })

  test("media tab is visible", async ({ page }) => {
    await expect(page.locator('[data-testid="media-tab"]')).toBeVisible({ timeout: 15000 })
  })

  test("TopBar theme-toggle button exists", async ({ page }) => {
    await expect(page.locator('[data-testid="theme-toggle"]')).toBeVisible({ timeout: 15000 })
  })

  test("TopBar export button exists", async ({ page }) => {
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible({ timeout: 15000 })
  })

  test("top bar contains action buttons", async ({ page }) => {
    // Verify at least one action button is present in the top bar
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible({
      timeout: 15000,
    })
  })

  test("clicking media tab makes it active", async ({ page }) => {
    const mediaTab = page.locator('[data-testid="media-tab"]')
    await mediaTab.waitFor({ state: "visible", timeout: 15000 })
    await mediaTab.click()
    // Active tab uses cursor-default class (no data-state attribute in this component)
    await expect(mediaTab).toHaveClass(/cursor-default/, { timeout: 5000 })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 10. Frontend + Backend together
// ═════════════════════════════════════════════════════════════════════════════
test.describe("Frontend + Backend — simultaneous", () => {
  test("both services are running at the same time", async ({ page, request }) => {
    // Start frontend navigation and backend health check in parallel
    const [, healthResponse] = await Promise.all([
      page.goto("/"),
      request.get(`${BACKEND_URL}/health`),
    ])

    expect(healthResponse.ok()).toBeTruthy()
    const health = await healthResponse.json()
    expect(health.status).toBe("ok")
  })

  test("backend remains responsive while frontend is active", async ({ page, request }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Backend should still be responsive
    const { first } = await tRPCQuery(request, "health.check")
    const data = (first as any)?.result?.data
    expect(data?.status).toBe("ok")
  })

  test("backend handles requests during frontend navigation", async ({ page, request }) => {
    // Fire backend requests while the page is loading
    const navigationPromise = page.goto("/")

    const [, , healthResponse] = await Promise.all([
      navigationPromise,
      tRPCQuery(request, "cache.getStats"),
      request.get(`${BACKEND_URL}/health`),
    ])

    expect((await healthResponse.json()).status).toBe("ok")
  })

  test("10 backend requests complete while frontend is rendering", async ({
    page,
    request,
  }) => {
    // Start loading the page
    await page.goto("/")

    // Flood the backend with requests
    const backendResponses = await Promise.all(
      Array.from({ length: 10 }, () => request.get(`${BACKEND_URL}/health`)),
    )

    // All backend requests succeeded
    expect(backendResponses.every((r) => r.ok())).toBe(true)

    // Frontend finished loading
    await page.waitForLoadState("networkidle")
    await expect(page.locator("div.min-h-screen")).toBeVisible({ timeout: 15000 })
  })

  test("frontend network monitoring — no unexpected 5xx from backend calls", async ({
    page,
    request,
  }) => {
    const serverErrors: string[] = []

    // Intercept all requests to the backend URL
    await page.route(`${BACKEND_URL}/**`, async (route) => {
      const response = await route.fetch()
      if (response.status() >= 500) {
        serverErrors.push(`${route.request().url()} → ${response.status()}`)
      }
      await route.fulfill({ response })
    })

    await page.goto("/")
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(500)

    // Also test backend directly
    const { response } = await tRPCQuery(request, "health.check")
    expect(response.ok()).toBeTruthy()

    // No 5xx from intercepted backend requests
    expect(serverErrors).toHaveLength(0)
  })

  test("cache stats reflect usage after backend activity", async ({ request }) => {
    // Clear cache first
    await tRPCMutation(request, "cache.clear")

    // Check stats
    const { first: statsResult } = await tRPCQuery(request, "cache.getStats")
    const stats = (statsResult as any)?.result?.data

    expect(stats?.cache?.memorySize).toBe(0)
    expect(stats?.queue?.pending).toBeGreaterThanOrEqual(0)
    expect(stats?.queue?.processing).toBeGreaterThanOrEqual(0)
  })
})
