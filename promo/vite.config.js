import mdx from "@mdx-js/rollup"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import { visualizer } from "rollup-plugin-visualizer"
import compression from "vite-plugin-compression"
import { fixImports } from "./vite-plugin-fix-imports.js"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    fixImports(),
    mdx(),
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "content/blog",
          dest: "content"
        }
      ]
    }),
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
  },
  resolve: {
    alias: {
      buffer: "buffer",
      // Убеждаемся, что используется одна версия React
      react: "react",
      "react-dom": "react-dom",
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["buffer", "use-sync-external-store/shim/with-selector"],
    // Исключаем тяжелые библиотеки из предварительной оптимизации
    exclude: ["@react-three/fiber", "@react-three/drei", "three"],
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
          // Three.js и 3D библиотеки - тяжелые, загружаются только на /logo3d
          if (
            id.includes("node_modules/three") ||
            id.includes("node_modules/@react-three/fiber") ||
            id.includes("node_modules/@react-three/drei")
          ) {
            return "three"
          }
          // Framer Motion - анимации
          if (id.includes("node_modules/framer-motion")) {
            return "framer"
          }
          // Markdown и контент
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark") ||
            id.includes("node_modules/gray-matter")
          ) {
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
