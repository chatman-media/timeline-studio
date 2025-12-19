import { Buffer } from "buffer";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ScrollToTop } from "./components/ScrollToTop";
import { LanguageProvider } from "./contexts/LanguageContext";

// Полифилл Buffer для браузера
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

// Lazy load all route components except the main page
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Changelog = lazy(() => import("./pages/Changelog"));
const Docs = lazy(() => import("./pages/Docs"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Investors = lazy(() => import("./pages/Investors"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Project = lazy(() => import("./pages/Project"));
const ResponsibleAI = lazy(() => import("./pages/ResponsibleAI"));
const Terms = lazy(() => import("./pages/Terms"));

// Loading component
const LoadingFallback = () => (
  <div
    className="min-h-screen bg-[#12192C] flex items-center justify-center"
    data-oid="8e4.u68"
  >
    <div
      className="w-12 h-12 border-3 border-gray-700 border-t-purple-500 rounded-full animate-spin"
      data-oid="s2krzdh"
    />
  </div>
);

// Регистрация Service Worker для кэширования
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => console.log("SW registered:", registration))
      .catch((error) => console.log("SW registration failed:", error));
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode data-oid="dtcg4z1">
    <ErrorBoundary data-oid="jv881-r">
      <LanguageProvider data-oid="nlo4.2n">
        <HashRouter data-oid="nf5-x0.">
          <ScrollToTop data-oid="i_l6u:-" />
          <Suspense
            fallback={<LoadingFallback data-oid="p:z-xv8" />}
            data-oid="b.70t2f"
          >
            <Routes data-oid="el8pp.g">
              <Route
                path="/"
                element={<App data-oid="izg:30g" />}
                data-oid="lz63m9f"
              />
              <Route
                path="/about"
                element={<About data-oid="jcz2-5v" />}
                data-oid="elysr:k"
              />
              <Route
                path="/pricing"
                element={<Pricing data-oid="_sapuai" />}
                data-oid=".8cq-8h"
              />
              <Route
                path="/project"
                element={<Project data-oid="gqf91j7" />}
                data-oid="jkkxzlg"
              />
              <Route
                path="/changelog"
                element={<Changelog data-oid="4.ph8g5" />}
                data-oid="f63wwre"
              />
              <Route
                path="/blog"
                element={<Blog data-oid="frfth.a" />}
                data-oid="8186rzm"
              />
              <Route
                path="/blog/:slug"
                element={<BlogPost data-oid=".udm2ag" />}
                data-oid="stp5vb6"
              />
              <Route
                path="/terms"
                element={<Terms data-oid="cewj_qk" />}
                data-oid="n8nm8:_"
              />
              <Route
                path="/privacy"
                element={<Privacy data-oid="qwdib70" />}
                data-oid="4tye-ll"
              />
              <Route
                path="/responsible-ai"
                element={<ResponsibleAI data-oid="2we_i6z" />}
                data-oid="eey6gve"
              />
              <Route
                path="/faq"
                element={<FAQ data-oid="te8.kl3" />}
                data-oid="m0hpjo6"
              />
              <Route
                path="/docs"
                element={<Docs data-oid="bbzo_uj" />}
                data-oid="2a1s1:u"
              />
              <Route
                path="/investors"
                element={<Investors data-oid="oqpfiw1" />}
                data-oid="gsi8ecz"
              />
            </Routes>
          </Suspense>
        </HashRouter>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);
