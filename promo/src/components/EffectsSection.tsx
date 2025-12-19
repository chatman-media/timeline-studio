import { motion } from "framer-motion";
import { Zap, Sparkles, Film, Star, Code, Hexagon } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";

const effects = [
  {
    name: "Glitch",
    icon: <Zap className="w-8 h-8" data-oid=":6elqah" />,
    color: "from-red-500 to-orange-500",
  },
  {
    name: "Blur",
    icon: <Sparkles className="w-8 h-8" data-oid="vqa.5te" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    name: "Vintage",
    icon: <Film className="w-8 h-8" data-oid="ekb_504" />,
    color: "from-amber-500 to-yellow-500",
  },
  {
    name: "Neon",
    icon: <Star className="w-8 h-8" data-oid="yra9t.e" />,
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Matrix",
    icon: <Code className="w-8 h-8" data-oid="v_yryi-" />,
    color: "from-green-500 to-emerald-500",
  },
  {
    name: "Hologram",
    icon: <Hexagon className="w-8 h-8" data-oid="nnn:zpj" />,
    color: "from-indigo-500 to-purple-500",
  },
];

export function EffectsSection() {
  return (
    <section
      id="effects"
      className="py-20 bg-gray-800/50 relative overflow-hidden"
      data-oid="fue-ei_"
    >
      <div className="container mx-auto px-4" data-oid="hx7pd1q">
        <AnimatedSection animation="fadeUp" data-oid="fqjfryx">
          <div className="text-center mb-16" data-oid="d40e6m:">
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              data-oid=":aotvtn"
            >
              Эффекты{" "}
              <span className="text-gradient" data-oid="6s4c3w-">
                нового уровня
              </span>
            </h2>
            <div
              className="w-24 h-1 bg-linear-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"
              data-oid="w3pj.i."
            />
            <p
              className="text-xl text-gray-400 max-w-3xl mx-auto"
              data-oid="3aammbt"
            >
              Более 100 профессиональных эффектов с GPU-ускорением и
              предпросмотром в реальном времени
            </p>
          </div>
        </AnimatedSection>

        {/* Effects Grid */}
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16"
          data-oid="jc9pzm9"
        >
          {effects.map((effect, index) => (
            <AnimatedSection
              key={effect.name}
              animation="scaleIn"
              delay={index * 0.1}
              data-oid="_18oipa"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="glass-card p-6 rounded-xl text-center cursor-pointer group"
                data-oid="buo4p8t"
              >
                <div
                  className={`w-16 h-16 mx-auto mb-3 bg-linear-to-r ${effect.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-white`}
                  data-oid=".9fd.ji"
                >
                  {effect.icon}
                </div>
                <p className="text-white font-medium" data-oid="y2vmuux">
                  {effect.name}
                </p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* Showcase */}
        <AnimatedSection animation="fadeIn" delay={0.6} data-oid=".5s_iw0">
          <div
            className="glass-dark rounded-2xl p-8 max-w-4xl mx-auto"
            data-oid="pn00uft"
          >
            <div
              className="grid md:grid-cols-2 gap-8 items-center"
              data-oid="b005:oi"
            >
              <div data-oid="7b55iri">
                <h3
                  className="text-2xl font-bold text-white mb-4"
                  data-oid="g04:8.7"
                >
                  Realtime Preview
                </h3>
                <p className="text-gray-400 mb-6" data-oid="vbx3yho">
                  Применяйте эффекты мгновенно и видьте результат без
                  рендеринга. GPU-ускорение обеспечивает плавную работу даже с
                  4K видео.
                </p>
                <ul className="space-y-3" data-oid="rgqol72">
                  <li
                    className="flex items-center text-gray-300"
                    data-oid="x1lfsix"
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      data-oid="kfv462m"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                        data-oid="wy7.h7e"
                      />
                    </svg>
                    Без задержек и лагов
                  </li>
                  <li
                    className="flex items-center text-gray-300"
                    data-oid="1rt.5rq"
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      data-oid="1z-gxut"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                        data-oid="pcm8aes"
                      />
                    </svg>
                    Настройка параметров в реальном времени
                  </li>
                  <li
                    className="flex items-center text-gray-300"
                    data-oid="2mygjhb"
                  >
                    <svg
                      className="w-5 h-5 mr-3 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      data-oid="__s.t:s"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                        data-oid="nci-oaj"
                      />
                    </svg>
                    Комбинирование нескольких эффектов
                  </li>
                </ul>
              </div>
              <div className="relative" data-oid=".s:aqi0">
                <div
                  className="aspect-video bg-linear-to-br from-blue-900/20 to-purple-900/20 rounded-lg overflow-hidden"
                  data-oid="au-4pk:"
                >
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: [-400, 400] }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                    data-oid="x7wh9ea"
                  />

                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    data-oid="j40n.90"
                  >
                    <span className="text-6xl" data-oid="n8v1s0h">
                      ✨
                    </span>
                  </div>
                </div>
                <motion.div
                  className="absolute -bottom-4 -right-4 glass px-4 py-2 rounded-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                  data-oid="_2_xkn2"
                >
                  <span
                    className="text-sm text-white font-medium"
                    data-oid="vvz.20e"
                  >
                    60 FPS
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
