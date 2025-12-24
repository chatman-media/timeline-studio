/**
 * Test setup and global configuration
 */

import { afterEach, beforeEach } from "bun:test"

// Global test setup
beforeEach(() => {
  // Clear any test data before each test
})

afterEach(() => {
  // Cleanup after each test
})

// Mock environment variables for testing
process.env.PORT = "3001"
process.env.HOST = "localhost"
process.env.FFMPEG_PATH = "ffmpeg"
process.env.FFPROBE_PATH = "ffprobe"
process.env.CACHE_DIR = "/tmp/timeline-studio-test"
process.env.CACHE_SIZE = "100"
process.env.MAX_CONCURRENT_WORKERS = "2"
process.env.LOG_LEVEL = "error"
process.env.CORS_ORIGIN = "http://localhost:3000"
