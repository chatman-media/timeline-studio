/**
 * Mock для validation утилит в тестах
 * Позволяет тестам работать без реальных файлов
 */

import { vi } from "vitest"

// Экспортируем все оригинальные константы
export * from "../validation"

// Mock функции - они ничего не проверяют в тестах
export const validateFilePath = vi.fn(() => {
  // В тестах всегда проходит валидация
})

export const validateVideoFile = vi.fn(() => {
  // В тестах всегда проходит валидация
})

export const validateAudioFile = vi.fn(() => {
  // В тестах всегда проходит валидация
})

export const validateMediaFile = vi.fn(() => {
  // В тестах всегда проходит валидация
})

export const validateFilePaths = vi.fn((filePaths: string[]) => {
  // В тестах все файлы валидны
  return filePaths.map((path) => ({ path, valid: true }))
})

export const sanitizeTextInput = vi.fn((input: string) => {
  // В тестах просто возвращаем как есть
  return input
})

export const validateAIMessages = vi.fn(() => {
  // В тестах всегда проходит валидация
})

export const validateBatchSize = vi.fn(() => {
  // В тестах всегда проходит валидация
})

export const validateVideoBatch = vi.fn((videoPaths: string[]) => {
  // В тестах все файлы валидны
  return {
    valid: videoPaths,
    invalid: [],
  }
})
