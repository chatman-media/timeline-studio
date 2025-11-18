import { motion } from "framer-motion"
import type React from "react"
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { useLanguage } from "../contexts/LanguageContext"

export const Project: React.FC = () => {
  const { language, t } = useLanguage()
  const [markdownContent, setMarkdownContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("manifest")

  // Определяем вкладки
  const tabs = [
    {
      id: "manifest",
      title: language === "ru" ? "Манифест" : "Manifest",
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
    {
      id: "competitive",
      title: language === "ru" ? "Конкуренты" : "Competitive",
      path: "competitive-analysis.md",
    },
  ]

  // Определяем путь к документу в зависимости от языка и активной вкладки
  const currentTab = tabs.find((tab) => tab.id === activeTab)
  const manifestPath =
    language === "ru"
      ? `/content/docs/ru/00_project_manifest/${currentTab?.path}`
      : language === "zh"
        ? `/content/docs/zh/00_project_manifest/${currentTab?.path}`
        : `/content/docs/en/00_project_manifest/${currentTab?.path}`

  useEffect(() => {
    const fetchMarkdown = async () => {
      try {
        setLoading(true)
        console.log("Fetching markdown from:", manifestPath)
        const response = await fetch(manifestPath)
        console.log("Response status:", response.status)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const text = await response.text()
        console.log("Markdown loaded, length:", text.length)
        setMarkdownContent(text)
      } catch (error) {
        console.error("Error loading markdown:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        setMarkdownContent(`# Ошибка загрузки\n\nНе удалось загрузить документ.\n\nОшибка: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMarkdown()
  }, [manifestPath, activeTab])

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 hero-gradient" />

          <div className="relative container mx-auto px-10 md:px-16 lg:px-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="page-title">
                <span className="text-gradient">
                  {language === "ru" ? "Проектная документация" : "Project Documentation"}
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                {language === "ru"
                  ? "Полная документация Timeline Studio - революционного AI-видеоредактора"
                  : "Complete Timeline Studio documentation - revolutionary AI video editor"}
              </p>
              <div className="flex items-center justify-center space-x-4 text-gray-400">
                <span>{language === "ru" ? "Версия 3.13" : "Version 3.13"}</span>
                <span>•</span>
                <span>{language === "ru" ? "95% готовности" : "95% ready"}</span>
                <span>•</span>
                <span>{language === "ru" ? "100+ AI инструментов" : "100+ AI tools"}</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tabs */}
        <section className="py-8">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap justify-center gap-2 mb-8"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                      : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`}
                >
                  {tab.title}
                </button>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Manifest Content */}
        <section className="py-20">
          <div className="w-full px-2 md:px-4 lg:px-8 xl:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="w-full"
            >
              <div className="relative overflow-hidden rounded-2xl">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />

                {/* Border gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative p-6 md:p-8 lg:p-12 xl:p-16">
                  {loading ? (
                    <div className="flex items-center justify-center py-20">
                      <div className="w-12 h-12 border-3 border-gray-700 border-t-purple-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="prose-invert prose-lg max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => (
                            <h1 className="text-4xl md:text-5xl font-light mb-8 text-gradient">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-3xl md:text-4xl font-light mb-6 text-white mt-12">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-2xl md:text-3xl font-light mb-4 text-white mt-8">{children}</h3>
                          ),
                          h4: ({ children }) => (
                            <h4 className="text-xl md:text-2xl font-light mb-3 text-gray-200 mt-6">{children}</h4>
                          ),
                          p: ({ children }) => (
                            <p className="text-sm text-gray-300 mb-4 leading-relaxed font-light">{children}</p>
                          ),
                          ul: ({ children }) => (
                            <ul className="text-sm text-gray-300 mb-4 space-y-2 list-disc list-inside font-light">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="text-sm text-gray-300 mb-4 space-y-2 list-decimal list-inside font-light">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => <li className="text-sm text-gray-300 font-light">{children}</li>,
                          strong: ({ children }) => <strong className="text-white font-medium">{children}</strong>,
                          code: ({ children }) => (
                            <code className="bg-gray-800 text-purple-300 px-2 py-1 rounded text-sm font-normal">
                              {children}
                            </code>
                          ),
                          pre: ({ children }) => (
                            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-purple-500 pl-4 italic text-gray-400 mb-4">
                              {children}
                            </blockquote>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              className="text-blue-400 hover:text-blue-300 transition-colors underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {children}
                            </a>
                          ),
                          table: ({ children }) => (
                            <div className="my-8 overflow-x-auto">
                              <table className="w-full border-collapse">{children}</table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                              {children}
                            </thead>
                          ),
                          tbody: ({ children }) => <tbody className="divide-y divide-gray-700">{children}</tbody>,
                          tr: ({ children }) => (
                            <tr className="hover:bg-white/5 transition-colors">{children}</tr>
                          ),
                          th: ({ children }) => (
                            <th className="px-4 py-3 text-left text-sm font-medium text-white border-b-2 border-purple-500/50">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-4 py-3 text-sm text-gray-300 font-light">{children}</td>
                          ),
                        }}
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

      <Footer />
    </div>
  )
}

export default Project
