import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// During local dev, proxy `/trpc` to the gateway (src-node) so the Mini App and
// API share an origin (matching production where they sit behind one host).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/trpc": {
        target: process.env.GATEWAY_ORIGIN ?? "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
