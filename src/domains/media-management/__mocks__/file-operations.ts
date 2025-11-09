/**
 * Mock File Operations
 *
 * Тестовые данные для файловых операций
 */

import type { MediaFileOperation } from "../types"

export const createMockOperation = (
  overrides?: Partial<MediaFileOperation>,
): MediaFileOperation => ({
  id: `op-${Date.now()}`,
  type: "import",
  status: "pending",
  progress: 0,
  ...overrides,
})

export const mockImportOperation: MediaFileOperation = {
  id: "import-1",
  type: "import",
  status: "processing",
  progress: 45,
}

export const mockCompletedOperation: MediaFileOperation = {
  id: "import-2",
  type: "import",
  status: "completed",
  progress: 100,
  result: {
    path: "/project/media/video.mp4",
    thumbnailPath: "/project/cache/video-thumb.jpg",
  },
}

export const mockFailedOperation: MediaFileOperation = {
  id: "import-3",
  type: "import",
  status: "failed",
  progress: 25,
  error: "File not found",
}

export const mockExportOperation: MediaFileOperation = {
  id: "export-1",
  type: "export",
  status: "processing",
  progress: 60,
}

export const mockConvertOperation: MediaFileOperation = {
  id: "convert-1",
  type: "convert",
  status: "pending",
  progress: 0,
}

export const mockOperationSet: MediaFileOperation[] = [
  mockImportOperation,
  mockCompletedOperation,
  mockFailedOperation,
  mockExportOperation,
  mockConvertOperation,
]
