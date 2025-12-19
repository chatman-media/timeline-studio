import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Zap, Lock } from "lucide-react";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { useTranslation } from "../hooks/useTranslation";
import { GITHUB_RELEASES_URL, GITHUB_REPO_URL } from "../constants";

export function HeroSection() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setShowCanvas] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

  useEffect(() => {
    // Check if mobile and disable 3D on mobile for performance
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Delay loading 3D content for better initial page load
    const timer = setTimeout(() => {
      if (!isMobile) {
        setShowCanvas(true);
      }
    }, 100);

    return () => {
      window.removeEventListener("resize", checkMobile);
      clearTimeout(timer);
    };
  }, [isMobile]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{ position: "relative" }}
      data-oid="4aj3pu0"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 hero-gradient" data-oid="09t2:73" />

      {/* 3D Background - temporarily disabled due to dependency issues */}
      {/* {showCanvas && !isMobile && (
         <div className="absolute inset-0 opacity-30">
           <Suspense fallback={null}>
             <ThreeCanvas />
           </Suspense>
         </div>
        )} */}

      {/* Animated particles - reduced on mobile and with reduced motion */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0" data-oid="k29ivzs">
          {[...Array(isMobile ? 5 : 20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-500 rounded-full"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, -window.innerHeight],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                delay: Math.random() * 5,
              }}
              style={{
                left: `${Math.random() * 100}%`,
              }}
              data-oid="-8or0x."
            />
          ))}
        </div>
      )}

      {/* Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 text-center px-6 max-w-6xl mx-auto"
        data-oid="5:japru"
      >
        {/* GitHub Badge & Beta Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex justify-center gap-3 mb-6"
          data-oid="xny.w90"
        >
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-full border border-white/10 transition-all"
            data-oid=".n60mbd"
          >
            <svg
              className="w-5 h-5 text-gray-300"
              fill="currentColor"
              viewBox="0 0 24 24"
              data-oid="1vj699x"
            >
              <path
                d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                data-oid="w:w1n:-"
              />
            </svg>
            <span
              className="text-sm text-gray-300 font-medium"
              data-oid="z2jc:cr"
            >
              {t("mainPage.hero.openSource")}
            </span>
          </a>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 backdrop-blur-sm rounded-full border border-blue-500/20"
            data-oid="qeta.gq"
          >
            <span
              className="text-sm text-blue-300 font-semibold"
              data-oid="-j4w-be"
            >
              {t("mainPage.hero.betaBadge")}
            </span>
            <span className="text-xs text-blue-200" data-oid="415xfhg">
              {t("mainPage.hero.betaFree")}
            </span>
          </div>

          <Link
            to="/investors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 backdrop-blur-sm rounded-full border border-green-500/30 transition-all"
            data-oid="eod1zwi"
          >
            <span className="relative flex h-2 w-2" data-oid="hjjg87x">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
                data-oid="__ooa8r"
              ></span>
              <span
                className="relative inline-flex rounded-full h-2 w-2 bg-green-500"
                data-oid="zgqfy89"
              ></span>
            </span>
            <span
              className="text-sm text-green-300 font-medium"
              data-oid="ybz23a."
            >
              {t("mainPage.hero.raisingSeed")}
            </span>
          </Link>
        </motion.div>

        <motion.h1
          initial={
            prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 30 }
          }
          animate={{ opacity: 1, y: 0 }}
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { duration: 0.8, delay: 0.3 }
          }
          className="text-4xl md:text-6xl font-semibold mb-6"
          data-oid="lk8xlvd"
        >
          {t("mainPage.hero.title")}
          <br data-oid="8k05uxp" />
          <span className="text-purple-400" data-oid="6plahfa">
            {t("mainPage.hero.subtitle")}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto"
          data-oid="baxd0nw"
        >
          {t("mainPage.hero.description.local")}{" "}
          <span className="text-green-400 font-semibold" data-oid="xotxdlw">
            {t("mainPage.hero.description.free")}
          </span>
          . {t("mainPage.hero.description.localAI")}
        </motion.p>

        {/* Key Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 mb-12"
          data-oid="3ooj-0t"
        >
          <div
            className="flex items-center gap-3 px-4 py-2 backdrop-blur-sm rounded-2xl shadow-2xl shadow-purple-500/10"
            data-oid="nvev1md"
          >
            <div className="p-2 bg-white/5 rounded-xl" data-oid="zxi.jzo">
              <Sparkles
                className="w-5 h-5 text-white drop-shadow-lg"
                data-oid="b.fit34"
              />
            </div>
            <div className="text-left" data-oid="7qp091w">
              <div className="text-sm text-gray-400" data-oid="y-t9:9k">
                AI Tools
              </div>
              <div className="text-xl font-bold text-white" data-oid="2_vdal_">
                100+
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-2 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-500/10"
            data-oid="f_0q8bd"
          >
            <div className="p-2 bg-white/5 rounded-xl" data-oid="l_fmhk-">
              <Zap
                className="w-5 h-5 text-white drop-shadow-lg"
                data-oid="su3:a2_"
              />
            </div>
            <div className="text-left" data-oid="sj3scq.">
              <div className="text-sm text-gray-400" data-oid="63ax3_8">
                Performance
              </div>
              <div className="text-xl font-bold text-white" data-oid="mvcbt_y">
                60 FPS
              </div>
            </div>
          </div>
          <div
            className="flex items-center gap-3 px-4 py-2 backdrop-blur-sm rounded-2xl shadow-2xl shadow-green-500/10"
            data-oid="qa8ezjt"
          >
            <div className="p-2 bg-white/5 rounded-xl" data-oid="z1l4coz">
              <Lock
                className="w-5 h-5 text-white drop-shadow-lg"
                data-oid="fp33ud4"
              />
            </div>
            <div className="text-left" data-oid="lbyia..">
              <div className="text-sm text-gray-400" data-oid="g6tb9jq">
                Privacy
              </div>
              <div className="text-xl font-bold text-white" data-oid=".ay1x5f">
                100%
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          data-oid="yqrjkj9"
        >
          <a
            href={GITHUB_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-8 py-4 rounded-xl text-lg font-medium text-white overflow-hidden transform hover:scale-[1.02] transition-transform"
            data-oid="yc.687s"
          >
            {/* Background with purple base */}
            <div
              className="absolute inset-0 bg-[#8b5cf6] rounded-xl"
              data-oid="_.60v0x"
            />

            {/* Kiro-style spreading effect on hover */}
            <div
              className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-150 group-hover:scale-y-220"
              data-oid="k8qb2rd"
            />

            {/* Text */}
            <span
              className="relative z-20 flex items-center gap-2 group-hover:text-[#8b5cf6] transition-colors duration-500"
              data-oid="s.fvs2."
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                data-oid="98ia8r9"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  data-oid="2zzwwoi"
                />
              </svg>
              {t("mainPage.hero.downloadFree")}
            </span>
          </a>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative px-8 py-4 rounded-xl text-lg font-medium text-white overflow-hidden transform hover:scale-[1.02] transition-transform border border-white/20"
            data-oid="k4ykjjm"
          >
            <div
              className="absolute inset-0 bg-white/5 rounded-xl"
              data-oid="bhdur.k"
            />
            <div
              className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              data-oid="rl.adyz"
            />
            <span
              className="relative z-10 flex items-center gap-2"
              data-oid="ste-3op"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                data-oid="av0m93-"
              >
                <path
                  d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
                  data-oid="rk-0syy"
                />
              </svg>
              {t("mainPage.hero.viewGithub")}
            </span>
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        data-oid="5omtj0q"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
          data-oid="dws6f31"
        >
          <div
            className="w-1 h-3 bg-gray-400 rounded-full mt-2"
            data-oid="fylv78q"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
