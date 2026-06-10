import path from "node:path"

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: [
      "packages/core/src/services/__tests__/ai-project-editor.test.ts",
      "packages/core/src/services/__tests__/bot-*.test.ts",
      "packages/core/src/services/__tests__/render-job-events.test.ts",
      "src/adapters/node/__tests__/ai-project-editor.test.ts",
      "src/adapters/node/__tests__/bot-*.test.ts",
      "src/adapters/node/__tests__/publish.test.ts",
      "src/adapters/node/__tests__/render-job.test.ts",
      "src/adapters/node/__tests__/rust-*.test.ts",
      "src/adapters/node/__tests__/telegram-*.test.ts",
      "src/cli/commands/__tests__/bot-*.test.ts",
      "src/cli/commands/__tests__/render-job.test.ts",
    ],
    exclude: ["e2e/**/*", "node_modules/**/*"],
    testTimeout: 15_000,
    pool: "threads",
    maxWorkers: 2,
    fileParallelism: true,
    isolate: true,
    reporters: ["default", "junit"],
    outputFile: {
      junit: "./test-results/bot-ai-junit.xml",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@timeline-studio/core": path.resolve(__dirname, "./packages/core/src"),
      "@timeline-studio/domains": path.resolve(__dirname, "./packages/domains/src"),
      "@timeline-studio/adapters": path.resolve(__dirname, "./packages/adapters/src"),
      "@timeline-studio/ui": path.resolve(__dirname, "./packages/ui/src"),
      "@timeline-studio/ui/features": path.resolve(__dirname, "./packages/ui/src/features"),
      "@timeline-studio/ui/components": path.resolve(__dirname, "./packages/ui/src/components"),
      "@tauri-apps/api/app": path.resolve(__dirname, "./src/test/mocks/tauri/api/app.ts"),
      "@tauri-apps/api/core": path.resolve(__dirname, "./src/test/mocks/tauri/core.ts"),
      "@tauri-apps/api/event": path.resolve(__dirname, "./src/test/mocks/tauri/event.ts"),
      "@tauri-apps/api/path": path.resolve(__dirname, "./src/test/mocks/tauri/path.ts"),
      "@tauri-apps/plugin-dialog": path.resolve(__dirname, "./src/test/mocks/tauri/dialog.ts"),
      "@tauri-apps/plugin-fs": path.resolve(__dirname, "./src/test/mocks/tauri/fs.ts"),
      "@tauri-apps/plugin-notification": path.resolve(__dirname, "./src/test/mocks/tauri/plugins/notification.ts"),
      "@tauri-apps/plugin-os": path.resolve(__dirname, "./src/test/mocks/tauri/plugins/os.ts"),
      "@tauri-apps/plugin-store": path.resolve(__dirname, "./src/test/mocks/tauri/store.ts"),
    },
  },
})
