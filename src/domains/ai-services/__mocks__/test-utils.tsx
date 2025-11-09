/**
 * Test Utilities for AI Services Domain
 *
 * Вспомогательные функции и компоненты для тестирования AI Services
 */

import { render, type RenderOptions } from "@testing-library/react"
import type { ReactElement } from "react"
import { AIServicesDomainProvider } from "../providers/ai-services-domain-provider"

/**
 * Custom render для компонентов, использующих AI Services Domain
 */
export function renderWithAIServices(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <AIServicesDomainProvider>{children}</AIServicesDomainProvider>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

/**
 * Создать mock события для Tauri
 */
export function createMockTauriEvent<T = any>(eventName: string, payload: T) {
  return {
    event: eventName,
    windowLabel: "main",
    payload,
    id: Math.random(),
  }
}

/**
 * Симуляция прогресса анализа
 */
export function simulateAnalysisProgress(
  onProgress: (stage: string, progress: number, message: string) => void,
  stages: Array<{ stage: string; progress: number; message: string; delay: number }>,
) {
  let currentStage = 0

  const progressInterval = setInterval(() => {
    if (currentStage >= stages.length) {
      clearInterval(progressInterval)
      return
    }

    const { stage, progress, message } = stages[currentStage]
    onProgress(stage, progress, message)
    currentStage++
  }, stages[currentStage]?.delay || 100)

  return () => clearInterval(progressInterval)
}

/**
 * Симуляция ошибки анализа
 */
export function simulateAnalysisError(errorMessage: string) {
  return new Error(`Analysis failed: ${errorMessage}`)
}

/**
 * Mock для Backend Sync
 */
export const mockBackendSync = {
  connected: true,
  executeCommand: vi.fn().mockResolvedValue({ success: true, data: {} }),
  onStateChange: vi.fn((callback: any) => {
    // Вызываем callback с mock состоянием
    callback({
      ai_services_config: {
        chatEnabled: true,
        intelligenceEnabled: true,
        montagePlannerEnabled: true,
        recognitionEnabled: true,
      },
    })
    return vi.fn() // unsubscribe function
  }),
  onEvent: vi.fn(() => vi.fn()), // unsubscribe function
}

/**
 * Mock данные для тестов
 */
export const mockTestData = {
  videoPath: "/test/videos/sample.mp4",
  videoPaths: ["/test/videos/video1.mp4", "/test/videos/video2.mp4", "/test/videos/video3.mp4"],
  chatMessage: "Hello, AI assistant!",
  aiResponse: "Hello! How can I help you today?",
}

/**
 * Создать mock XState snapshot
 */
export function createMockSnapshot<TContext>(context: TContext, value: string = "idle") {
  return {
    value,
    context,
    matches: (state: string) => value === state,
    hasTag: () => false,
    can: () => false,
    getMeta: () => ({}),
    toJSON: () => ({ value, context }),
  }
}

/**
 * Ожидание выполнения промиса в тесте
 */
export async function waitForPromise() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

/**
 * Ожидание определенного времени
 */
export async function waitForTime(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
