import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";
import { useLanguage } from "../contexts/LanguageContext";

export const Project: React.FC = () => {
  const { language, t } = useLanguage();
  const [markdownContent, setMarkdownContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("business");

  // Определяем вкладки
  const tabs = [
    {
      id: "overview",
      title: language === "ru" ? "Обзор" : "Overview",
      path: "README.md",
    },
    {
      id: "business",
      title: language === "ru" ? "Бизнес-план" : "Business Plan",
      path: "business-plan.md",
    },
    {
      id: "investment",
      title: language === "ru" ? "Инвестиции" : "Investment",
      path: "investment-valuation.md",
    },
  ];

  // Определяем путь к документу в зависимости от языка и активной вкладки
  const currentTab = tabs.find((tab) => tab.id === activeTab);
  const manifestPath =
    language === "ru"
      ? `/content/docs/ru/00_project_manifest/${currentTab?.path}`
      : language === "zh"
        ? `/content/docs/zh/00_project_manifest/${currentTab?.path}`
        : `/content/docs/en/00_project_manifest/${currentTab?.path}`;

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        setLoading(true);
        console.log("Fetching markdown from:", manifestPath);
        const response = await fetch(manifestPath);
        console.log("Response status:", response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        console.log("Markdown loaded, length:", text.length);
        setMarkdownContent(text);
      } catch (error) {
        console.error("Error loading markdown:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setMarkdownContent(
          `# Ошибка загрузки\n\nНе удалось загрузить документ.\n\nОшибка: ${errorMessage}`,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [manifestPath, activeTab]);

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="vqrgy.p">
      <SEO
        title="Project"
        description="Timeline Studio project overview. Business model, roadmap, and technical documentation."
        url="/project"
        data-oid="5:7z.ie"
      />

      <Navigation data-oid="mo1onax" />

      <main className="flex-1" data-oid="vt7497g">
        {/* Hero Banner */}
        <section
          className="relative pt-32 pb-20 overflow-hidden"
          data-oid="w_qrm8p"
        >
          {/* Background */}
          <div className="absolute inset-0 hero-gradient" data-oid="-abl1f3" />

          <div
            className="relative container mx-auto px-10 md:px-16 lg:px-24"
            data-oid="wkg2oam"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
              data-oid="x3svpy1"
            >
              <h1 className="page-title" data-oid="a:67._6">
                <span className="text-gradient" data-oid="ri-_5q6">
                  {language === "ru"
                    ? "Проектная документация"
                    : "Project Documentation"}
                </span>
              </h1>
              <p
                className="text-xl md:text-2xl text-gray-300 mb-8"
                data-oid="a9zmyps"
              >
                {language === "ru"
                  ? "Полная документация Timeline Studio - революционного AI-видеоредактора"
                  : "Complete Timeline Studio documentation - revolutionary AI video editor"}
              </p>
              <div
                className="flex items-center justify-center space-x-4 text-gray-400 mb-8"
                data-oid="dl48u05"
              >
                <span data-oid="6aillug">Open Source</span>
                <span data-oid="zu_1yy-">•</span>
                <span data-oid="6-8qhel">
                  {language === "ru" ? "Локальный AI" : "Local AI"}
                </span>
                <span data-oid="9ak9o26">•</span>
                <span data-oid="o3jhvrs">
                  {language === "ru" ? "100+ AI инструментов" : "100+ AI tools"}
                </span>
              </div>

              {/* Investor CTA */}
              <Link
                to="/investors"
                className="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 backdrop-blur-sm rounded-full border border-green-500/30 transition-all"
                data-oid="jssns34"
              >
                <span className="relative flex h-3 w-3" data-oid="2o2xme2">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                    data-oid=":608bp1"
                  ></span>
                  <span
                    className="relative inline-flex rounded-full h-3 w-3 bg-green-500"
                    data-oid="n197y10"
                  ></span>
                </span>
                <span className="text-green-300 font-medium" data-oid="i6:bgn9">
                  {language === "ru"
                    ? "Ищем инвестиции: $1M Seed Round"
                    : "Raising: $1M Seed Round"}
                </span>
                <svg
                  className="w-4 h-4 text-green-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  data-oid="w9_jfj2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                    data-oid="-x_10lb"
                  />
                </svg>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Tabs */}
        <section className="py-8" data-oid="no209fl">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="-fy3dxf"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap justify-center gap-2 mb-8"
              data-oid="_vd37vr"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[#8b5cf6] text-white shadow-lg"
                      : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`}
                  data-oid="abm43_9"
                >
                  {tab.title}
                </button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Manifest Content */}
        <section className="py-20" data-oid="j.fw.ys">
          <div
            className="w-full px-2 md:px-4 lg:px-8 xl:px-12"
            data-oid="outs496"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="w-full"
              data-oid="vwla6g9"
            >
              <div
                className="relative overflow-hidden rounded-2xl"
                data-oid="8l9siz:"
              >
                {/* Glassmorphism background */}
                <div
                  className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                  data-oid="ltb2f4z"
                />
                <div
                  className="absolute inset-0 bg-white/2"
                  data-oid="zyfyri_"
                />

                {/* Border gradient */}
                <div
                  className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                  data-oid="mxa8p94"
                >
                  <div
                    className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                    data-oid="mdyrqqi"
                  />
                </div>

                {/* Content */}
                <div
                  className="relative p-6 md:p-8 lg:p-12 xl:p-16"
                  data-oid="kr-93xd"
                >
                  {loading ? (
                    <div
                      className="flex items-center justify-center py-20"
                      data-oid="i7okct1"
                    >
                      <div
                        className="w-12 h-12 border-3 border-gray-700 border-t-purple-500 rounded-full animate-spin"
                        data-oid="5iuc-h7"
                      />
                    </div>
                  ) : (
                    <div
                      className="prose-invert prose-lg max-w-none"
                      data-oid="wl:bzli"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1
                              className="text-4xl md:text-5xl font-light mb-8 text-gradient"
                              data-oid="uz9y2qx"
                            >
                              {children}
                            </h1>
                          ),

                          h2: ({ children }) => (
                            <h2
                              className="text-3xl md:text-4xl font-light mb-6 text-white mt-12"
                              data-oid="31fmmio"
                            >
                              {children}
                            </h2>
                          ),

                          h3: ({ children }) => (
                            <h3
                              className="text-2xl md:text-3xl font-light mb-4 text-white mt-8"
                              data-oid="cr9b9bm"
                            >
                              {children}
                            </h3>
                          ),

                          h4: ({ children }) => (
                            <h4
                              className="text-xl md:text-2xl font-light mb-3 text-gray-200 mt-6"
                              data-oid="jw--cuy"
                            >
                              {children}
                            </h4>
                          ),

                          p: ({ children }) => (
                            <p
                              className="text-sm text-gray-300 mb-4 leading-relaxed font-light"
                              data-oid="rm97ucv"
                            >
                              {children}
                            </p>
                          ),

                          ul: ({ children }) => (
                            <ul
                              className="text-sm text-gray-300 mb-4 space-y-2 list-disc list-inside font-light"
                              data-oid="1eg.4ej"
                            >
                              {children}
                            </ul>
                          ),

                          ol: ({ children }) => (
                            <ol
                              className="text-sm text-gray-300 mb-4 space-y-2 list-decimal list-inside font-light"
                              data-oid="767rttf"
                            >
                              {children}
                            </ol>
                          ),

                          li: ({ children }) => (
                            <li
                              className="text-sm text-gray-300 font-light"
                              data-oid="k8xf7jf"
                            >
                              {children}
                            </li>
                          ),

                          strong: ({ children }) => (
                            <strong
                              className="text-white font-medium"
                              data-oid="e1d1_hc"
                            >
                              {children}
                            </strong>
                          ),

                          code: ({ children }) => (
                            <code
                              className="bg-gray-800 text-purple-300 px-2 py-1 rounded text-sm font-normal"
                              data-oid="qn8w11v"
                            >
                              {children}
                            </code>
                          ),

                          pre: ({ children }) => (
                            <pre
                              className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4"
                              data-oid="h4ti.k5"
                            >
                              {children}
                            </pre>
                          ),

                          blockquote: ({ children }) => (
                            <blockquote
                              className="border-l-4 border-purple-500 pl-4 italic text-gray-400 mb-4"
                              data-oid="7qlatri"
                            >
                              {children}
                            </blockquote>
                          ),

                          a: ({ href, children }) => (
                            <a
                              href={href}
                              className="text-blue-400 hover:text-blue-300 transition-colors underline"
                              target="_blank"
                              rel="noopener noreferrer"
                              data-oid=".mtt72n"
                            >
                              {children}
                            </a>
                          ),

                          table: ({ children }) => (
                            <div
                              className="my-8 overflow-x-auto"
                              data-oid="jo-2v2:"
                            >
                              <table
                                className="w-full border-collapse"
                                data-oid="g:js-1v"
                              >
                                {children}
                              </table>
                            </div>
                          ),

                          thead: ({ children }) => (
                            <thead
                              className="bg-linear-to-r from-purple-500/20 to-blue-500/20"
                              data-oid="s.g303l"
                            >
                              {children}
                            </thead>
                          ),

                          tbody: ({ children }) => (
                            <tbody
                              className="divide-y divide-gray-700"
                              data-oid="1cgowzs"
                            >
                              {children}
                            </tbody>
                          ),

                          tr: ({ children }) => (
                            <tr
                              className="hover:bg-white/5 transition-colors"
                              data-oid="5z2tlq1"
                            >
                              {children}
                            </tr>
                          ),

                          th: ({ children }) => (
                            <th
                              className="px-4 py-3 text-left text-sm font-medium text-white border-b-2 border-purple-500/50"
                              data-oid="wvn:zsa"
                            >
                              {children}
                            </th>
                          ),

                          td: ({ children }) => (
                            <td
                              className="px-4 py-3 text-sm text-gray-300 font-light"
                              data-oid="_g60a.f"
                            >
                              {children}
                            </td>
                          ),
                        }}
                        data-oid="hj4myhb"
                      >
                        {markdownContent}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer data-oid="m0.n4tp" />
    </div>
  );
};

export default Project;
