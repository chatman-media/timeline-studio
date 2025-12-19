import { motion } from "framer-motion";
import type React from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SearchDemo } from "../components/SearchDemo";

export const Demo: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="bmo5ui5">
      <Navigation data-oid="wrdw:a4" />

      <main className="flex-1" data-oid="6nj98tt">
        {/* Hero Section */}
        <section
          className="relative pt-32 pb-20 overflow-hidden"
          data-oid="718i30y"
        >
          {/* Background */}
          <div className="absolute inset-0 hero-gradient" data-oid="ydydr76" />

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="-1ctjd:"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center mb-12"
              data-oid="1umemeo"
            >
              <h1 className="page-title" data-oid="eoorwt-">
                <span className="text-gradient" data-oid="vy50tm.">
                  AI-Powered Video Creation
                </span>
              </h1>
              <p
                className="text-xl md:text-2xl text-gray-300 mb-4"
                data-oid="t:ss.rn"
              >
                Watch how Timeline Studio AI helps you create viral content in
                seconds
              </p>
              <p className="text-lg text-gray-400" data-oid="ep9rf5_">
                Type your idea and let AI do the magic ✨
              </p>
            </motion.div>

            {/* Demo Component */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="max-w-6xl mx-auto"
              data-oid="m08rq-z"
            >
              <SearchDemo data-oid="jdz79q." />
            </motion.div>

            {/* Features Grid */}
            <h2 className="sr-only" data-oid="8q4o0yh">
              Key Features
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
              data-oid="pnj88iw"
            >
              <div
                className="relative overflow-hidden rounded-xl"
                data-oid="zwkw:86"
              >
                {/* Glassmorphism background */}
                <div
                  className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                  data-oid="tzu:rig"
                />
                <div
                  className="absolute inset-0 bg-white/2"
                  data-oid="33039ui"
                />

                {/* Border gradient */}
                <div
                  className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                  data-oid="5tgfpii"
                >
                  <div
                    className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                    data-oid="yh-soe-"
                  />
                </div>

                {/* Content */}
                <div className="relative p-8" data-oid="u0j2nau">
                  <div className="text-4xl mb-4" data-oid="53b0lh:">
                    🎯
                  </div>
                  <div className="card-title" data-oid="kl2oka.">
                    Smart Analysis
                  </div>
                  <p className="card-description" data-oid="e3lc-lp">
                    AI analyzes trends and suggests the best content strategy
                    for maximum engagement
                  </p>
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-xl"
                data-oid="r4ta_tn"
              >
                {/* Glassmorphism background */}
                <div
                  className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                  data-oid="g8b:32t"
                />
                <div
                  className="absolute inset-0 bg-white/2"
                  data-oid="_hl-u8x"
                />

                {/* Border gradient */}
                <div
                  className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                  data-oid="6ev9j-y"
                >
                  <div
                    className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                    data-oid="sehcx3v"
                  />
                </div>

                {/* Content */}
                <div className="relative p-8" data-oid="qzhspy1">
                  <div className="text-4xl mb-4" data-oid="t3--uer">
                    ⚡
                  </div>
                  <div className="card-title" data-oid="nx0x6wq">
                    Instant Creation
                  </div>
                  <p className="card-description" data-oid="cywfg52">
                    Generate professional videos with trending effects and
                    transitions in seconds
                  </p>
                </div>
              </div>

              <div
                className="relative overflow-hidden rounded-xl"
                data-oid="027ht3m"
              >
                {/* Glassmorphism background */}
                <div
                  className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                  data-oid="tqo5zrn"
                />
                <div
                  className="absolute inset-0 bg-white/2"
                  data-oid="32-jf80"
                />

                {/* Border gradient */}
                <div
                  className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                  data-oid="w34szy6"
                >
                  <div
                    className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                    data-oid="7zhuw42"
                  />
                </div>

                {/* Content */}
                <div className="relative p-8" data-oid="s.31qyn">
                  <div className="text-4xl mb-4" data-oid="c1-gv2p">
                    📈
                  </div>
                  <div className="card-title" data-oid="0k7ad_o">
                    Viral Optimization
                  </div>
                  <p className="card-description" data-oid="__cf1uw">
                    Optimize timing, hashtags, and content format for each
                    social platform
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="max-w-4xl mx-auto mt-20 text-center"
              data-oid="_rzq1a4"
            >
              <h2 className="section-title" data-oid="xq7kipl">
                <span className="text-gradient" data-oid="lgl5d_:">
                  Ready to Go Viral?
                </span>
              </h2>
              <p className="text-lg text-gray-300 mb-8" data-oid="2ulhyj9">
                Join millions of creators using Timeline Studio to create
                engaging content
              </p>
              <div
                className="flex flex-wrap gap-4 justify-center"
                data-oid="pdgepi-"
              >
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl text-lg font-medium text-white bg-[#8b5cf6] hover:bg-[#7c3aed] transform hover:scale-[1.02] transition-all"
                  data-oid="-2hgrqr"
                >
                  Download Free ⭐
                </a>
                <Link
                  to="/pricing"
                  className="px-8 py-4 rounded-xl text-lg font-medium text-white bg-white/10 hover:bg-white/20 transition-colors transform hover:scale-[1.02]"
                  data-oid="dc_htmn"
                >
                  View Pricing
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer data-oid="ctlmm4z" />
    </div>
  );
};

export default Demo;
