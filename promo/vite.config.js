import mdx from "@mdx-js/rollup"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import { visualizer } from "rollup-plugin-visualizer"
import compression from "vite-plugin-compression"
import { fixImports } from "./vite-plugin-fix-imports.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    fixImports(),
    mdx(),
    react(),
    // Brotli compression для максимального сжатия
    compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024, // Только файлы > 1KB
    }),
    // Gzip compression для совместимости
    compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
    }),
    // Bundle analyzer (генерируется только в production build)
    visualizer({
      filename: "dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  base: "", // Пустая строка для относительных путей
  assetsInclude: ["**/*.md"],
  define: {
    global: "globalThis",
    "process.env": {},
    "process.platform": JSON.stringify("browser"),
    "process.version": JSON.stringify("v18.0.0"),
  },
  resolve: {
    alias: {
      buffer: "buffer",
      // Убеждаемся, что используется одна версия React
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "buffer",
      "use-sync-external-store/shim/with-selector",
      "gray-matter",
      "js-yaml",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      // Используем esbuild для gray-matter вместо Terser
      minify: false,
    },
  },
  build: {
    // Оптимизация размера бандла
    rollupOptions: {
      output: {
        // Улучшенная стратегия разделения кода
        manualChunks: (id) => {
          // React core - критически важен
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react"
          }
          // Router отдельно
          if (id.includes("node_modules/react-router-dom")) {
            return "router"
          }
          // Framer Motion - анимации
          if (id.includes("node_modules/framer-motion")) {
            return "framer"
          }
          // gray-matter и js-yaml отдельно (не минифицируются агрессивно)
          if (id.includes("node_modules/gray-matter") || id.includes("node_modules/js-yaml")) {
            return "yaml-parser"
          }
          // Markdown и контент
          if (id.includes("node_modules/react-markdown") || id.includes("node_modules/remark")) {
            return "markdown"
          }
          // Остальные vendor библиотеки
          if (id.includes("node_modules")) {
            return "vendor"
          }
        },
        // Настройка имен файлов с хешами для кеширования
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    // Минификация
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info"],
        passes: 2, // Два прохода для лучшего сжатия
      },
      format: {
        comments: false, // Убираем комментарии
      },
      mangle: {
        // Не минифицировать имена свойств для gray-matter/js-yaml
        properties: false,
        // Сохраняем критические имена функций и свойств для gray-matter/js-yaml
        reserved: [
          "isNothing",
          "Type",
          "Schema",
          "DEFAULT_SCHEMA",
          "YAML_NODE",
          "extend",
          "compile",
          "load",
          "loadAll",
        ],
      },
    },
    // Генерация source maps только для продакшена при необходимости
    sourcemap: false,
    // Оптимизация CSS - отключаем разделение для уменьшения блокирующих запросов
    cssCodeSplit: false,
    // Увеличиваем лимит для chunk size warning
    chunkSizeWarningLimit: 1000,
    // Оптимизация target для современных браузеров
    target: "es2020",
    // Ассеты inline если меньше 4KB
    assetsInlineLimit: 4096,
  },
  // Оптимизация для сервера разработки
  server: {
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx"],
    },
  },
})
