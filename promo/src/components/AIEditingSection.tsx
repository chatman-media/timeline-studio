import { motion } from "framer-motion";
import { useId } from "react";
import {
  Brain,
  Clapperboard,
  Sparkles,
  Camera,
  Scissors,
  Palette,
  Music,
  Video,
  Film,
  Smile,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { AnimatedSection } from "./AnimatedSection";

export function AIEditingSection() {
  const { t } = useLanguage();
  const sectionId = useId();

  return (
    <section
      id={`ai-editing-${sectionId}`}
      className="py-20 bg-[#12192C] relative overflow-hidden"
      data-oid="x8996p6"
    >
      {/* Liquid glass background effects */}
      <div className="absolute inset-0" data-oid="9bl1bcw">
        <div
          className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"
          data-oid=":gy5vd."
        />
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl animate-pulse"
          data-oid="g.g2s.6"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10" data-oid="88u9d8j">
        <AnimatedSection animation="fadeUp" data-oid="0wh87n4">
          <div className="text-center mb-16" data-oid="5u1-h2.">
            <h2 className="section-title" data-oid="-:jc7:2">
              {t("mainPage.aiSmartEditing.title")
                .split(" ")
                .slice(0, -2)
                .join(" ")}{" "}
              <span className="text-gradient" data-oid="up4q9wk">
                {t("mainPage.aiSmartEditing.title")
                  .split(" ")
                  .slice(-2)
                  .join(" ")}
              </span>
            </h2>
            <p
              className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto"
              data-oid="rnrh3:h"
            >
              {t("mainPage.aiSmartEditing.subtitle")}
            </p>
            <p
              className="text-lg text-gray-400 max-w-3xl mx-auto"
              data-oid="a67zkw0"
            >
              {t("mainPage.aiSmartEditing.description")}
            </p>
          </div>
        </AnimatedSection>

        <div
          className="grid lg:grid-cols-2 gap-12 items-center"
          data-oid="c_7cni6"
        >
          <AnimatedSection
            animation="slideInLeft"
            delay={0.2}
            data-oid="yq18vd1"
          >
            <div className="space-y-6" data-oid="v-rltpz">
              <div
                className="relative overflow-hidden rounded-xl"
                data-oid="xf5.q6p"
              >
                {/* Glassmorphism background */}
                <div
                  className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                  data-oid="8b-upt6"
                />
                <div
                  className="absolute inset-0 bg-white/2"
                  data-oid="xfeoeq9"
                />

                {/* Border gradient */}
                <div
                  className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                  data-oid="0.3q6oc"
                >
                  <div
                    className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                    data-oid="_10l-zq"
                  />
                </div>

                {/* Content */}
                <div
                  className="relative p-8 flex items-start space-x-4"
                  data-oid=".rdze.l"
                >
                  <div
                    className="w-14 h-14 bg-linear-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                    data-oid="9x:v4kv"
                  >
                    <Brain className="w-8 h-8 text-white" data-oid="zby.6rz" />
                  </div>
                  <div data-oid="4-idk2u">
                    <h3
                      className="text-2xl font-medium text-white mb-2"
                      data-oid="y4lsxli"
                    >
                      {t("mainPage.aiSmartEditing.neuralSceneAnalysis")}
                    </h3>
                    <p className="text-gray-400 text-sm" data-oid="z7gfl4z">
                      {t("mainPage.aiSmartEditing.neuralSceneAnalysisDesc")}
                    </p>
                    <div
                      className="mt-3 flex items-center space-x-2"
                      data-oid="auji_vl"
                    >
                      <span
                        className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full"
                        data-oid="tfx20.f"
                      >
                        {t("mainPage.aiSmartEditing.deepLearning")}
                      </span>
                      <span
                        className="text-xs text-pink-400 bg-pink-400/10 px-2 py-1 rounded-full"
                        data-oid="_o26wex"
                      >
                        {t("mainPage.aiSmartEditing.realTime")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-xl"
                data-oid="tla_typ"
              >
                {/* Glassmorphism background */}
                <div
                  className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                  data-oid="50wfomy"
                />
                <div
                  className="absolute inset-0 bg-white/2"
                  data-oid="p1i5m.2"
                />

                {/* Border gradient */}
                <div
                  className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                  data-oid="wql1jc-"
                >
                  <div
                    className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                    data-oid="a-w6v7m"
                  />
                </div>

                {/* Content */}
                <div
                  className="relative p-8 flex items-start space-x-4"
                  data-oid="4forzj9"
                >
                  <div
                    className="w-14 h-14 bg-linear-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                    data-oid="--diz__"
                  >
                    <Clapperboard
                      className="w-8 h-8 text-white"
                      data-oid="lj6705g"
                    />
                  </div>
                  <div data-oid=".lbk4wl">
                    <h3
                      className="text-2xl font-medium text-white mb-2"
                      data-oid="jta1g-r"
                    >
                      {t("mainPage.features.cinematicAutoEdit.title")}
                    </h3>
                    <p className="text-gray-400 text-sm" data-oid="i3db233">
                      {t("mainPage.features.cinematicAutoEdit.description")}
                    </p>
                    <div
                      className="mt-3 flex items-center space-x-2"
                      data-oid="0jmk0lk"
                    >
                      <span
                        className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full"
                        data-oid="pc_sgi7"
                      >
                        {t("mainPage.features.cinematicAutoEdit.filmTheory")}
                      </span>
                      <span
                        className="text-xs text-pink-400 bg-pink-400/10 px-2 py-1 rounded-full"
                        data-oid="4qi4z40"
                      >
                        {t("mainPage.features.cinematicAutoEdit.aiDirector")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-xl"
                data-oid="hvuv3.b"
              >
                {/* Glassmorphism background */}
                <div
                  className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                  data-oid="ms_p:1j"
                />
                <div
                  className="absolute inset-0 bg-white/2"
                  data-oid="cjdghjv"
                />

                {/* Border gradient */}
                <div
                  className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                  data-oid="0k8shyo"
                >
                  <div
                    className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                    data-oid="rg3ycin"
                  />
                </div>

                {/* Content */}
                <div
                  className="relative p-8 flex items-start space-x-4"
                  data-oid="9d3e8n1"
                >
                  <div
                    className="w-14 h-14 bg-linear-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                    data-oid="_w3spi1"
                  >
                    <Sparkles
                      className="w-8 h-8 text-white"
                      data-oid="3.rwdb3"
                    />
                  </div>
                  <div data-oid="8cvyyj1">
                    <h3
                      className="text-2xl font-medium text-white mb-2"
                      data-oid=":tg.601"
                    >
                      {t("mainPage.features.magicEnhancement.title")}
                    </h3>
                    <p className="text-gray-400 text-sm" data-oid="6lmvghg">
                      {t("mainPage.features.magicEnhancement.description")}
                    </p>
                    <div
                      className="mt-3 flex items-center space-x-2"
                      data-oid="qe2w0ly"
                    >
                      <span
                        className="text-xs text-purple-400 bg-purple-400/10 px-2 py-1 rounded-full"
                        data-oid="nz6.hq4"
                      >
                        {t(
                          "mainPage.features.magicEnhancement.superResolution",
                        )}
                      </span>
                      <span
                        className="text-xs text-pink-400 bg-pink-400/10 px-2 py-1 rounded-full"
                        data-oid="ial6cwd"
                      >
                        60 FPS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection
            animation="slideInRight"
            delay={0.3}
            data-oid="3qr1d7q"
          >
            <div className="relative" data-oid="l7g_o5g">
              {/* Main liquid glass container */}
              <div
                className="glass rounded-3xl p-2 backdrop-blur-xl overflow-hidden"
                data-oid="ye7_4kc"
              >
                <div className="glass-dark rounded-2xl p-8" data-oid="dtuwx2r">
                  {/* AI Processing visualization */}
                  <div
                    className="aspect-video relative rounded-xl overflow-hidden"
                    data-oid="uuk9ez7"
                  >
                    {/* Animated background gradient */}
                    <motion.div
                      animate={{
                        background: [
                          "linear-gradient(45deg, #8b5cf6 0%, #ec4899 100%)",
                          "linear-gradient(45deg, #ec4899 0%, #8b5cf6 100%)",
                          "linear-gradient(45deg, #8b5cf6 0%, #ec4899 100%)",
                        ],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Number.POSITIVE_INFINITY,
                      }}
                      className="absolute inset-0 opacity-20"
                      data-oid="qlh8_4v"
                    />

                    {/* Content grid */}
                    <div
                      className="relative h-full flex items-center justify-center p-8"
                      data-oid="mu6tt.z"
                    >
                      <div
                        className="grid grid-cols-3 gap-4 w-full max-w-md"
                        data-oid="v-dsixm"
                      >
                        {[
                          Camera,
                          Scissors,
                          Palette,
                          Music,
                          Sparkles,
                          Clapperboard,
                          Video,
                          Film,
                          Smile,
                        ].map((Icon, i) => (
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
                            data-oid="drdoxi-"
                          >
                            <Icon
                              className="w-8 h-8 text-white/60"
                              data-oid="s49cbe9"
                            />
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Processing overlay */}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      data-oid="qbs0-a0"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 8,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                        className="w-32 h-32 rounded-full border-4 border-purple-500/30 border-t-purple-500"
                        data-oid="8xpdch5"
                      />
                    </div>
                  </div>

                  {/* Status bar */}
                  <div className="mt-6 space-y-4" data-oid="d2hmry.">
                    <div
                      className="flex items-center justify-between text-sm"
                      data-oid="10fteth"
                    >
                      <span className="text-gray-400" data-oid="nbsm_v4">
                        AI Analysis Progress
                      </span>
                      <span
                        className="text-purple-400 font-medium"
                        data-oid="jv05_zq"
                      >
                        87%
                      </span>
                    </div>
                    <div
                      className="h-2 bg-gray-800 rounded-full overflow-hidden"
                      data-oid="gsonkdn"
                    >
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "87%" }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="h-full bg-linear-to-r from-purple-500 to-pink-500"
                        data-oid="mzke_6v"
                      />
                    </div>

                    {/* Feature tags */}
                    <div
                      className="flex flex-wrap gap-2 mt-4"
                      data-oid="htedb:l"
                    >
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full"
                        data-oid="-:tedqc"
                      >
                        Scene Detection ✓
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-xs bg-pink-500/20 text-pink-400 px-3 py-1 rounded-full"
                        data-oid="p_ev10i"
                      >
                        Color Analysis ✓
                      </motion.span>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full animate-pulse"
                        data-oid="3.37ayh"
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
                className="absolute -top-8 -right-8 w-32 h-32 bg-linear-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
                data-oid="a6b8z8u"
              />

              <motion.div
                animate={{
                  y: [20, -20, 20],
                  x: [10, -10, 10],
                }}
                transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
                className="absolute -bottom-8 -left-8 w-40 h-40 bg-linear-to-br from-pink-500/30 to-purple-500/30 rounded-full blur-3xl"
                data-oid="7s53pmh"
              />

              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl"
                data-oid="6327ls-"
              />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
