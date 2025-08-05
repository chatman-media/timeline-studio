import { motion } from "framer-motion"
import type React from "react"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { useTranslation } from "../hooks/useTranslation"

export const About: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 hero-gradient opacity-50" />

          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="page-title">
                <span className="text-gradient">{t("about.hero.title")}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">{t("about.hero.subtitle")}</p>
              <div className="flex items-center justify-center space-x-4 text-gray-400">
                <span>{t("about.hero.founded")}</span>
                <span>•</span>
                <span>{t("about.hero.remote")}</span>
                <span>•</span>
                <span>{t("about.hero.openSource")}</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl mb-12 text-center">
                <span className="text-gradient">{t("about.mission.title")}</span>
              </h2>
              <div className="relative overflow-hidden rounded-2xl">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />

                {/* Border gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative p-8 md:p-12">
                  <p className="text-lg text-gray-300 leading-relaxed mb-6">{t("about.mission.paragraph1")}</p>
                  <p className="text-lg text-gray-300 leading-relaxed">{t("about.mission.paragraph2")}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl mb-12 text-center">
                <span className="text-gradient">{t("about.values.title")}</span>
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "🚀",
                    title: t("about.values.innovation.title"),
                    description: t("about.values.innovation.description"),
                  },
                  {
                    icon: "🌍",
                    title: t("about.values.community.title"),
                    description: t("about.values.community.description"),
                  },
                  {
                    icon: "⚡",
                    title: t("about.values.efficiency.title"),
                    description: t("about.values.efficiency.description"),
                  },
                  {
                    icon: "🔒",
                    title: t("about.values.privacy.title"),
                    description: t("about.values.privacy.description"),
                  },
                  {
                    icon: "🎯",
                    title: t("about.values.userCentric.title"),
                    description: t("about.values.userCentric.description"),
                  },
                  {
                    icon: "💡",
                    title: t("about.values.openInnovation.title"),
                    description: t("about.values.openInnovation.description"),
                  },
                ].map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-xl"
                  >
                    {/* Glassmorphism background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                    <div className="absolute inset-0 bg-white/[0.02]" />

                    {/* Border gradient */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                      <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                    </div>

                    {/* Content */}
                    <div className="relative p-8">
                      <div className="text-4xl mb-4">{value.icon}</div>
                      <h3 className="text-2xl font-medium text-white mb-2">{value.title}</h3>
                      <p className="text-gray-400 text-sm">{value.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-4xl md:text-5xl mb-6 text-center">
                <span className="text-gradient">{t("about.team.title")}</span>
              </h2>
              <p className="text-lg text-gray-300 mb-12">{t("about.team.description")}</p>
              <div className="relative overflow-hidden rounded-2xl inline-block">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />

                {/* Border gradient */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative p-8">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">AK</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-medium text-white">Alexander Kireyev</h3>
                      <p className="text-gray-400 text-sm">{t("about.team.founder")}</p>
                      <a
                        href="mailto:ak.chatman.media@gmail.com"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        ak.chatman.media@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
            >
              <h2 className="text-4xl md:text-5xl mb-6 text-center">
                <span className="text-gradient">{t("about.cta.title")}</span>
              </h2>
              <p className="text-lg text-gray-300 mb-8">{t("about.cta.description")}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://github.com/chatman-media/timeline-studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors flex items-center space-x-2"
                >
                  <span>{t("about.cta.contributeGithub")}</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href="#download"
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  {t("about.cta.tryStudio")}
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default About
