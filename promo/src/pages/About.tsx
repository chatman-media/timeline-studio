import { motion } from "framer-motion"
import type React from "react"
import { Clapperboard, Wrench, Lock, Zap, Rocket, Globe } from "lucide-react"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { useTranslation } from "../hooks/useTranslation"
import { GITHUB_RELEASES_URL } from "../constants"

export const About: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 hero-gradient" />

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

        {/* Key Technologies Section */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl mb-4 text-center">
                <span className="text-gradient">{t("about.aiEditor.title")}</span>
              </h2>
              <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
                {t("about.aiEditor.subtitle")}
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                {/* AI Director */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/15 via-purple-500/15 to-pink-500/15 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 p-[1px]">
                    <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  <div className="relative p-8 h-full">
                    <Clapperboard className="w-12 h-12 text-white mb-6" />
                    <h3 className="text-2xl font-medium text-white mb-4">{t("about.aiDirector.title")}</h3>
                    <p className="text-gray-300 mb-6">{t("about.aiDirector.description")}</p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li>• {t("about.aiDirector.feature1")}</li>
                      <li>• {t("about.aiDirector.feature2")}</li>
                      <li>• {t("about.aiDirector.feature3")}</li>
                      <li>• {t("about.aiDirector.feature4")}</li>
                    </ul>
                  </div>
                </motion.div>

                {/* 100+ AI Tools */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/15 via-teal-500/15 to-blue-500/15 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/30 via-teal-500/30 to-blue-500/30 p-[1px]">
                    <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  <div className="relative p-8 h-full">
                    <Wrench className="w-12 h-12 text-white mb-6" />
                    <h3 className="text-2xl font-medium text-white mb-4">{t("about.aiTools.title")}</h3>
                    <p className="text-gray-300 mb-6">{t("about.aiTools.description")}</p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li>• {t("about.aiTools.feature1")}</li>
                      <li>• {t("about.aiTools.feature2")}</li>
                      <li>• {t("about.aiTools.feature3")}</li>
                      <li>• {t("about.aiTools.feature4")}</li>
                    </ul>
                  </div>
                </motion.div>

                {/* Local Models */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden rounded-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-orange-500/15 to-red-500/15 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/30 via-orange-500/30 to-red-500/30 p-[1px]">
                    <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  <div className="relative p-8 h-full">
                    <Lock className="w-12 h-12 text-white mb-6" />
                    <h3 className="text-2xl font-medium text-white mb-4">{t("about.localModels.title")}</h3>
                    <p className="text-gray-300 mb-6">{t("about.localModels.description")}</p>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li>• {t("about.localModels.feature1")}</li>
                      <li>• {t("about.localModels.feature2")}</li>
                      <li>• {t("about.localModels.feature3")}</li>
                      <li>• {t("about.localModels.feature4")}</li>
                    </ul>
                  </div>
                </motion.div>
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
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                <div className="relative p-8 md:p-12">
                  <p className="text-lg text-gray-300 leading-relaxed mb-6">{t("about.mission.paragraph1")}</p>
                  <p className="text-lg text-gray-300 leading-relaxed">{t("about.mission.paragraph2")}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Core Values */}
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
                <span className="text-gradient">{t("about.corePrinciples.title")}</span>
              </h2>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  {
                    Icon: Zap,
                    title: t("about.corePrinciples.speed.title"),
                    description: t("about.corePrinciples.speed.description"),
                  },
                  {
                    Icon: Lock,
                    title: t("about.corePrinciples.privacy.title"),
                    description: t("about.corePrinciples.privacy.description"),
                  },
                  {
                    Icon: Rocket,
                    title: t("about.corePrinciples.innovation.title"),
                    description: t("about.corePrinciples.innovation.description"),
                  },
                  {
                    Icon: Globe,
                    title: t("about.corePrinciples.openSource.title"),
                    description: t("about.corePrinciples.openSource.description"),
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
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                    <div className="absolute inset-0 bg-white/[0.02]" />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                      <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                    </div>

                    <div className="relative p-6 h-full">
                      <value.Icon className="w-8 h-8 text-white mb-3" />
                      <h3 className="text-lg font-medium text-white mb-2">{value.title}</h3>
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
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

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
                  className="px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>{t("about.cta.contributeGithub")}</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
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
