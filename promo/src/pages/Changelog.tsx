import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { useTranslation } from "../hooks/useTranslation";
import { parseChangelog } from "../utils/parseChangelog";

// Format changelog item text with proper markdown link parsing
function formatChangelogItem(text: string): React.ReactNode {
  // Parse markdown links [text](url)
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);

  return parts.map((part, index) => {
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const [, linkText, url] = linkMatch;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 underline"
        >
          {linkText}
        </a>
      );
    }

    // Parse bold text **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((boldPart, boldIndex) => {
      if (boldPart.startsWith("**") && boldPart.endsWith("**")) {
        return (
          <strong key={`${index}-${boldIndex}`}>{boldPart.slice(2, -2)}</strong>
        );
      }
      return <span key={`${index}-${boldIndex}`}>{boldPart}</span>;
    });
  });
}

interface VersionData {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
  improvements: string[];
  breaking?: string[];
}

// Default versions for fallback
const defaultVersions: VersionData[] = [
  {
    version: "0.51.0",
    date: "2025-01-30",
    features: [
      "Централизованное управление версией приложения",
      "Оптимизация для GitHub Pages",
    ],
    fixes: [
      "Исправлена синхронизация версий между package.json, Cargo.toml и tauri.conf.json",
      "Оптимизирован промо-сайт для GitHub Pages",
    ],
    improvements: [],
  },
  {
    version: "0.50.0",
    date: "2025-01-30",
    features: ["Добавлена ссылка Pricing в навигационное меню промо-сайта"],
    fixes: ["Исправлена ошибка SSR с window is not defined в UpdateService"],
    improvements: [],
  },
  {
    version: "0.49.0",
    date: "2025-01-30",
    features: [
      "Glassmorphism эффект на FAQ странице",
      "Унификация шрифтов на всех страницах промо-сайта",
      "Обновлен дизайн страницы Changelog с glassmorphism эффектом",
    ],
    fixes: [],
    improvements: ["Улучшен общий дизайн промо-сайта"],
  },
];

export const Changelog: React.FC = () => {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<VersionData[]>(defaultVersions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load changelog from markdown file
    fetch("/content/changelog/latest.md")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load changelog");
        return response.text();
      })
      .then((markdown) => {
        const parsed = parseChangelog(markdown);
        if (parsed.length > 0) {
          // Take only the latest 10 versions for performance
          setVersions(parsed.slice(0, 10));
        }
      })
      .catch((error) => {
        console.error("Failed to load changelog:", error);
        // Keep default versions on error
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 hero-gradient opacity-50" />

          <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-6xl mx-auto text-center"
            >
              <h1 className="page-title">
                <span className="text-gradient">{t("changelog.title")}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                {t("changelog.subtitle")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Versions Grid */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="max-w-6xl mx-auto">
              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
                </div>
              ) : (
                <div className="grid gap-6 md:gap-8">
                  {versions.map((version, index) => (
                    <motion.div
                      key={version.version}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="group"
                    >
                      {/* Glass card for each version */}
                      <div className="relative overflow-hidden rounded-2xl">
                        {/* Glassmorphism background */}
                        <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                        <div className="absolute inset-0 bg-white/2" />

                        {/* Border gradient */}
                        <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                          <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                        </div>

                        {/* Content */}
                        <div className="relative p-8 md:p-10">
                          {/* Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                            <div className="flex items-center gap-4 mb-2 sm:mb-0">
                              <h3 className="text-2xl font-medium text-white">
                                v{version.version}
                              </h3>
                              {index === 0 && (
                                <span className="px-3 py-1 text-xs font-semibold bg-linear-to-r from-green-500 to-emerald-500 text-white rounded-full">
                                  {t("changelog.latest")}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400">{version.date}</p>
                          </div>

                          {/* Features */}
                          {version.features.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                                <span className="text-2xl">🚀</span>
                                <span>{t("changelog.newFeatures")}</span>
                              </h4>
                              <ul className="space-y-2">
                                {version.features.map((feature, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-2 text-gray-300"
                                  >
                                    <span className="text-purple-400 mt-1">
                                      •
                                    </span>
                                    <span>{formatChangelogItem(feature)}</span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Bug Fixes */}
                          {version.fixes.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                                <span className="text-2xl">🐛</span>
                                <span>{t("changelog.bugFixes")}</span>
                              </h4>
                              <ul className="space-y-2">
                                {version.fixes.map((fix, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-2 text-gray-300"
                                  >
                                    <span className="text-blue-400 mt-1">
                                      •
                                    </span>
                                    <span>{formatChangelogItem(fix)}</span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Improvements */}
                          {version.improvements.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                                <span className="text-2xl">🔧</span>
                                <span>{t("changelog.improvements")}</span>
                              </h4>
                              <ul className="space-y-2">
                                {version.improvements.map((improvement, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-2 text-gray-300"
                                  >
                                    <span className="text-green-400 mt-1">
                                      •
                                    </span>
                                    <span>
                                      {formatChangelogItem(improvement)}
                                    </span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Breaking Changes */}
                          {version.breaking && version.breaking.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                                <span className="text-2xl">⚠️</span>
                                <span>{t("changelog.breakingChanges")}</span>
                              </h4>
                              <ul className="space-y-2">
                                {version.breaking.map((change, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-2 text-gray-300"
                                  >
                                    <span className="text-red-400 mt-1">•</span>
                                    <span>{formatChangelogItem(change)}</span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Download button */}
                          <div className="mt-8 flex gap-4">
                            <a
                              href={`https://github.com/chatman-media/timeline-studio/releases/tag/v${version.version}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8b5cf6] text-white font-medium rounded-xl hover:bg-[#7c3aed] transition-all duration-300 transform hover:scale-105"
                            >
                              {t("changelog.viewRelease")}
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Load more / View all releases */}
              {!loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="mt-12 text-center"
                >
                  <a
                    href="https://github.com/chatman-media/timeline-studio/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    {t("changelog.viewAllReleases")}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </a>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Changelog;
