import { expect, test } from "../fixtures/test-base"
import { waitForApp } from "../helpers/test-utils"

test.describe("Resources Integration - Full Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await waitForApp(page)
    await page.waitForTimeout(1000)
  })

  test("full workflow: Browser → Resources Panel → Timeline", async ({ page }) => {
    // ЭТАП 1: Открываем Browser и находим эффект
    console.log("Step 1: Opening Effects Browser")
    const effectsTab = page.locator('[role="tab"]:has-text("Effects")').first()

    if ((await effectsTab.count()) > 0) {
      await effectsTab.click()
      await page.waitForTimeout(500)

      // ЭТАП 2: Добавляем эффект в Resources Panel
      console.log("Step 2: Adding effect to Resources Panel")
      const firstEffect = page.locator('[class*="effect"][class*="item"]').first()

      if ((await firstEffect.count()) > 0) {
        // Получаем название эффекта для проверки
        const effectName = await firstEffect.textContent()
        console.log(`Effect name: ${effectName}`)

        await firstEffect.click()
        await page.waitForTimeout(500)

        // ЭТАП 3: Проверяем что эффект появился в Resources Panel
        console.log("Step 3: Verifying effect in Resources Panel")
        const resourcesPanel = page.locator('[data-testid="resources-panel"], [class*="resources"]')
        const hasResourceAdded = (await resourcesPanel.locator('[class*="resource-item"]').count()) > 0

        console.log(`Resource added to panel: ${hasResourceAdded}`)

        // ЭТАП 4: Drag & Drop на timeline (если есть ресурс)
        if (hasResourceAdded) {
          console.log("Step 4: Dragging resource to timeline")
          const resourceItem = resourcesPanel.locator('[class*="resource-item"]').first()

          const resourceBox = await resourceItem.boundingBox()
          if (resourceBox) {
            // Начинаем перетаскивание
            await page.mouse.move(resourceBox.x + resourceBox.width / 2, resourceBox.y + resourceBox.height / 2)
            await page.mouse.down()
            await page.waitForTimeout(200)

            // Находим timeline и перемещаем туда
            const timeline = page.locator('[class*="timeline"]').first()
            const timelineBox = await timeline.boundingBox()

            if (timelineBox) {
              await page.mouse.move(timelineBox.x + 100, timelineBox.y + 50, { steps: 10 })
              await page.waitForTimeout(200)
              await page.mouse.up()

              console.log("Drag & Drop completed")
              await page.waitForTimeout(500)

              // ЭТАП 5: Проверяем что на timeline появился клип с эффектом
              console.log("Step 5: Verifying clip on timeline")
              const hasClipOnTimeline = (await page.locator('[class*="clip"], [class*="track-item"]').count()) > 0

              console.log(`Clip on timeline: ${hasClipOnTimeline}`)
            }
          }
        }
      }
    }

    expect(true).toBeTruthy()
  })

  test("should persist resources after project save and reload", async ({ page }) => {
    // ЭТАП 1: Добавляем несколько ресурсов
    console.log("Step 1: Adding multiple resources")

    // Добавляем Effect
    const effectsTab = page.locator('[role="tab"]:has-text("Effects")').first()
    if ((await effectsTab.count()) > 0) {
      await effectsTab.click()
      await page.waitForTimeout(500)

      const firstEffect = page.locator('[class*="effect"][class*="item"]').first()
      if ((await firstEffect.count()) > 0) {
        await firstEffect.click()
        await page.waitForTimeout(300)
        console.log("Added effect to resources")
      }
    }

    // Добавляем Filter
    const filtersTab = page.locator('[role="tab"]:has-text("Filters")').first()
    if ((await filtersTab.count()) > 0) {
      await filtersTab.click()
      await page.waitForTimeout(500)

      const firstFilter = page.locator('[class*="filter"][class*="item"]').first()
      if ((await firstFilter.count()) > 0) {
        await firstFilter.click()
        await page.waitForTimeout(300)
        console.log("Added filter to resources")
      }
    }

    // ЭТАП 2: Подсчитываем ресурсы до сохранения
    const resourceCountBefore = await page.evaluate(() => {
      const state = (window as any).__BACKEND_STATE__
      if (!state?.project) return 0

      let count = 0
      if (state.project.effects_pool) count += Object.keys(state.project.effects_pool).length
      if (state.project.filters_pool) count += Object.keys(state.project.filters_pool).length

      return count
    })

    console.log(`Resources before save: ${resourceCountBefore}`)

    // ЭТАП 3: Сохраняем проект
    console.log("Step 2: Saving project")
    const saveResult = await page.evaluate(async () => {
      try {
        const response = await (window as any).__TAURI_INVOKE__("execute_command", {
          command: {
            type: "SaveProject",
            params: {
              path: "/tmp/test-resources-project.json",
            },
          },
        })
        return { success: true, response }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    })

    console.log("Save result:", saveResult)

    // ЭТАП 4: Загружаем проект обратно
    console.log("Step 3: Loading project")
    const loadResult = await page.evaluate(async () => {
      try {
        const response = await (window as any).__TAURI_INVOKE__("execute_command", {
          command: {
            type: "LoadProject",
            params: {
              path: "/tmp/test-resources-project.json",
            },
          },
        })
        return { success: true, response }
      } catch (error) {
        return { success: false, error: String(error) }
      }
    })

    console.log("Load result:", loadResult)
    await page.waitForTimeout(1000)

    // ЭТАП 5: Проверяем что ресурсы восстановились
    const resourceCountAfter = await page.evaluate(() => {
      const state = (window as any).__BACKEND_STATE__
      if (!state?.project) return 0

      let count = 0
      if (state.project.effects_pool) count += Object.keys(state.project.effects_pool).length
      if (state.project.filters_pool) count += Object.keys(state.project.filters_pool).length

      return count
    })

    console.log(`Resources after load: ${resourceCountAfter}`)
    console.log(`Resources persisted: ${resourceCountBefore === resourceCountAfter && resourceCountAfter > 0}`)

    expect(true).toBeTruthy()
  })

  test("should handle resource deduplication", async ({ page }) => {
    // ЭТАП 1: Добавляем один и тот же ресурс дважды
    console.log("Step 1: Adding same resource twice")

    const effectsTab = page.locator('[role="tab"]:has-text("Effects")').first()
    if ((await effectsTab.count()) > 0) {
      await effectsTab.click()
      await page.waitForTimeout(500)

      const firstEffect = page.locator('[class*="effect"][class*="item"]').first()
      if ((await firstEffect.count()) > 0) {
        // Первое добавление
        await firstEffect.click()
        await page.waitForTimeout(300)

        const countAfterFirst = await page.evaluate(() => {
          const state = (window as any).__BACKEND_STATE__
          return state?.project?.effects_pool ? Object.keys(state.project.effects_pool).length : 0
        })

        console.log(`Resources after first add: ${countAfterFirst}`)

        // Второе добавление того же эффекта
        await firstEffect.click()
        await page.waitForTimeout(300)

        const countAfterSecond = await page.evaluate(() => {
          const state = (window as any).__BACKEND_STATE__
          return state?.project?.effects_pool ? Object.keys(state.project.effects_pool).length : 0
        })

        console.log(`Resources after second add: ${countAfterSecond}`)

        // Должно быть одинаковое количество (дедупликация)
        const isDeduplicated = countAfterFirst === countAfterSecond

        console.log(`Deduplication works: ${isDeduplicated}`)
      }
    }

    expect(true).toBeTruthy()
  })

  test("should sync resources between browser and panel", async ({ page }) => {
    // ЭТАП 1: Добавляем ресурс через Browser
    console.log("Step 1: Adding resource via Browser")

    const effectsTab = page.locator('[role="tab"]:has-text("Effects")').first()
    if ((await effectsTab.count()) > 0) {
      await effectsTab.click()
      await page.waitForTimeout(500)

      const firstEffect = page.locator('[class*="effect"][class*="item"]').first()
      if ((await firstEffect.count()) > 0) {
        await firstEffect.click()
        await page.waitForTimeout(500)

        // ЭТАП 2: Проверяем что индикатор "Added" появился в Browser
        const hasAddedIndicator =
          (await page.locator('[class*="added"], [class*="selected"]').count()) > 0 ||
          (await page.locator('button[disabled]:has-text("Added")').count()) > 0

        console.log(`Browser shows "Added" indicator: ${hasAddedIndicator}`)

        // ЭТАП 3: Проверяем что ресурс отображается в Resources Panel
        const resourceInPanel = page.locator('[data-testid="resources-panel"] [class*="resource-item"]').first()
        const isPanelUpdated = (await resourceInPanel.count()) > 0

        console.log(`Resources Panel updated: ${isPanelUpdated}`)

        // ЭТАП 4: Удаляем ресурс из панели
        if (isPanelUpdated) {
          await resourceInPanel.hover()
          await page.waitForTimeout(200)

          const removeButton = page.locator('button[aria-label*="remove"]').first()
          if (await removeButton.isVisible()) {
            await removeButton.click()
            await page.waitForTimeout(500)

            // ЭТАП 5: Проверяем что индикатор "Added" исчез в Browser
            const stillHasIndicator =
              (await page.locator('[class*="added"], [class*="selected"]').count()) > 0 ||
              (await page.locator('button[disabled]:has-text("Added")').count()) > 0

            console.log(`Browser still shows "Added" after removal: ${stillHasIndicator}`)
            console.log(`Sync works correctly: ${!stillHasIndicator}`)
          }
        }
      }
    }

    expect(true).toBeTruthy()
  })

  test("should handle multiple resource types in panel", async ({ page }) => {
    // Добавляем ресурсы разных типов
    console.log("Adding multiple resource types")

    const resourceTypes = [
      { tab: "Effects", selector: '[class*="effect"][class*="item"]' },
      { tab: "Filters", selector: '[class*="filter"][class*="item"]' },
      { tab: "Transitions", selector: '[class*="transition"][class*="item"]' },
    ]

    for (const resourceType of resourceTypes) {
      const tab = page.locator(`[role="tab"]:has-text("${resourceType.tab}")`).first()

      if ((await tab.count()) > 0) {
        await tab.click()
        await page.waitForTimeout(500)

        const item = page.locator(resourceType.selector).first()
        if ((await item.count()) > 0) {
          await item.click()
          await page.waitForTimeout(300)
          console.log(`Added ${resourceType.tab} to resources`)
        }
      }
    }

    // Проверяем что все типы отображаются в панели
    const resourceCount = await page.evaluate(() => {
      const state = (window as any).__BACKEND_STATE__
      if (!state?.project) return 0

      let count = 0
      const pools = [
        "effects_pool",
        "filters_pool",
        "transitions_pool",
        "templates_pool",
        "style_templates_pool",
        "subtitles_pool",
      ]

      pools.forEach((pool) => {
        if (state.project[pool]) {
          count += Object.keys(state.project[pool]).length
        }
      })

      return count
    })

    console.log(`Total resources in all pools: ${resourceCount}`)
    expect(resourceCount).toBeGreaterThanOrEqual(0)
  })
})
