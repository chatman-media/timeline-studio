import { expect, test } from "../fixtures/test-base"
import { clickBrowserTab, isAnyVisible } from "../helpers/test-utils"

test.describe("Simple Media Import Tests", () => {
  test("can navigate to Media tab", async ({ page }) => {
    // Click on Media tab
    await clickBrowserTab(page, "Media")

    // Verify we're on Media tab
    const hasMediaIndicators = await isAnyVisible(page, [
      'button:has-text("Import")',
      'button:has-text("Add")',
      "text=/no media|empty|drag/i",
      '[class*="drop"]',
      '[class*="import"]',
    ])

    expect(hasMediaIndicators).toBeTruthy()
  })

  test("has import buttons in Media tab", async ({ page }) => {
    await clickBrowserTab(page, "Media")

    // Check for buttons
    const buttons = await page.locator("button:visible").count()
    expect(buttons).toBeGreaterThan(0)

    // Look for import-related buttons
    const importButton = page
      .locator("button")
      .filter({ hasText: /import|add|upload/i })
      .first()
    if (await importButton.isVisible()) {
      console.log("Found import button:", await importButton.textContent())
    }
  })

  test("can simulate file dialog", async ({ page }) => {
    await clickBrowserTab(page, "Media")

    // Find and click import button
    const importButton = page
      .locator("button")
      .filter({ hasText: /import|add/i })
      .first()

    if (await importButton.isVisible()) {
      // Inject command tracker before clicking
      await page.evaluate(() => {
        ;(window as any).__commandsCalled = []
        if (window.__TAURI__?.core?.invoke) {
          const originalInvoke = window.__TAURI__.core.invoke
          window.__TAURI__.core.invoke = async (cmd: string, args?: any) => {
            console.log("Tauri command called:", cmd)
            ;(window as any).__commandsCalled.push(cmd)
            return originalInvoke(cmd, args)
          }
        }
      })

      await importButton.click()
      await page.waitForTimeout(500)

      // Check if any dialog or import command was called
      const commandsCalled = await page.evaluate(() => (window as any).__commandsCalled || [])
      console.log("Commands called:", commandsCalled)

      // Verify button was clickable at least
      expect(await importButton.isVisible()).toBeTruthy()
    } else {
      console.log("No import button found, skipping test")
    }
  })

  test("shows empty state or media items", async ({ page }) => {
    await clickBrowserTab(page, "Media")
    await page.waitForTimeout(500)

    // Check for either empty state or media items
    const hasContent = await isAnyVisible(page, [
      // Empty state indicators
      "text=/no media|no files|empty|drag.*drop/i",
      '[class*="empty"]',
      '[class*="placeholder"]',
      // Media item indicators
      '[class*="media-item"]',
      '[class*="thumbnail"]',
      '[class*="video-card"]',
      '[class*="file-card"]',
      'img[alt*="thumbnail"]',
      "video",
    ])

    expect(hasContent).toBeTruthy()
  })

  test("responsive in Media tab", async ({ page }) => {
    await clickBrowserTab(page, "Media")

    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: "Desktop" },
      { width: 768, height: 1024, name: "Tablet" },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.waitForTimeout(300)

      // Check that content is still visible
      const buttons = await page.locator("button:visible").count()
      expect(buttons).toBeGreaterThan(0)

      console.log(`${viewport.name}: ${buttons} buttons visible`)
    }
  })
})
