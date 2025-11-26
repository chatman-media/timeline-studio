import { motion } from "framer-motion"
import type React from "react"
import { Link } from "react-router-dom"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { useLanguage } from "../contexts/LanguageContext"

export const Investors: React.FC = () => {
  const { language } = useLanguage()

  const content = {
    ru: {
      title: "Инвестиционная возможность",
      subtitle: "Присоединяйтесь к революции в AI-видеоредактировании",
      raising: "Мы привлекаем",
      seedRound: "Seed Round",
      forEquity: "за 10% equity",
      problem: {
        title: "Проблема",
        text: "Видеоредактирование остается сложным и времязатратным процессом. Существующие решения либо слишком дорогие (Adobe $23/мес), либо слишком ограниченные. AI инструменты разрознены и требуют подписок на множество сервисов.",
      },
      solution: {
        title: "Решение",
        text: "Timeline Studio — первый AI-native видеоредактор с 100+ встроенными AI инструментами. Локальная обработка обеспечивает приватность и скорость. Open Source модель гарантирует прозрачность и доверие сообщества.",
      },
      market: {
        title: "Рынок $45.1 млрд",
        items: [
          "Видеоредакторы: $2.15B (CAGR 13.4%)",
          "Live Streaming: $15.3B (CAGR 28.1%)",
          "Viral контент: $8.2B (CAGR 35%)",
          "AI аватары: $3.8B (CAGR 47%)",
          "Мобильные платформы: $15.7B (CAGR 22.3%)",
        ],
      },
      traction: {
        title: "Traction",
        items: [
          { value: "100+", label: "AI инструментов" },
          { value: "95%", label: "готовность продукта" },
          { value: "10K+", label: "тестов" },
          { value: "60 FPS", label: "производительность" },
        ],
      },
      useOfFunds: {
        title: "Использование средств",
        items: [
          { percent: "50%", label: "Команда (8 человек)", amount: "$500K" },
          { percent: "25%", label: "AI токены и инфраструктура", amount: "$250K" },
          { percent: "15%", label: "Маркетинг", amount: "$150K" },
          { percent: "10%", label: "Операционные расходы", amount: "$100K" },
        ],
      },
      team: {
        title: "Команда",
        founder: "Alexander Kireyev",
        role: "Founder & CEO",
        bio: "15+ лет в разработке, экспертиза в видео и AI",
      },
      cta: {
        docs: "Полная документация",
        contact: "Связаться",
        email: "ak.chatman.media@gmail.com",
      },
    },
    en: {
      title: "Investment Opportunity",
      subtitle: "Join the AI video editing revolution",
      raising: "We're raising",
      seedRound: "Seed Round",
      forEquity: "for 10% equity",
      problem: {
        title: "Problem",
        text: "Video editing remains complex and time-consuming. Existing solutions are either too expensive (Adobe $23/mo) or too limited. AI tools are fragmented and require subscriptions to multiple services.",
      },
      solution: {
        title: "Solution",
        text: "Timeline Studio — the first AI-native video editor with 100+ built-in AI tools. Local processing ensures privacy and speed. Open Source model guarantees transparency and community trust.",
      },
      market: {
        title: "$45.1B Market",
        items: [
          "Video Editors: $2.15B (CAGR 13.4%)",
          "Live Streaming: $15.3B (CAGR 28.1%)",
          "Viral Content: $8.2B (CAGR 35%)",
          "AI Avatars: $3.8B (CAGR 47%)",
          "Mobile Platforms: $15.7B (CAGR 22.3%)",
        ],
      },
      traction: {
        title: "Traction",
        items: [
          { value: "100+", label: "AI tools" },
          { value: "95%", label: "product ready" },
          { value: "10K+", label: "tests" },
          { value: "60 FPS", label: "performance" },
        ],
      },
      useOfFunds: {
        title: "Use of Funds",
        items: [
          { percent: "50%", label: "Team (8 people)", amount: "$500K" },
          { percent: "25%", label: "AI tokens & infrastructure", amount: "$250K" },
          { percent: "15%", label: "Marketing", amount: "$150K" },
          { percent: "10%", label: "Operations", amount: "$100K" },
        ],
      },
      team: {
        title: "Team",
        founder: "Alexander Kireyev",
        role: "Founder & CEO",
        bio: "15+ years in development, expertise in video and AI",
      },
      cta: {
        docs: "Full Documentation",
        contact: "Get in Touch",
        email: "ak.chatman.media@gmail.com",
      },
    },
  }

  const t = language === "ru" ? content.ru : content.en

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 hero-gradient" />

          <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              {/* Raising Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-3 mb-8 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-full border border-green-500/30">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-green-300 font-medium">{t.raising}</span>
                <span className="text-white font-bold text-xl">$1M</span>
                <span className="text-green-300">{t.seedRound}</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                <span className="text-gradient">{t.title}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                {t.subtitle}
              </p>

              {/* Key Numbers */}
              <div className="flex flex-wrap justify-center gap-8 mb-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">$1M</div>
                  <div className="text-gray-400">{t.seedRound}</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">10%</div>
                  <div className="text-gray-400">Equity</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white">$9M</div>
                  <div className="text-gray-400">Pre-money</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Problem & Solution */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Problem */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-red-500/5 border border-red-500/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{t.problem.title}</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{t.problem.text}</p>
              </motion.div>

              {/* Solution */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="p-8 rounded-2xl bg-green-500/5 border border-green-500/20"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{t.solution.title}</h3>
                </div>
                <p className="text-gray-300 leading-relaxed">{t.solution.text}</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Market & Traction */}
        <section className="py-20 bg-[#0a0f1e]">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Market */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl font-bold text-white mb-6">{t.market.title}</h3>
                <ul className="space-y-3">
                  {t.market.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Traction */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="text-3xl font-bold text-white mb-6">{t.traction.title}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {t.traction.items.map((item, i) => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-2xl font-bold text-purple-400">{item.value}</div>
                      <div className="text-sm text-gray-400">{item.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Use of Funds */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <h3 className="text-3xl font-bold text-white text-center mb-10">{t.useOfFunds.title}</h3>
              <div className="space-y-4">
                {t.useOfFunds.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="w-16 text-center">
                      <span className="text-xl font-bold text-purple-400">{item.percent}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-white">{item.label}</span>
                    </div>
                    <div className="text-gray-400">{item.amount}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-b from-[#12192C] to-[#0a0f1e]">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <h3 className="text-3xl font-bold text-white mb-8">{t.cta.contact}</h3>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <Link
                  to="/project"
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  {t.cta.docs}
                </Link>
                <a
                  href={`mailto:${t.cta.email}`}
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/20"
                >
                  {t.cta.email}
                </a>
              </div>

              <div className="flex justify-center gap-6">
                <a
                  href="https://t.me/timelinestudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Telegram
                </a>
                <a
                  href="https://discord.gg/uvSBCw6e"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Discord
                </a>
                <a
                  href="https://github.com/chatman-media/timeline-studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  GitHub
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

export default Investors
