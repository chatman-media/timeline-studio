import { motion } from "framer-motion"
import type React from "react"
import { Clapperboard, Video, Palette } from "lucide-react"
import { useTranslation } from "../hooks/useTranslation"

interface Demo {
  title: string
  description: string
  icon: React.ReactNode
  comingSoon?: boolean
}

export const VideoDemos: React.FC = () => {
  const { t } = useTranslation()

  const demos: Demo[] = [
    {
      title: t("mainPage.videoDemos.aiEditing.title"),
      description: t("mainPage.videoDemos.aiEditing.description"),
      icon: <Clapperboard className="w-16 h-16 text-white drop-shadow-2xl" />,
      comingSoon: true,
    },
    {
      title: t("mainPage.videoDemos.multiCamera.title"),
      description: t("mainPage.videoDemos.multiCamera.description"),
      icon: <Video className="w-16 h-16 text-white drop-shadow-2xl" />,
      comingSoon: true,
    },
    {
      title: t("mainPage.videoDemos.colorGrading.title"),
      description: t("mainPage.videoDemos.colorGrading.description"),
      icon: <Palette className="w-16 h-16 text-white drop-shadow-2xl" />,
      comingSoon: true,
    },
  ]

  return (
    <section className="py-20 bg-[#0a0f1e] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="section-title">
            {t("mainPage.videoDemos.title")} <span className="text-gradient">{t("mainPage.videoDemos.titleHighlight")}</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            {t("mainPage.videoDemos.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {demos.map((demo, index) => (
            <motion.div
              key={demo.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-xl group"
            >
              {/* Glassmorphism background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
              <div className="absolute inset-0 bg-white/[0.02]" />

              {/* Border gradient */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                <div className="h-full w-full rounded-xl bg-[#0a0f1e]/90 backdrop-blur-xl" />
              </div>

              {/* Content */}
              <div className="relative">
                {/* Video placeholder */}
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Icon */}
                  <div className="relative z-10 text-center">
                    <div className="mb-4 flex justify-center">{demo.icon}</div>
                    {demo.comingSoon && (
                      <div className="inline-block px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-500/30">
                        <span className="text-sm text-purple-300 font-medium">{t("mainPage.videoDemos.comingSoon")}</span>
                      </div>
                    )}
                  </div>

                  {/* Play button overlay */}
                  {!demo.comingSoon && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{demo.title}</h3>
                  <p className="text-sm text-gray-400">{demo.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-4">
            {t("mainPage.videoDemos.checkGithub")}{" "}
            <a href="https://github.com/chatman-media/timeline-studio" className="text-blue-400 hover:text-blue-300 transition-colors">
              {t("mainPage.videoDemos.githubRepo")}
            </a>{" "}
            {t("mainPage.videoDemos.forDocs")}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
