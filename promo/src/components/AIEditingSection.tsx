import { motion } from "framer-motion"
import { useId } from "react"
import { Brain, Clapperboard, Sparkles, Camera, Scissors, Palette, Music, Video, Film, Smile } from "lucide-react"
import { useLanguage } from "../contexts/LanguageContext"
import { AnimatedSection } from "./AnimatedSection"

export function AIEditingSection() {
  const { t } = useLanguage()
  const sectionId = useId()

  return (
    <section id={`ai-editing-${sectionId}`} className="py-20 bg-[#12192C] relative overflow-hidden">
      {/* Liquid glass background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <AnimatedSection animation="fadeUp">
          <div className="text-center mb-16">
            <h2 className="section-title">
              {t("mainPage.aiSmartEditing.title").split(" ").slice(0, -2).join(" ")}{" "}
              <span className="text-gradient">{t("mainPage.aiSmartEditing.title").split(" ").slice(-2).join(" ")}</span>
            </h2>
            <p className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto">
              {t("mainPage.aiSmartEditing.subtitle")}
            </p>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto">{t("mainPage.aiSmartEditing.description")}</p>
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection animation="slideInLeft" delay={0.2}>
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-xl">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />

                {/* Border gradient */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative p-8 flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium text-white mb-2">
                      {t("mainPage.aiSmartEditing.neuralSceneAnalysis")}
                    </h3>
                    <p className="text-gray-400 text-sm">{t("mainPage.aiSmartEditing.neuralSceneAnalysisDesc")}</p>
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">
                        {t("mainPage.aiSmartEditing.deepLearning")}
                      </span>
                      <span className="text-xs text-pink-400 bg-pink-400/10 px-2 py-1 rounded-full">
                        {t("mainPage.aiSmartEditing.realTime")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />

                {/* Border gradient */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative p-8 flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Clapperboard className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium text-white mb-2">
                      {t("mainPage.features.cinematicAutoEdit.title")}
                    </h3>
                    <p className="text-gray-400 text-sm">{t("mainPage.features.cinematicAutoEdit.description")}</p>
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">
                        {t("mainPage.features.cinematicAutoEdit.filmTheory")}
                      </span>
                      <span className="text-xs text-pink-400 bg-pink-400/10 px-2 py-1 rounded-full">
                        {t("mainPage.features.cinematicAutoEdit.aiDirector")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />

                {/* Border gradient */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative p-8 flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-medium text-white mb-2">
                      {t("mainPage.features.magicEnhancement.title")}
                    </h3>
                    <p className="text-gray-400 text-sm">{t("mainPage.features.magicEnhancement.description")}</p>
                    <div className="mt-3 flex items-center space-x-2">
                      <span className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full">
                        {t("mainPage.features.magicEnhancement.superResolution")}
                      </span>
                      <span className="text-xs text-pink-400 bg-pink-400/10 px-2 py-1 rounded-full">60 FPS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="slideInRight" delay={0.3}>
            <div className="relative">
              {/* Main liquid glass container */}
              <div className="glass rounded-3xl p-2 backdrop-blur-xl overflow-hidden">
                <div className="glass-dark rounded-2xl p-8">
                  {/* AI Processing visualization */}
                  <div className="aspect-video relative rounded-xl overflow-hidden">
                    {/* Animated background gradient */}
                    <motion.div
                      animate={{
                        background: [
                          "linear-gradient(45deg, #8b5cf6 0%, #ec4899 100%)",
                          "linear-gradient(45deg, #ec4899 0%, #8b5cf6 100%)",
                          "linear-gradient(45deg, #8b5cf6 0%, #ec4899 100%)",
                        ],
                      }}
                      transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
                      className="absolute inset-0 opacity-20"
                    />

                    {/* Content grid */}
                    <div className="relative h-full flex items-center justify-center p-8">
                      <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                        {[Camera, Scissors, Palette, Music, Sparkles, Clapperboard, Video, Film, Smile].map((Icon, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                              opacity: [0.3, 0.8, 0.3],
                              scale: [0.8, 1, 0.8],
                            }}
                            transition={{
                              duration: 2,
                              delay: i * 0.1,
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                            className="aspect-square glass rounded-lg flex items-center justify-center"
                          >
                            <Icon className="w-8 h-8 text-white/60" />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Processing overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="w-32 h-32 rounded-full border-4 border-purple-500/30 border-t-purple-500"
                      />
                    </div>
                  </div>

                  {/* Status bar */}
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">AI Analysis Progress</span>
                      <span className="text-purple-400 font-medium">87%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "87%" }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>

                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full"
                      >
                        Scene Detection ✓
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-xs bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full"
                      >
                        Color Analysis ✓
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full animate-pulse"
                      >
                        Audio Processing...
                      </motion.span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced floating particles */}
              <motion.div
                animate={{
                  y: [-20, 20, -20],
                  x: [-10, 10, -10],
                }}
                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  y: [20, -20, 20],
                  x: [10, -10, 10],
                }}
                transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
                className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"
              />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
