import { motion } from "framer-motion";
import type React from "react";
import versionData from "../../version.json";
import { Footer } from "./components/Footer";
import { HeroSection } from "./components/HeroSection";
import { Navigation } from "./components/Navigation";
import { SearchDemo } from "./components/SearchDemo";
import { SEO } from "./components/SEO";
import { VideoDemos } from "./components/VideoDemos";
import { WhatYouCanDo } from "./components/WhatYouCanDo";
import { useTranslation } from "./hooks/useTranslation";

const App: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="iqw.uts">
      <SEO data-oid="z15xaa5" />
      <Navigation data-oid="j-tpp4z" />

      <main className="flex-1" data-oid="auyq3jf">
        {/* Hero Section */}
        <HeroSection data-oid="7ikf52e" />

        {/* Screenshot Demo */}
        <section
          className="relative py-20 overflow-hidden bg-[#0a0f1e]"
          data-oid="3_vstt0"
        >
          <div className="absolute inset-0" data-oid="9k_4xm_">
            <div
              className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"
              data-oid="k-zpa9l"
            />
            <div
              className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
              data-oid="j13jj8l"
            />
          </div>

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="7n7e5-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
              data-oid="x:9xqjj"
            >
              <h2 className="section-title" data-oid=".04r_e4">
                {t("mainPage.interface.title")}{" "}
                <span className="text-gradient" data-oid="45x8hg2">
                  {t("mainPage.interface.titleHighlight")}
                </span>
              </h2>
              <p
                className="text-xl text-gray-300 max-w-3xl mx-auto"
                data-oid="ntb.quw"
              >
                {t("mainPage.interface.description")}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto"
              style={{ position: "relative" }}
              data-oid="1bft3k3"
            >
              <SearchDemo data-oid="rzcuc6y" />
            </motion.div>
          </div>
        </section>

        {/* What You Can Do */}
        <WhatYouCanDo data-oid="auj.j36" />

        {/* Video Demos */}
        <VideoDemos data-oid="89yruwt" />

        {/* Download Section */}
        <section
          id="download"
          className="relative py-20 overflow-hidden"
          data-oid="d647e:m"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 hero-gradient opacity-30"
            data-oid=":l0aexz"
          />

          {/* Animated background elements */}
          <div className="absolute inset-0" data-oid="8506q7f">
            <div
              className="absolute top-10 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
              data-oid=".zq.ufd"
            />
            <div
              className="absolute bottom-10 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700"
              data-oid="_gxagmy"
            />
          </div>

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="yfa80:y"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center"
              style={{ position: "relative" }}
              data-oid="2c88o7n"
            >
              <h2 className="section-title" data-oid="nidb-kc">
                <span className="text-gradient" data-oid="ts47oiw">
                  {t("mainPage.download.title")}
                </span>
              </h2>
              <p
                className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto"
                data-oid="6vlwxc2"
              >
                {t("mainPage.download.subtitle")}
              </p>
              <p className="text-lg text-gray-400 mb-12" data-oid="5p3wt0b">
                {t("mainPage.download.description")} ⚡
              </p>
              <div
                className="flex flex-col sm:flex-row justify-center gap-8"
                data-oid="urcbq77"
              >
                <DownloadButton
                  platform="Windows"
                  icon="windows"
                  data-oid="1otbh98"
                />
                <DownloadButton
                  platform="macOS"
                  icon="apple"
                  data-oid="8oep8v0"
                />
                <DownloadButton
                  platform="Linux"
                  icon="linux"
                  data-oid="okhruvr"
                />
              </div>
              <p className="mt-8 text-gray-400 text-sm" data-oid="1ce51:j">
                <span className="font-medium" data-oid="4a-644v">
                  {t("mainPage.download.latestVersion")}: v{versionData.version}
                </span>
                <span className="mx-2" data-oid="rui3:mx">
                  •
                </span>
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases/latest"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  data-oid="3wbtdve"
                >
                  {t("mainPage.download.checkGithub")}
                </a>
                <span className="mx-2" data-oid="c4k:gmo">
                  •
                </span>
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                  data-oid="lqo83a7"
                >
                  {t("mainPage.download.allReleases")}
                </a>
              </p>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer data-oid="a_v4hkp" />
    </div>
  );
};

