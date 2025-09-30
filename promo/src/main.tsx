import { Buffer } from "buffer"
import { lazy, StrictMode, Suspense } from "react"
import { createRoot } from "react-dom/client"
import { HashRouter, Route, Routes } from "react-router-dom"
import "./index.css"
import App from "./App"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ScrollToTop } from "./components/ScrollToTop"
import { LanguageProvider } from "./contexts/LanguageContext"

// Полифилл Buffer для браузера
if (typeof window !== "undefined") {
  window.Buffer = Buffer
}

// Lazy load all route components except the main page
const About = lazy(() => import("./pages/About"))
const Blog = lazy(() => import("./pages/Blog"))
const BlogPost = lazy(() => import("./pages/BlogPost"))
const Changelog = lazy(() => import("./pages/Changelog"))
const Docs = lazy(() => import("./pages/Docs"))
const FAQ = lazy(() => import("./pages/FAQ"))
const Logo3D = lazy(() => import("./pages/Logo3D"))
const Pricing = lazy(() => import("./pages/Pricing"))
const Privacy = lazy(() => import("./pages/Privacy"))
const ResponsibleAI = lazy(() => import("./pages/ResponsibleAI"))
const Terms = lazy(() => import("./pages/Terms"))

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen bg-[#12192C] flex items-center justify-center">
    <div className="w-12 h-12 border-3 border-gray-700 border-t-purple-500 rounded-full animate-spin" />
  </div>
)

// Регистрация Service Worker для кэширования
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => console.log("SW registered:", registration))
      .catch((error) => console.log("SW registration failed:", error))
  })
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <HashRouter>
          <ScrollToTop />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/about" element={<About />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/changelog" element={<Changelog />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/responsible-ai" element={<ResponsibleAI />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/logo3d" element={<Logo3D />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
)
