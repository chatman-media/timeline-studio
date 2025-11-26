import { motion } from "framer-motion";
import { AnimatedSection } from "./AnimatedSection";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Для начинающих",
    features: [
      "До 1080p экспорт",
      "Базовые эффекты",
      "5 проектов в месяц",
      "Водяной знак",
      "Базовая поддержка",
    ],
    buttonText: "Начать бесплатно",
    featured: false,
  },
  {
    name: "Pro",
    price: "19",
    description: "Для профессионалов",
    features: [
      "4K/8K экспорт",
      "Все 150+ эффектов",
      "Неограниченные проекты",
      "Без водяного знака",
      "10K AI токенов/мес (смесь моделей)",
      "Приоритетная поддержка",
      "Cloud синхронизация 100GB",
    ],
    buttonText: "Попробовать Pro",
    featured: true,
  },
  {
    name: "Team",
    price: "39",
    description: "Для команд",
    features: [
      "Всё из Pro",
      "На пользователя",
      "Совместная работа",
      "500GB на пользователя",
      "Админ панель",
      "API доступ",
      "Персональный менеджер",
    ],
    buttonText: "Связаться с нами",
    featured: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-800/50">
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fadeUp">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Выберите свой <span className="text-gradient">план</span>
            </h2>
            <div className="w-24 h-1 bg-linear-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Начните бесплатно и обновитесь в любое время
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <AnimatedSection
              key={plan.name}
              animation="fadeUp"
              delay={index * 0.1}
            >
              <motion.div
                whileHover={{ y: -10 }}
                className={`relative ${plan.featured ? "scale-105" : ""}`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#8b5cf6] text-white text-sm px-4 py-1 rounded-full">
                      Популярный
                    </span>
                  </div>
                )}

                <div
                  className={`glass-card p-8 rounded-2xl h-full ${plan.featured ? "border-2 border-[#8b5cf6]/50" : ""}`}
                >
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-400 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-white">
                        ${plan.price}
                      </span>
                      <span className="text-gray-400 ml-2">/месяц</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`group relative w-full py-3 px-6 rounded-xl font-medium overflow-hidden ${
                      plan.featured
                        ? "text-white"
                        : "glass text-white hover:bg-white/10 transition-all duration-300"
                    }`}
                  >
                    {plan.featured && (
                      <>
                        {/* Background with purple base */}
                        <div className="absolute inset-0 bg-[#8b5cf6] rounded-xl" />

                        {/* Kiro-style spreading effect on hover */}
                        <div className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-[150%] group-hover:scale-y-[220%]" />
                      </>
                    )}

                    {/* Text */}
                    <span
                      className={
                        plan.featured
                          ? "relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-500"
                          : ""
                      }
                    >
                      {plan.buttonText}
                    </span>
                  </button>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection animation="fadeUp" delay={0.4}>
          <div className="mt-16 text-center">
            <p className="text-gray-400">
              Все планы включают 14-дневную гарантию возврата денег.{" "}
              <a
                href="/pricing"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Подробнее о ценах →
              </a>
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
