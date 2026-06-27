import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App"
import { getWebApp } from "./telegram"
import "./styles.css"

// Tell Telegram the Mini App is ready and use the full viewport.
const webApp = getWebApp()
webApp?.ready()
webApp?.expand()

const container = document.getElementById("root")
if (!container) throw new Error("Missing #root element")

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
