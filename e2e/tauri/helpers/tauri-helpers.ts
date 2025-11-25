/**
 * Tauri Helpers
 *
 * A?><>30B5;L=K5 DC=:F88 4;O @01>BK A Tauri API 2 E2E B5AB0E
 */

import type { Page } from '@playwright/test'

/**
 * 6840=85 ?>;=>9 8=8F80;870F88 Tauri API
 */
export async function waitForTauriReady(page: Page, timeout = 10000): Promise<void> {
  await page.waitForFunction(
    () => {
      return (
        typeof (window as any).__TAURI__ !== 'undefined' &&
        typeof (window as any).__TAURI__.core?.invoke !== 'undefined' &&
        typeof (window as any).__TAURI__.event?.listen !== 'undefined'
      )
    },
    { timeout }
  )
}

/**
 * K7>2 Tauri :><0=4K G5@57 invoke
 */
export async function invokeTauriCommand<T = any>(
  page: Page,
  command: string,
  args?: Record<string, any>
): Promise<T> {
  return page.evaluate(
    async ({ cmd, cmdArgs }) => {
      return (window as any).__TAURI__.core.invoke(cmd, cmdArgs)
    },
    { cmd: command, cmdArgs: args }
  )
}

/**
 * @>25@:0 4>ABC?=>AB8 Tauri API
 */
export async function isTauriAvailable(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return typeof (window as any).__TAURI__ !== 'undefined'
  })
}
