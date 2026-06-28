import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// During local dev, proxy `/trpc` to the gateway (src-node) so the Mini App and
// API share an origin (matching production where they sit behind one host).
export default defineConfig({
  plugins: [react()],
  // Use an inline (empty) PostCSS config so vite doesn't walk up to the repo
  // root's Next.js postcss.config.mjs, whose plugins aren't vite-compatible.
  css: { postcss: {} },
  server: {
    // Allow any host so an HTTPS tunnel (cloudflared/ngrok) to Telegram works —
    // the tunnel subdomain is dynamic. Dev-only server.
    allowedHosts: true,
    proxy: {
      "/trpc": {
        target: process.env.GATEWAY_ORIGIN ?? "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
})
