import path from "node:path"
import { codecovVitePlugin } from "@codecov/vite-plugin"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [
    react(),
    // Put the Codecov vite plugin after all other plugins
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "timeline-studio",
      uploadToken: process.env.CODECOV_TOKEN,
      gitService: "github",
      telemetry: false,
      ...(process.env.CI && {
        uploadOverrides: {
          sha: process.env.GITHUB_SHA,
          branch: process.env.GITHUB_REF_NAME?.replace("refs/heads/", ""),
          pr: process.env.GITHUB_PR_NUMBER,
          build: process.env.GITHUB_RUN_ID,
        },
      }),
    }),
  ],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**/*", "node_modules/**/*"],
    testTimeout: 10000,
    // Быстрая параллельная конфигурация с threads pool
    pool: "threads",
    // @ts-expect-error - poolOptions is valid in Vitest 4.x but types are not yet updated
    poolOptions: {
      threads: {
        // Ограничиваем количество воркеров для предотвращения утечки памяти
        maxThreads: 4,
        minThreads: 1,
      },
    },
    // Включаем параллельное выполнение для скорости
    fileParallelism: true,
    isolate: true,
    environmentOptions: {
      jsdom: {
        url: "http://localhost",
      },
    },
    reporters: ["default", "junit"],
    outputFile: {
      junit: "./test-results/junit.xml",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "src/test/**",
        "dist/**",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "**/vite-env.d.ts",
        "**/*.test.{ts,tsx}",
        "**/__mocks__/**",
        "**/__tests__/**",
        "**/mocks/**",
        "src/components/ui/**", // Исключаем UI компоненты из проверки покрытия
        "src/features/media-studio/services/tauri-mock-provider.tsx", // Mock provider for non-Tauri environments
        "src/features/color-grading/components/scopes/histogram-scope.tsx", // Низкоуровневый компонент анализа данных
        "src/features/color-grading/components/scopes/vectorscope-scope.tsx", // Низкоуровневый компонент анализа данных
        "src/features/color-grading/components/scopes/waveform-scope.tsx", // Низкоуровневый компонент анализа данных
        "src/features/color-grading/components/scopes/scope-viewer.tsx", // Координатор отображения скопов
        "**/testing/**", // Исключаем тестовые утилиты и моки из покрытия
      ],
      include: ["src/**/*.{ts,tsx}"],
      reportsDirectory: "./coverage",
      skipFull: true,
      clean: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@features": path.resolve(__dirname, "./src/features"),
      // Mock Tauri dependencies during testing
      "@tauri-apps/plugin-os": path.resolve(__dirname, "./src/test/mocks/tauri/plugins/os.ts"),
      "@tauri-apps/api/app": path.resolve(__dirname, "./src/test/mocks/tauri/api/app.ts"),
      "@tauri-apps/api/core": path.resolve(__dirname, "./src/test/mocks/tauri/core.ts"),
      "@tauri-apps/api/path": path.resolve(__dirname, "./src/test/mocks/tauri/path.ts"),
      "@tauri-apps/api/event": path.resolve(__dirname, "./src/test/mocks/tauri/event.ts"),
      "@tauri-apps/plugin-fs": path.resolve(__dirname, "./src/test/mocks/tauri/fs.ts"),
      "@tauri-apps/plugin-dialog": path.resolve(__dirname, "./src/test/mocks/tauri/dialog.ts"),
      "@tauri-apps/plugin-store": path.resolve(__dirname, "./src/test/mocks/tauri/store.ts"),
    },
  },
})
