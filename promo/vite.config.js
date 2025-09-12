import mdx from "@mdx-js/rollup"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
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
    })
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
        // Упрощенная стратегия разделения кода
        manualChunks: {
          // React должен быть в одном месте
          react: ["react", "react-dom"],
          // Router отдельно
          router: ["react-router-dom"],
          // Остальные большие библиотеки
          vendor: ["framer-motion", "@heroicons/react"],
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
      },
    },
    // Генерация source maps только для продакшена при необходимости
    sourcemap: false,
    // Оптимизация CSS - отключаем разделение для уменьшения блокирующих запросов
    cssCodeSplit: false,
    // Анализ размера бандла (опционально)
    // chunkSizeWarningLimit: 500,
  },
  // Оптимизация для сервера разработки
  server: {
    warmup: {
      clientFiles: ["./src/main.tsx", "./src/App.tsx"],
    },
  },
})