// Компонент кнопки загрузки
const DownloadButton: React.FC<{ platform: string; icon: string }> = ({
  platform,
}) => {
  const { t } = useTranslation();
  const version = versionData.version; // Версия из version.json

  // Определяем правильный путь к файлу в зависимости от платформы
  const getDownloadPath = () => {
    switch (platform.toLowerCase()) {
      case "windows":
        return `timeline-studio_${version}_x64-setup.exe`;
      case "macos":
        return `timeline-studio_${version}_universal.dmg`;
      case "linux":
        return `timeline-studio_${version}_amd64.AppImage`;
      default:
        return `timeline-studio-${platform.toLowerCase()}.zip`;
    }
  };

  return (
    <motion.a
      href={`https://github.com/chatman-media/timeline-studio/releases/download/v${version}/${getDownloadPath()}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="group relative px-8 py-4 rounded-xl text-lg font-medium text-white overflow-hidden block"
      style={{ position: "relative" }}
      data-oid="kv57ddz"
    >
      {/* Background with purple base */}
      <div
        className="absolute inset-0 bg-[#8b5cf6] rounded-xl"
        data-oid="6c4g95g"
      />

      {/* Kiro-style spreading effect on hover */}
      <div
        className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-150 group-hover:scale-y-220"
        data-oid="s3s6lz7"
      />

      {/* Text */}
      <div
        className="relative z-20 flex items-center justify-center gap-3 group-hover:text-[#8b5cf6] transition-colors duration-500"
        data-oid="h45:ket"
      >
        {platform === "Windows" && (
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            data-oid="5.6-exg"
          >
            <path
              d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"
              data-oid="zahg161"
            />
          </svg>
        )}
        {platform === "macOS" && (
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            data-oid="ro7lw1o"
          >
            <path
              d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
              data-oid="qlimge6"
            />
          </svg>
        )}
        {platform === "Linux" && (
          <svg
            className="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 24 24"
            data-oid="r18y7m3"
          >
            <path
              d="M12 5c-1.11 0-2 .89-2 2v.18c-.14.05-.26.09-.37.14-.55.25-1.04.58-1.47.97-.41.38-.78.81-1.08 1.28-.12.19-.23.38-.33.58-.06.1-.1.2-.16.3-.14.25-.27.52-.38.79-.13.31-.24.63-.33.96-.04.16-.08.32-.11.48-.03.17-.05.34-.07.51-.02.19-.04.38-.04.58v.18c.01.12.01.25.02.37.02.25.05.49.1.73.04.19.09.38.15.56.11.38.25.74.42 1.08.12.26.26.51.41.75.06.1.11.19.17.28.07.1.14.2.22.3.14.19.29.37.45.55.2.22.41.43.64.62.44.38.92.71 1.44.96.26.13.53.23.8.32.14.04.27.08.41.11V19c0 1.11.89 2 2 2s2-.89 2-2v-1.28c.14-.03.27-.07.41-.11.27-.09.54-.19.8-.32.52-.25 1-.58 1.44-.96.23-.19.44-.4.64-.62.16-.18.31-.36.45-.55.08-.1.15-.2.22-.3.06-.09.11-.18.17-.28.15-.24.29-.49.41-.75.17-.34.31-.7.42-1.08.06-.18.11-.37.15-.56.05-.24.08-.48.1-.73.01-.12.01-.25.02-.37v-.18c0-.2-.02-.39-.04-.58-.02-.17-.04-.34-.07-.51-.03-.16-.07-.32-.11-.48-.09-.33-.2-.65-.33-.96-.11-.27-.24-.54-.38-.79-.06-.1-.1-.2-.16-.3-.1-.2-.21-.39-.33-.58-.3-.47-.67-.9-1.08-1.28-.43-.39-.92-.72-1.47-.97-.11-.05-.23-.09-.37-.14V7c0-1.11-.89-2-2-2zm-1 2c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1z"
              data-oid="n4u9r-a"
            />
          </svg>
        )}
        {t("mainPage.download.downloadFor")} {platform}
      </div>
    </motion.a>
  );
};

export default App;
