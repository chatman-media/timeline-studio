import { motion } from "framer-motion"
import { Zap, Sparkles, Film, Star, Code, Hexagon } from "lucide-react"
import { AnimatedSection } from "./AnimatedSection"

const effects = [
  { name: "Glitch", icon: <Zap className="w-8 h-8" />, color: "from-red-500 to-orange-500" },
  { name: "Blur", icon: <Sparkles className="w-8 h-8" />, color: "from-blue-500 to-cyan-500" },
  { name: "Vintage", icon: <Film className="w-8 h-8" />, color: "from-amber-500 to-yellow-500" },
  { name: "Neon", icon: <Star className="w-8 h-8" />, color: "from-purple-500 to-pink-500" },
  { name: "Matrix", icon: <Code className="w-8 h-8" />, color: "from-green-500 to-emerald-500" },
  { name: "Hologram", icon: <Hexagon className="w-8 h-8" />, color: "from-indigo-500 to-purple-500" },
]

export function EffectsSection() {
  return (
    <section id="effects" className="py-20 bg-gray-800/50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fadeUp">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Эффекты <span className="text-gradient">нового уровня</span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Более 100 профессиональных эффектов с GPU-ускорением и предпросмотром в реальном времени
            </p>
          </div>
        </AnimatedSection>

        {/* Effects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
          {effects.map((effect, index) => (
            <AnimatedSection key={effect.name} animation="scaleIn" delay={index * 0.1}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="glass-card p-6 rounded-xl text-center cursor-pointer group"
              >
                <div
                  className={`w-16 h-16 mx-auto mb-3 bg-gradient-to-r ${effect.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-white`}
                >
                  {effect.icon}
                </div>
                <p className="text-white font-medium">{effect.name}</p>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* Showcase */}
        <AnimatedSection animation="fadeIn" delay={0.6}>
          <div className="glass-dark rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Realtime Preview</h3>
                <p className="text-gray-400 mb-6">
                  Применяйте эффекты мгновенно и видьте результат без рендеринга. GPU-ускорение обеспечивает плавную
                  работу даже с 4K видео.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Без задержек и лагов
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Настройка параметров в реальном времени
                  </li>
                  <li className="flex items-center text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Комбинирование нескольких эффектов
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: [-400, 400] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl">✨</span>
                  </div>
                </div>
                <motion.div
                  className="absolute -bottom-4 -right-4 glass px-4 py-2 rounded-lg"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 }}
                >
                  <span className="text-sm text-white font-medium">60 FPS</span>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
