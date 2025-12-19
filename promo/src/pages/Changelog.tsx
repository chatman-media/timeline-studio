import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";
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
          data-oid="e9y7ztk"
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
          <strong key={`${index}-${boldIndex}`} data-oid="8m9stk1">
            {boldPart.slice(2, -2)}
          </strong>
        );
      }
      return (
        <span key={`${index}-${boldIndex}`} data-oid="_cpld.q">
          {boldPart}
        </span>
      );
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
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid=".t9kym7">
      <SEO
        title="Changelog"
        description="Timeline Studio changelog. See what's new in each release, bug fixes, and improvements."
        url="/changelog"
        data-oid="x:g0cyk"
      />

      <Navigation data-oid="raanoj3" />

      <main className="flex-1" data-oid="8gq0zcl">
        {/* Hero Section */}
        <section
          className="relative pt-32 pb-20 overflow-hidden"
          data-oid="rlyp.mq"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 hero-gradient opacity-50"
            data-oid="eo6v0i3"
          />

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="_hutgp:"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-6xl mx-auto text-center"
              data-oid="amx.y:2"
            >
              <h1 className="page-title" data-oid="3t0yadq">
                <span className="text-gradient" data-oid="5agwsz4">
                  {t("changelog.title")}
                </span>
              </h1>
              <p
                className="text-xl md:text-2xl text-gray-300 mb-8"
                data-oid=".f-qftu"
              >
                {t("changelog.subtitle")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Versions Grid */}
        <section className="py-20" data-oid="xm8c9on">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="m0okrfv"
          >
            <div className="max-w-6xl mx-auto" data-oid="hwlfz9m">
              {loading ? (
                <div
                  className="flex justify-center items-center py-20"
                  data-oid="98syt56"
                >
                  <div
                    className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"
                    data-oid=".24unzk"
                  />
                </div>
              ) : (
                <div className="grid gap-6 md:gap-8" data-oid="d5e91w_">
                  {versions.map((version, index) => (
                    <motion.div
                      key={version.version}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      viewport={{ once: true }}
                      className="group"
                      data-oid="u2loddz"
                    >
                      {/* Glass card for each version */}
                      <div
                        className="relative overflow-hidden rounded-2xl"
                        data-oid=":tiatqz"
                      >
                        {/* Glassmorphism background */}
                        <div
                          className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                          data-oid="p-83t27"
                        />
                        <div
                          className="absolute inset-0 bg-white/2"
                          data-oid="_..y6qf"
                        />

                        {/* Border gradient */}
                        <div
                          className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                          data-oid="io1ppnh"
                        >
                          <div
                            className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                            data-oid="wbjag_c"
                          />
                        </div>

                        {/* Content */}
                        <div
                          className="relative p-8 md:p-10"
                          data-oid="r05dsep"
                        >
                          {/* Header */}
                          <div
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6"
                            data-oid="f-dz_s_"
                          >
                            <div
                              className="flex items-center gap-4 mb-2 sm:mb-0"
                              data-oid="d8fjc09"
                            >
                              <h3
                                className="text-2xl font-medium text-white"
                                data-oid="4rd5xq-"
                              >
                                v{version.version}
                              </h3>
                              {index === 0 && (
                                <span
                                  className="px-3 py-1 text-xs font-semibold bg-linear-to-r from-green-500 to-emerald-500 text-white rounded-full"
                                  data-oid="8dg4i-u"
                                >
                                  {t("changelog.latest")}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400" data-oid="dkdwqsf">
                              {version.date}
                            </p>
                          </div>

                          {/* Features */}
                          {version.features.length > 0 && (
                            <div className="mb-6" data-oid="916c1h:">
                              <h4
                                className="text-xl font-medium text-white mb-3 flex items-center gap-2"
                                data-oid="dzs1f97"
                              >
                                <span className="text-2xl" data-oid="ofn4fzi">
                                  🚀
                                </span>
                                <span data-oid="5npbda8">
                                  {t("changelog.newFeatures")}
                                </span>
                              </h4>
                              <ul className="space-y-2" data-oid="nj5.:b0">
                                {version.features.map((feature, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-2 text-gray-300"
                                    data-oid="psh9.ol"
                                  >
                                    <span
                                      className="text-purple-400 mt-1"
                                      data-oid="70o8p62"
                                    >
                                      •
                                    </span>
                                    <span data-oid="y5holec">
                                      {formatChangelogItem(feature)}
                                    </span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Bug Fixes */}
                          {version.fixes.length > 0 && (
                            <div className="mb-6" data-oid="7acn2hc">
                              <h4
                                className="text-xl font-medium text-white mb-3 flex items-center gap-2"
                                data-oid="9u_tt.x"
                              >
                                <span className="text-2xl" data-oid="lyer1m5">
                                  🐛
                                </span>
                                <span data-oid="w48rd-1">
                                  {t("changelog.bugFixes")}
                                </span>
                              </h4>
                              <ul className="space-y-2" data-oid="_sok1eh">
                                {version.fixes.map((fix, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-2 text-gray-300"
                                    data-oid="n7.i3z8"
                                  >
                                    <span
                                      className="text-blue-400 mt-1"
                                      data-oid="md3_hxu"
                                    >
                                      •
                                    </span>
                                    <span data-oid="xbpmy:-">
                                      {formatChangelogItem(fix)}
                                    </span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Improvements */}
                          {version.improvements.length > 0 && (
                            <div className="mb-6" data-oid="ftrpu2_">
                              <h4
                                className="text-xl font-medium text-white mb-3 flex items-center gap-2"
                                data-oid="hxvqc8k"
                              >
                                <span className="text-2xl" data-oid=".byxlbd">
                                  🔧
                                </span>
                                <span data-oid="q0pe1y2">
                                  {t("changelog.improvements")}
                                </span>
                              </h4>
                              <ul className="space-y-2" data-oid="_vtvo56">
                                {version.improvements.map((improvement, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-2 text-gray-300"
                                    data-oid=".kgfy1m"
                                  >
                                    <span
                                      className="text-green-400 mt-1"
                                      data-oid="lrblt8g"
                                    >
                                      •
                                    </span>
                                    <span data-oid="4ejltn0">
                                      {formatChangelogItem(improvement)}
                                    </span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Breaking Changes */}
                          {version.breaking && version.breaking.length > 0 && (
                            <div className="mb-6" data-oid="6j7hpdx">
                              <h4
                                className="text-xl font-medium text-white mb-3 flex items-center gap-2"
                                data-oid="xi:nr_x"
                              >
                                <span className="text-2xl" data-oid="xb9l42p">
                                  ⚠️
                                </span>
                                <span data-oid="4gw7vxb">
                                  {t("changelog.breakingChanges")}
                                </span>
                              </h4>
                              <ul className="space-y-2" data-oid="3:v5vag">
                                {version.breaking.map((change, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    viewport={{ once: true }}
                                    className="flex items-start gap-2 text-gray-300"
                                    data-oid="giy8jd-"
                                  >
                                    <span
                                      className="text-red-400 mt-1"
                                      data-oid="pjbo1w8"
                                    >
                                      •
                                    </span>
                                    <span data-oid="5kp_u8y">
                                      {formatChangelogItem(change)}
                                    </span>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Download button */}
                          <div className="mt-8 flex gap-4" data-oid="flg6kyl">
                            <a
                              href={`https://github.com/chatman-media/timeline-studio/releases/tag/v${version.version}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-3 bg-[#8b5cf6] text-white font-medium rounded-xl hover:bg-[#7c3aed] transition-all duration-300 transform hover:scale-105"
                              data-oid="9cfoix2"
                            >
                              {t("changelog.viewRelease")}
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                data-oid="::-lsri"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  data-oid="ogckr1p"
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
                  data-oid="0s448.u"
                >
                  <a
                    href="https://github.com/chatman-media/timeline-studio/releases"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                    data-oid="g86._xm"
                  >
                    {t("changelog.viewAllReleases")}
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      data-oid="y4h7liq"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                        data-oid="sx_eo5-"
                      />
                    </svg>
                  </a>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer data-oid="w5:9y1r" />
    </div>
  );
};

export default Changelog;
