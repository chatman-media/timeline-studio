import { motion } from "framer-motion";
import type React from "react";
import { Clapperboard, Video, Palette } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";

interface Demo {
  title: string;
  description: string;
  icon: React.ReactNode;
  comingSoon?: boolean;
}

export const VideoDemos: React.FC = () => {
  const { t } = useTranslation();

  const demos: Demo[] = [
    {
      title: t("mainPage.videoDemos.aiEditing.title"),
      description: t("mainPage.videoDemos.aiEditing.description"),
      icon: (
        <Clapperboard
          className="w-16 h-16 text-white drop-shadow-2xl"
          data-oid="rum6j.e"
        />
      ),
      comingSoon: true,
    },
    {
      title: t("mainPage.videoDemos.multiCamera.title"),
      description: t("mainPage.videoDemos.multiCamera.description"),
      icon: (
        <Video
          className="w-16 h-16 text-white drop-shadow-2xl"
          data-oid=":fjibje"
        />
      ),
      comingSoon: true,
    },
    {
      title: t("mainPage.videoDemos.colorGrading.title"),
      description: t("mainPage.videoDemos.colorGrading.description"),
      icon: (
        <Palette
          className="w-16 h-16 text-white drop-shadow-2xl"
          data-oid="-1ds2c7"
        />
      ),
      comingSoon: true,
    },
  ];

  return (
    <section
      className="py-20 bg-[#0a0f1e] relative overflow-hidden"
      data-oid="yo:7_r5"
    >
      {/* Background effects */}
      <div className="absolute inset-0" data-oid=".7_s866">
        <div
          className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
          data-oid="hli7s_f"
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
          data-oid="zsw4l4j"
        />
      </div>

      <div
        className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10"
        data-oid="m6_p63m"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
          data-oid="o7t5hxe"
        >
          <h2 className="section-title" data-oid="15uecrp">
            {t("mainPage.videoDemos.title")}{" "}
            <span className="text-gradient" data-oid="t0_743-">
              {t("mainPage.videoDemos.titleHighlight")}
            </span>
          </h2>
          <p
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            data-oid="go-w4lp"
          >
            {t("mainPage.videoDemos.subtitle")}
          </p>
        </motion.div>

        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          data-oid=".gpp2p5"
        >
          {demos.map((demo, index) => (
            <motion.div
              key={demo.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-xl group"
              data-oid="uxps7oy"
            >
              {/* Glassmorphism background */}
              <div
                className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                data-oid="0_j8vm-"
              />
              <div className="absolute inset-0 bg-white/2" data-oid=".-7bg2u" />

              {/* Border gradient */}
              <div
                className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                data-oid="s:xaxg."
              >
                <div
                  className="h-full w-full rounded-xl bg-[#0a0f1e]/90 backdrop-blur-xl"
                  data-oid="fng7zi_"
                />
              </div>

              {/* Content */}
              <div className="relative" data-oid="646tqma">
                {/* Video placeholder */}
                <div
                  className="aspect-video bg-linear-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden"
                  data-oid="5y5scq7"
                >
                  {/* Animated background */}
                  <div
                    className="absolute inset-0 bg-linear-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    data-oid="mvlc37s"
                  />

                  {/* Icon */}
                  <div className="relative z-10 text-center" data-oid="7o_9q6_">
                    <div
                      className="mb-4 flex justify-center"
                      data-oid=":63w-nz"
                    >
                      {demo.icon}
                    </div>
                    {demo.comingSoon && (
                      <div
                        className="inline-block px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full border border-purple-500/30"
                        data-oid="0jsaycj"
                      >
                        <span
                          className="text-sm text-purple-300 font-medium"
                          data-oid="l24mego"
                        >
                          {t("mainPage.videoDemos.comingSoon")}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Play button overlay */}
                  {!demo.comingSoon && (
                    <div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      data-oid="3okf1lw"
                    >
                      <div
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform"
                        data-oid="1.38wqd"
                      >
                        <svg
                          className="w-8 h-8 text-gray-900 ml-1"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          data-oid="74:z2ke"
                        >
                          <path d="M8 5v14l11-7z" data-oid="y_u1jwr" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6" data-oid="qwdy.4z">
                  <h3
                    className="text-lg font-semibold text-white mb-2"
                    data-oid="9-9ou6o"
                  >
                    {demo.title}
                  </h3>
                  <p className="text-sm text-gray-400" data-oid="45kad4.">
                    {demo.description}
                  </p>
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
          data-oid="u06pq:3"
        >
          <p className="text-gray-400 mb-4" data-oid="y07a:4y">
            {t("mainPage.videoDemos.checkGithub")}{" "}
            <a
              href="https://github.com/chatman-media/timeline-studio"
              className="text-blue-400 hover:text-blue-300 transition-colors"
              data-oid="j4:froo"
            >
              {t("mainPage.videoDemos.githubRepo")}
            </a>{" "}
            {t("mainPage.videoDemos.forDocs")}
          </p>
        </motion.div>
      </div>
    </section>
  );
};
