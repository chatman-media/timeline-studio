import path from "node:path";
import { codecovVitePlugin } from "@codecov/vite-plugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Codecov bundle analysis plugin
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "timeline-studio",
      uploadToken: process.env.CODECOV_TOKEN,
      gitService: "github",
      ...(process.env.CI && {
        uploadOverrides: {
          // Override the commit SHA if needed
          sha: process.env.GITHUB_SHA,
          // Override the branch name if needed
          branch: process.env.GITHUB_REF_NAME?.replace("refs/heads/", ""),
          // Add PR number if available
          pr: process.env.GITHUB_PR_NUMBER,
          // Add build ID
          build: process.env.GITHUB_RUN_ID,
        },
      }),
    }),
  ],
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
    },
  },
  build: {
    // Generate source maps for bundle analysis
    sourcemap: true,
    // Report compressed size of modules
    reportCompressedSize: true,
    // Rollup options for better bundle analysis
    rollupOptions: {
      output: {
        // Manual chunks for better code splitting analysis
        manualChunks: {
          // React and related libraries
          react: ["react", "react-dom"],
          // State management
          state: ["xstate", "@xstate/react"],
          // UI components
          ui: [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
          ],
          // Tauri APIs
          tauri: [
            "@tauri-apps/api",
            "@tauri-apps/plugin-fs",
            "@tauri-apps/plugin-dialog",
            "@tauri-apps/plugin-store",
            "@tauri-apps/plugin-global-shortcut",
            "@tauri-apps/plugin-log",
            "@tauri-apps/plugin-notification",
            "@tauri-apps/plugin-opener",
            "@tauri-apps/plugin-websocket",
            "@tauri-apps/plugin-window",
          ],
          // Utilities
          utils: ["dayjs", "clsx", "tailwind-merge"],
          // Media processing
          media: ["wavesurfer.js", "d3", "d3-scale"],
        },
      },
    },
  },
});
