import { motion } from "framer-motion";
import type React from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";
import { useLanguage } from "../contexts/LanguageContext";

export const Investors: React.FC = () => {
  const { language } = useLanguage();

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
        title: "Показатели",
        items: [
          { value: "100+", label: "AI инструментов" },
          { value: "10K+", label: "тестов" },
          { value: "60 FPS", label: "производительность" },
        ],
      },
      useOfFunds: {
        title: "Использование средств",
        items: [
          { percent: "50%", label: "Команда (8 человек)", amount: "$500K" },
          {
            percent: "25%",
            label: "AI токены и инфраструктура",
            amount: "$250K",
          },
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
        title: "Progress",
        items: [
          { value: "100+", label: "AI tools" },
          { value: "10K+", label: "tests" },
          { value: "60 FPS", label: "performance" },
        ],
      },
      useOfFunds: {
        title: "Use of Funds",
        items: [
          { percent: "50%", label: "Team (8 people)", amount: "$500K" },
          {
            percent: "25%",
            label: "AI tokens & infrastructure",
            amount: "$250K",
          },
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
    zh: {
      title: "投资机会",
      subtitle: "加入AI视频编辑革命",
      raising: "我们正在筹集",
      seedRound: "种子轮",
      forEquity: "10%股权",
      problem: {
        title: "问题",
        text: "视频编辑仍然复杂且耗时。现有解决方案要么太贵（Adobe $23/月），要么功能有限。AI工具分散，需要订阅多个服务。",
      },
      solution: {
        title: "解决方案",
        text: "Timeline Studio——首个AI原生视频编辑器，内置100多个AI工具。本地处理确保隐私和速度。开源模式保证透明度和社区信任。",
      },
      market: {
        title: "$451亿市场",
        items: [
          "视频编辑器: $21.5亿 (CAGR 13.4%)",
          "直播: $153亿 (CAGR 28.1%)",
          "病毒式内容: $82亿 (CAGR 35%)",
          "AI头像: $38亿 (CAGR 47%)",
          "移动平台: $157亿 (CAGR 22.3%)",
        ],
      },
      traction: {
        title: "发展指标",
        items: [
          { value: "100+", label: "AI工具" },
          { value: "10K+", label: "测试用例" },
          { value: "60 FPS", label: "性能" },
        ],
      },
      useOfFunds: {
        title: "资金用途",
        items: [
          { percent: "50%", label: "团队（8人）", amount: "$500K" },
          { percent: "25%", label: "AI代币和基础设施", amount: "$250K" },
          { percent: "15%", label: "营销", amount: "$150K" },
          { percent: "10%", label: "运营", amount: "$100K" },
        ],
      },
      team: {
        title: "团队",
        founder: "Alexander Kireyev",
        role: "创始人兼CEO",
        bio: "15年以上开发经验，视频和AI领域专家",
      },
      cta: {
        docs: "完整文档",
        contact: "联系我们",
        email: "ak.chatman.media@gmail.com",
      },
    },
  };

  const t =
    language === "zh"
      ? content.zh
      : language === "ru"
        ? content.ru
        : content.en;

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <SEO
        title="Investors"
        description="Investment opportunity in Timeline Studio. Join the AI video editing revolution. Seed round open."
        url="/investors"
      />
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
              <div className="inline-flex items-center gap-2 px-6 py-3 mb-8 bg-linear-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-full border border-green-500/30">
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
                    <svg
                      className="w-6 h-6 text-red-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {t.problem.title}
                  </h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {t.problem.text}
                </p>
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
                    <svg
                      className="w-6 h-6 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    {t.solution.title}
                  </h3>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  {t.solution.text}
                </p>
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
                <h3 className="text-3xl font-bold text-white mb-6">
                  {t.market.title}
                </h3>
                <ul className="space-y-3">
                  {t.market.items.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 text-gray-300"
                    >
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
                <h3 className="text-3xl font-bold text-white mb-6">
                  {t.traction.title}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {t.traction.items.map((item, i) => (
                    <div
                      key={i}
                      className="p-4 bg-white/5 rounded-xl border border-white/10"
                    >
                      <div className="text-2xl font-bold text-purple-400">
                        {item.value}
                      </div>
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
              <h3 className="text-3xl font-bold text-white text-center mb-10">
                {t.useOfFunds.title}
              </h3>
              <div className="space-y-4">
                {t.useOfFunds.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div className="w-16 text-center">
                      <span className="text-xl font-bold text-purple-400">
                        {item.percent}
                      </span>
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
        <section className="py-20 bg-linear-to-b from-[#12192C] to-[#0a0f1e]">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <h3 className="text-3xl font-bold text-white mb-8">
                {t.cta.contact}
              </h3>

              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <Link
                  to="/project"
                  className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  {t.cta.docs}
                </Link>
                <a
                  href="https://t.me/alexanderkireev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/20 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.944 0A12 12 0 1 0 24 12a12 12 0 0 0-12.056-12zM16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                  @alexanderkireev
                </a>
              </div>

              <div className="flex justify-center gap-6">
                <a
                  href="https://t.me/timelinestudio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Telegram Channel
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
  );
};

export default Investors;
