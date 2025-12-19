import { motion } from "framer-motion";
import type React from "react";
import { useTranslation } from "../hooks/useTranslation";

interface Feature {
  title: string;
  description: string;
  examples: string[];
}

export const WhatYouCanDo: React.FC = () => {
  const { t } = useTranslation();

  const features: Feature[] = [
    {
      title: t("mainPage.whatYouCanDo.professional.title"),
      description: t("mainPage.whatYouCanDo.professional.description"),
      examples: [
        t("mainPage.whatYouCanDo.professional.examples.multitrack"),
        t("mainPage.whatYouCanDo.professional.examples.frameAccurate"),
        t("mainPage.whatYouCanDo.professional.examples.multicam"),
        t("mainPage.whatYouCanDo.professional.examples.compound"),
      ],
    },
    {
      title: t("mainPage.whatYouCanDo.aiPowered.title"),
      description: t("mainPage.whatYouCanDo.aiPowered.description"),
      examples: [
        t("mainPage.whatYouCanDo.aiPowered.examples.sceneDetection"),
        t("mainPage.whatYouCanDo.aiPowered.examples.colorGrading"),
        t("mainPage.whatYouCanDo.aiPowered.examples.audioEnhancement"),
        t("mainPage.whatYouCanDo.aiPowered.examples.subtitles"),
      ],
    },
    {
      title: t("mainPage.whatYouCanDo.effects.title"),
      description: t("mainPage.whatYouCanDo.effects.description"),
      examples: [
        t("mainPage.whatYouCanDo.effects.examples.transitions"),
        t("mainPage.whatYouCanDo.effects.examples.luts"),
        t("mainPage.whatYouCanDo.effects.examples.chromaKey"),
        t("mainPage.whatYouCanDo.effects.examples.speedRamping"),
      ],
    },
    {
      title: t("mainPage.whatYouCanDo.audio.title"),
      description: t("mainPage.whatYouCanDo.audio.description"),
      examples: [
        t("mainPage.whatYouCanDo.audio.examples.mixing"),
        t("mainPage.whatYouCanDo.audio.examples.surround"),
        t("mainPage.whatYouCanDo.audio.examples.effects"),
        t("mainPage.whatYouCanDo.audio.examples.voiceEnhancement"),
      ],
    },
    {
      title: t("mainPage.whatYouCanDo.export.title"),
      description: t("mainPage.whatYouCanDo.export.description"),
      examples: [
        t("mainPage.whatYouCanDo.export.examples.quality"),
        t("mainPage.whatYouCanDo.export.examples.directUpload"),
        t("mainPage.whatYouCanDo.export.examples.presets"),
        t("mainPage.whatYouCanDo.export.examples.hwAccelerated"),
      ],
    },
    {
      title: t("mainPage.whatYouCanDo.recognition.title"),
      description: t("mainPage.whatYouCanDo.recognition.description"),
      examples: [
        t("mainPage.whatYouCanDo.recognition.examples.faceObject"),
        t("mainPage.whatYouCanDo.recognition.examples.emotion"),
        t("mainPage.whatYouCanDo.recognition.examples.sceneClassification"),
        t("mainPage.whatYouCanDo.recognition.examples.quality"),
      ],
    },
  ];

  return (
    <section
      className="py-20 bg-[#12192C] relative overflow-hidden"
      data-oid="3v7hasa"
    >
      {/* Background effects */}
      <div className="absolute inset-0" data-oid="07-:99u">
        <div
          className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"
          data-oid="is781f2"
        />
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"
          data-oid="iux8bk4"
        />
      </div>

      <div
        className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10"
        data-oid="pzjci2t"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
          data-oid="wg:khcs"
        >
          <h2 className="section-title" data-oid="btw4f8n">
            {t("mainPage.whatYouCanDo.title")}{" "}
            <span className="text-gradient" data-oid="i6egno4">
              {t("mainPage.whatYouCanDo.titleHighlight")}
            </span>
          </h2>
          <p
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            data-oid="m3p.6u2"
          >
            {t("mainPage.whatYouCanDo.subtitle")}
          </p>
        </motion.div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          data-oid="d26en-m"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-xl"
              data-oid="xgpma8:"
            >
              {/* Glassmorphism background */}
              <div
                className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                data-oid="z37tri6"
              />
              <div className="absolute inset-0 bg-white/2" data-oid="2wjhh6p" />

              {/* Border gradient */}
              <div
                className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                data-oid="id-g5k2"
              >
                <div
                  className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                  data-oid="lijj0xm"
                />
              </div>

              {/* Content */}
              <div className="relative p-6" data-oid="f-pfsu-">
                <h3
                  className="text-xl font-semibold text-white mb-2"
                  data-oid="8:ba_sb"
                >
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4" data-oid="2qc798i">
                  {feature.description}
                </p>
                <ul className="space-y-2" data-oid="tw36ifx">
                  {feature.examples.map((example, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-300"
                      data-oid="puia1k."
                    >
                      <svg
                        className="w-4 h-4 text-green-400 mt-0.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        data-oid="ohaxfx2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                          data-oid="1sb2n.n"
                        />
                      </svg>
                      {example}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
