import { motion } from "framer-motion";
import type React from "react";
import { Clapperboard, Wrench, Lock, Zap, Rocket, Globe } from "lucide-react";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";
import { useTranslation } from "../hooks/useTranslation";
import { GITHUB_RELEASES_URL } from "../constants";

export const About: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="0-jkh1b">
      <SEO
        title="About"
        description="Timeline Studio is a professional open-source video editor with 100+ AI tools. Learn about our mission, features, and technology."
        url="/about"
        data-oid="ip3hnp9"
      />

      <Navigation data-oid="w0hi164" />

      <main className="flex-1" data-oid="chb0vb1">
        {/* Hero Banner */}
        <section
          className="relative pt-32 pb-20 overflow-hidden"
          data-oid="1xdl0n5"
        >
          {/* Background */}
          <div className="absolute inset-0 hero-gradient" data-oid="085o3z4" />

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="oco0aqd"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
              data-oid="5tbqx7i"
            >
              <h1 className="page-title" data-oid="es0a9k_">
                <span className="text-gradient" data-oid="uxc.82z">
                  {t("about.hero.title")}
                </span>
              </h1>
              <p
                className="text-xl md:text-2xl text-gray-300 mb-8"
                data-oid="rny:9a5"
              >
                {t("about.hero.subtitle")}
              </p>
              <div
                className="flex items-center justify-center space-x-4 text-gray-400"
                data-oid="2w6:g5q"
              >
                <span data-oid="i1y43h6">{t("about.hero.founded")}</span>
                <span data-oid="3i-g3cn">•</span>
                <span data-oid="sdxn-hu">{t("about.hero.remote")}</span>
                <span data-oid="bt2n2nb">•</span>
                <span data-oid="8:0m4.y">{t("about.hero.openSource")}</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Key Technologies Section */}
        <section className="py-20" data-oid="rkf9656">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="jopzqc2"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto"
              data-oid="isop.rn"
            >
              <h2
                className="text-4xl md:text-5xl mb-4 text-center"
                data-oid="_z_fi2s"
              >
                <span className="text-gradient" data-oid="1ml-elh">
                  {t("about.aiEditor.title")}
                </span>
              </h2>
              <p
                className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto"
                data-oid="1vukamx"
              >
                {t("about.aiEditor.subtitle")}
              </p>

              <div className="grid md:grid-cols-3 gap-8" data-oid="mpw.8jp">
                {/* AI Director */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden rounded-2xl"
                  data-oid="-ycokjo"
                >
                  <div
                    className="absolute inset-0 bg-linear-to-br from-blue-500/15 via-purple-500/15 to-pink-500/15 backdrop-blur-xl"
                    data-oid="odwmvzz"
                  />
                  <div
                    className="absolute inset-0 bg-white/2"
                    data-oid="k6:-rz-"
                  />
                  <div
                    className="absolute inset-0 rounded-2xl bg-linear-to-br from-blue-500/30 via-purple-500/30 to-pink-500/30 p-px"
                    data-oid="l-ej:6n"
                  >
                    <div
                      className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                      data-oid="_170jme"
                    />
                  </div>

                  <div className="relative p-8 h-full" data-oid="t-zs-b.">
                    <Clapperboard
                      className="w-12 h-12 text-white mb-6"
                      data-oid="lov6igi"
                    />
                    <h3
                      className="text-2xl font-medium text-white mb-4"
                      data-oid="hnn:gs4"
                    >
                      {t("about.aiDirector.title")}
                    </h3>
                    <p className="text-gray-300 mb-6" data-oid="89jy4yc">
                      {t("about.aiDirector.description")}
                    </p>
                    <ul
                      className="space-y-2 text-sm text-gray-400"
                      data-oid="p40hg:2"
                    >
                      <li data-oid="-:tt3zi">
                        • {t("about.aiDirector.feature1")}
                      </li>
                      <li data-oid="c-tf72r">
                        • {t("about.aiDirector.feature2")}
                      </li>
                      <li data-oid="0r2a_b6">
                        • {t("about.aiDirector.feature3")}
                      </li>
                      <li data-oid=":eyk5es">
                        • {t("about.aiDirector.feature4")}
                      </li>
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
                  data-oid="cag:zrm"
                >
                  <div
                    className="absolute inset-0 bg-linear-to-br from-green-500/15 via-teal-500/15 to-blue-500/15 backdrop-blur-xl"
                    data-oid="x6:ueqy"
                  />
                  <div
                    className="absolute inset-0 bg-white/2"
                    data-oid="3i_.mtm"
                  />
                  <div
                    className="absolute inset-0 rounded-2xl bg-linear-to-br from-green-500/30 via-teal-500/30 to-blue-500/30 p-px"
                    data-oid="-9eknt6"
                  >
                    <div
                      className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                      data-oid="3jiaz40"
                    />
                  </div>

                  <div className="relative p-8 h-full" data-oid="vq4g::.">
                    <Wrench
                      className="w-12 h-12 text-white mb-6"
                      data-oid="-gn9_pe"
                    />
                    <h3
                      className="text-2xl font-medium text-white mb-4"
                      data-oid="goowtao"
                    >
                      {t("about.aiTools.title")}
                    </h3>
                    <p className="text-gray-300 mb-6" data-oid="zmcfyv3">
                      {t("about.aiTools.description")}
                    </p>
                    <ul
                      className="space-y-2 text-sm text-gray-400"
                      data-oid="o3mi.ld"
                    >
                      <li data-oid="1lfd_tz">
                        • {t("about.aiTools.feature1")}
                      </li>
                      <li data-oid="ber5e4j">
                        • {t("about.aiTools.feature2")}
                      </li>
                      <li data-oid="r864yfh">
                        • {t("about.aiTools.feature3")}
                      </li>
                      <li data-oid="0deowcn">
                        • {t("about.aiTools.feature4")}
                      </li>
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
                  data-oid="ojlzlbr"
                >
                  <div
                    className="absolute inset-0 bg-linear-to-br from-amber-500/15 via-orange-500/15 to-red-500/15 backdrop-blur-xl"
                    data-oid="mrup_hj"
                  />
                  <div
                    className="absolute inset-0 bg-white/2"
                    data-oid="fjk4i-0"
                  />
                  <div
                    className="absolute inset-0 rounded-2xl bg-linear-to-br from-amber-500/30 via-orange-500/30 to-red-500/30 p-px"
                    data-oid="j.85:cq"
                  >
                    <div
                      className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                      data-oid="a4cxzij"
                    />
                  </div>

                  <div className="relative p-8 h-full" data-oid="6:42to0">
                    <Lock
                      className="w-12 h-12 text-white mb-6"
                      data-oid="ab28wbr"
                    />
                    <h3
                      className="text-2xl font-medium text-white mb-4"
                      data-oid="wfo-.ok"
                    >
                      {t("about.localModels.title")}
                    </h3>
                    <p className="text-gray-300 mb-6" data-oid="wsjhak2">
                      {t("about.localModels.description")}
                    </p>
                    <ul
                      className="space-y-2 text-sm text-gray-400"
                      data-oid="tyf_uep"
                    >
                      <li data-oid=":e8uuc4">
                        • {t("about.localModels.feature1")}
                      </li>
                      <li data-oid="19niddl">
                        • {t("about.localModels.feature2")}
                      </li>
                      <li data-oid="r5e-2wl">
                        • {t("about.localModels.feature3")}
                      </li>
                      <li data-oid="kt40m5e">
                        • {t("about.localModels.feature4")}
                      </li>
                    </ul>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20" data-oid="j1wtsa2">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid=".h5b0-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
              data-oid="i-q6a-e"
            >
              <h2
                className="text-4xl md:text-5xl mb-12 text-center"
                data-oid="113cxvs"
              >
                <span className="text-gradient" data-oid="lmek7:u">
                  {t("about.mission.title")}
                </span>
              </h2>
              <div
                className="relative overflow-hidden rounded-2xl"
                data-oid="b6ctp1u"
              >
                <div
                  className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                  data-oid=".32182g"
                />
                <div
                  className="absolute inset-0 bg-white/2"
                  data-oid="b_9_jld"
                />
                <div
                  className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                  data-oid="1-dpn5i"
                >
                  <div
                    className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                    data-oid="e3lhzqm"
                  />
                </div>

                <div className="relative p-8 md:p-12" data-oid="h8meykg">
                  <p
                    className="text-lg text-gray-300 leading-relaxed mb-6"
                    data-oid="rc1f:9i"
                  >
                    {t("about.mission.paragraph1")}
                  </p>
                  <p
                    className="text-lg text-gray-300 leading-relaxed"
                    data-oid=":f1k__w"
                  >
                    {t("about.mission.paragraph2")}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20" data-oid="v-_ntmu">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="9alwhfg"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-6xl mx-auto"
              data-oid="idyj4dq"
            >
              <h2
                className="text-4xl md:text-5xl mb-12 text-center"
                data-oid="zql9kwi"
              >
                <span className="text-gradient" data-oid="c78dw_e">
                  {t("about.corePrinciples.title")}
                </span>
              </h2>
              <div className="grid md:grid-cols-4 gap-6" data-oid="b4wux3j">
                {[
                  {
                    Icon: Lock,
                    title: t("about.corePrinciples.privacy.title"),
                    description: t("about.corePrinciples.privacy.description"),
                  },
                  {
                    Icon: Zap,
                    title: t("about.corePrinciples.speed.title"),
                    description: t("about.corePrinciples.speed.description"),
                  },
                  {
                    Icon: Rocket,
                    title: t("about.corePrinciples.innovation.title"),
                    description: t(
                      "about.corePrinciples.innovation.description",
                    ),
                  },
                  {
                    Icon: Globe,
                    title: t("about.corePrinciples.openSource.title"),
                    description: t(
                      "about.corePrinciples.openSource.description",
                    ),
                  },
                ].map((value, index) => (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-xl"
                    data-oid=":r2xg5b"
                  >
                    <div
                      className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                      data-oid="1b3nurj"
                    />
                    <div
                      className="absolute inset-0 bg-white/2"
                      data-oid="9q.cmui"
                    />
                    <div
                      className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                      data-oid="aeh0a2d"
                    >
                      <div
                        className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                        data-oid="1gji.z9"
                      />
                    </div>

                    <div className="relative p-6 h-full" data-oid="slhi9xq">
                      <div
                        className="flex items-center gap-3 mb-3"
                        data-oid=".rxzn8r"
                      >
                        <value.Icon
                          className="w-5 h-5 text-gray-400 shrink-0"
                          data-oid="cax9nf_"
                        />
                        <h3
                          className="text-lg font-medium text-white"
                          data-oid=":tl511e"
                        >
                          {value.title}
                        </h3>
                      </div>
                      <p className="text-gray-400 text-sm" data-oid="6iibp8v">
                        {value.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20" data-oid="jp--zyy">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="s1jxjxu"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
              data-oid="5ot3.89"
            >
              <h2
                className="text-4xl md:text-5xl mb-6 text-center"
                data-oid="up0fy4g"
              >
                <span className="text-gradient" data-oid="cht3iqv">
                  {t("about.team.title")}
                </span>
              </h2>
              <p className="text-lg text-gray-300 mb-12" data-oid="cq25qlb">
                {t("about.team.description")}
              </p>
              <div
                className="relative overflow-hidden rounded-2xl inline-block"
                data-oid="9aewvdd"
              >
                <div
                  className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                  data-oid="j2gin.v"
                />
                <div
                  className="absolute inset-0 bg-white/2"
                  data-oid="z8:.gi1"
                />
                <div
                  className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                  data-oid="5q39rkq"
                >
                  <div
                    className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                    data-oid=":v3tu9m"
                  />
                </div>

                <div className="relative p-8" data-oid=".amw:iu">
                  <div
                    className="flex items-center space-x-6"
                    data-oid="ni6:6-w"
                  >
                    <div
                      className="w-20 h-20 bg-[#8b5cf6] rounded-full flex items-center justify-center"
                      data-oid="z4ur:xo"
                    >
                      <span
                        className="text-2xl font-bold text-white"
                        data-oid="vvweina"
                      >
                        AK
                      </span>
                    </div>
                    <div className="text-left" data-oid="xsmq2qg">
                      <h3
                        className="text-2xl font-medium text-white"
                        data-oid="5gyr8li"
                      >
                        Alexander Kireyev
                      </h3>
                      <p className="text-gray-400 text-sm" data-oid="vycujql">
                        {t("about.team.founder")}
                      </p>
                      <a
                        href="mailto:ak.chatman.media@gmail.com"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                        data-oid="ak6g.q8"
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

        {/* Investor Documentation Section */}
        <section className="py-20 border-t border-gray-800" data-oid="35fgex4">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="9kj_kun"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto text-center"
              data-oid="pkweqns"
            >
              <h2 className="text-3xl md:text-4xl mb-6" data-oid=".lxf1_v">
                <span className="text-gradient" data-oid="c6b.imd">
                  {t("about.investor.title")}
                </span>
              </h2>
              <p className="text-lg text-gray-400 mb-8" data-oid=".nj7-2c">
                {t("about.investor.description")}
              </p>
              <a
                href="/#/project"
                className="group relative inline-block px-6 py-3 text-white font-medium rounded-xl overflow-hidden cursor-pointer"
                data-oid="einmbof"
              >
                {/* Background with purple base */}
                <div
                  className="absolute inset-0 bg-[#8b5cf6] rounded-xl"
                  data-oid="ll6:2li"
                />

                {/* Kiro-style spreading effect on hover */}
                <div
                  className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-150 group-hover:scale-y-220"
                  data-oid="b_9gfb:"
                />

                {/* Text */}
                <span
                  className="relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-500"
                  data-oid="i7q9s3i"
                >
                  {t("about.investor.viewDocs")}
                </span>
              </a>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20" data-oid="iphs:wd">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="fk8syt4"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto text-center"
              data-oid="1esz11v"
            >
              <h2
                className="text-4xl md:text-5xl mb-6 text-center"
                data-oid="8l6yqos"
              >
                <span className="text-gradient" data-oid="t21-ivw">
                  {t("about.cta.title")}
                </span>
              </h2>
              <p className="text-lg text-gray-300 mb-8" data-oid="ahuftsv">
                {t("about.cta.description")}
              </p>
              <div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                data-oid=".h7j2yl"
              >
                <a
                  href="https://github.com/chatman-media/timeline-studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors flex items-center justify-center space-x-2"
                  data-oid="_35iqnz"
                >
                  <span data-oid="gdox47q">
                    {t("about.cta.contributeGithub")}
                  </span>
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    data-oid="hrba0sb"
                  >
                    <path
                      d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                      data-oid="2nl-xcr"
                    />
                  </svg>
                </a>
                <a
                  href={GITHUB_RELEASES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative px-6 py-3 text-white font-medium rounded-xl overflow-hidden"
                  data-oid="cr2x6nb"
                >
                  {/* Background with purple base */}
                  <div
                    className="absolute inset-0 bg-[#8b5cf6] rounded-xl"
                    data-oid="hdm_.ng"
                  />

                  {/* Kiro-style spreading effect on hover */}
                  <div
                    className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-150 group-hover:scale-y-220"
                    data-oid="lnepgbg"
                  />

                  {/* Text */}
                  <span
                    className="relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-500"
                    data-oid="mryqrt8"
                  >
                    {t("about.cta.tryStudio")}
                  </span>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer data-oid="_d4dmt7" />
    </div>
  );
};

export default About;
