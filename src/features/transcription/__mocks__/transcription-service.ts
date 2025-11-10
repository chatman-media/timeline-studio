import { vi } from "vitest"
import { createMockModels, createMockTranscriptionResult } from "../__tests__/test-utils"

/**
 * Mock для TranscriptionService
 * Используется в тестах для изоляции зависимостей
 */

export const mockTranscriptionService = {
  transcribeMedia: vi.fn().mockResolvedValue(createMockTranscriptionResult()),
  generateSubtitles: vi
    .fn()
    .mockResolvedValue(
      "1\n00:00:00,000 --> 00:00:05,000\nHello world\n\n2\n00:00:05,000 --> 00:00:10,000\nThis is a test\n",
    ),
  getAvailableModels: vi.fn().mockResolvedValue(createMockModels()),
  downloadModel: vi.fn().mockResolvedValue(true),
  getSupportedLanguages: vi.fn().mockReturnValue([
    { code: "auto", name: "Auto-detect" },
    { code: "en", name: "English" },
    { code: "ru", name: "Russian" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
  ]),
  recommendModel: vi.fn().mockReturnValue("base"),
  getInstance: vi.fn(),
}

// Mock класса TranscriptionService
export class MockTranscriptionService {
  static instance: MockTranscriptionService | null = null

  static getInstance() {
    if (!MockTranscriptionService.instance) {
      MockTranscriptionService.instance = new MockTranscriptionService()
    }
    return MockTranscriptionService.instance
  }

  transcribeMedia = mockTranscriptionService.transcribeMedia
  generateSubtitles = mockTranscriptionService.generateSubtitles
  getAvailableModels = mockTranscriptionService.getAvailableModels
  downloadModel = mockTranscriptionService.downloadModel
  getSupportedLanguages = mockTranscriptionService.getSupportedLanguages
  recommendModel = mockTranscriptionService.recommendModel
}

// Функция для сброса всех моков
export function resetTranscriptionServiceMocks() {
  mockTranscriptionService.transcribeMedia.mockClear()
  mockTranscriptionService.generateSubtitles.mockClear()
  mockTranscriptionService.getAvailableModels.mockClear()
  mockTranscriptionService.downloadModel.mockClear()
  mockTranscriptionService.getSupportedLanguages.mockClear()
  mockTranscriptionService.recommendModel.mockClear()
  MockTranscriptionService.instance = null
}
