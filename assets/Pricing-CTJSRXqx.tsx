import { CheckIcon } from "@heroicons/react/24/outline"
import { motion } from "framer-motion"
import type React from "react"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { useTranslation } from "../hooks/useTranslation"

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cloudStorage: string
  aiTokens: string
  buttonText: string
  highlighted?: boolean
}

export const Pricing: React.FC = () => {
  const { t } = useTranslation()

  const pricingTiers: PricingTier[] = [
    {
      name: t("pricing.tiers.free.name"),
      price: t("pricing.tiers.free.price"),
      period: t("pricing.tiers.free.period"),
      description: t("pricing.tiers.free.description"),
      features: [
        "151 AI tools (run locally)",
        "4K/8K export without watermarks",
        "Fairlight Audio professional editor",
        "40+ transitions & 100+ effects",
        "Face & object recognition",
        "Smart Montage AI auto-editing",
        "Free HD Stock library",
        "Direct social media publishing",
        "GPU acceleration",
      ],
      cloudStorage: t("pricing.localStorage"),
      aiTokens: t("pricing.localAI"),
      buttonText: t("pricing.tiers.free.buttonText"),
    },
    {
      name: t("pricing.tiers.pro.name"),
      price: t("pricing.tiers.pro.price"),
      period: t("pricing.tiers.pro.period"),
      description: t("pricing.tiers.pro.description"),
      features: [
        t("pricing.features.everythingInFree"),
        "Claude 3.5 - 50K tokens/mo",
        "GPT-4o - 30K tokens/mo",
        "AI avatars - 10 hours/mo",
        "AI video - 100 clips/mo",
        "34 premium transitions (3D, glitch)",
        "Stock 4K/8K - 100 downloads/mo",
        "Cloud sync 100GB",
        "Priority support",
      ],
      cloudStorage: "100GB",
      aiTokens: "50K Claude\n30K GPT-4",
      buttonText: t("pricing.tiers.pro.buttonText"),
      highlighted: true,
    },
    {
      name: t("pricing.tiers.max.name"),
      price: t("pricing.tiers.max.price"),
      period: t("pricing.tiers.max.period"),
      description: t("pricing.tiers.max.description"),
      features: [
        t("pricing.features.everythingInPro"),
        "500K AI tokens/mo",
        "100 hours avatar generation",
        "1000 video clips/mo",
        "Unlimited Stock footage",
        "1TB cloud storage",
        "100 hours rendering/mo",
        "Beta access to new AI",
        "Personal Discord channel",
      ],
      cloudStorage: "1TB",
      aiTokens: "500K tokens\n100 hours",
      buttonText: t("pricing.tiers.max.buttonText"),
    },
  ]

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 hero-gradient opacity-50" />

          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="page-title">
                <span className="text-gradient">{t("pricing.title")}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4">{t("pricing.subtitle")}</p>
              <p className="text-lg text-gray-400">{t("pricing.description")} ⚡</p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-full mx-auto items-stretch">
              {pricingTiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative flex flex-col"
                >
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wider">
                        {t("pricing.mostPopular")}
                      </span>
                    </div>
                  )}

                  <div className="relative overflow-hidden rounded-2xl h-full">
                    {/* Glassmorphism background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${
                        tier.highlighted
                          ? "from-blue-500/15 via-purple-500/15 to-pink-500/15"
                          : "from-purple-500/10 via-blue-500/10 to-pink-500/10"
                      } backdrop-blur-xl`}
                    />
                    <div className="absolute inset-0 bg-white/[0.02]" />

                    {/* Border gradient */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
                        tier.highlighted
                          ? "from-blue-500/30 via-purple-500/30 to-pink-500/30"
                          : "from-purple-500/20 via-transparent to-blue-500/20"
                      } p-[1px]`}
                    >
                      <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                    </div>

                    {/* Content */}
                    <div className="relative p-8 h-full flex flex-col">
                      <div className="text-center mb-8">
                        <h3 className="card-title">{tier.name}</h3>
                        <div className="flex items-baseline justify-center mb-4">
                          <span className="text-5xl font-light text-white tracking-tight">{tier.price}</span>
                          <span className="text-gray-400 ml-2">{tier.period}</span>
                        </div>
                        <p className="card-description">{tier.description}</p>
                      </div>

                      {/* Cloud Storage & AI Tokens */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 p-4 bg-white/5 rounded-lg">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 uppercase mb-1">{t("pricing.cloudStorage")}</p>
                          <p className="text-sm sm:text-lg font-normal text-white break-words">{tier.cloudStorage}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 uppercase mb-1">{t("pricing.aiTokens")}</p>
                          <p className="text-sm sm:text-lg font-normal text-white break-words whitespace-pre-line">
                            {tier.aiTokens}
                          </p>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-4 mb-8 flex-grow">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start">
                            <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <button
                        className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 cursor-pointer ${
                          tier.highlighted
                            ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600"
                            : "bg-white/10 text-white hover:bg-white/20"
                        }`}
                      >
                        {tier.buttonText}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Team & Enterprise Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-full mx-auto mt-20"
            >
              <h2 className="section-title">
                <span className="text-gradient">{t("pricing.teamsEnterprise")}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team Plan */}
                <div className="relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-teal-500/10 to-blue-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 via-transparent to-teal-500/20 p-[1px]">
                    <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-medium text-white">{t("pricing.tiers.team.name")}</h3>
                        <p className="text-gray-400 text-sm">{t("pricing.tiers.team.description")}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-light text-white tracking-tight">
                          {t("pricing.tiers.team.price")}
                        </span>
                        <span className="text-gray-400">{t("pricing.perUserMonth")}</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.everythingInProBase")}</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.realTimeCollaboration")}</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">500GB per user</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">50 hours cloud rendering/month</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.teamResourceLibraries")}</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.ssoAuthentication")}</span>
                      </li>
                    </ul>

                    <button className="relative group w-full py-4 px-8 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium transition-all duration-300 overflow-hidden transform hover:scale-[1.02]">
                      <span className="relative z-10">{t("pricing.tiers.team.buttonText")}</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div className="relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 via-transparent to-orange-500/20 p-[1px]">
                    <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-medium text-white">{t("pricing.tiers.enterprise.name")}</h3>
                        <p className="text-gray-400 text-sm">{t("pricing.tiers.enterprise.description")}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-light text-white">{t("pricing.contactUs")}</span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.onPremiseDeployment")}</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.unlimitedStorageRendering")}</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.customAiModels")}</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.apiAccess")}</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.dedicatedManagerSla")}</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{t("pricing.features.whiteLabelCustomization")}</span>
                      </li>
                    </ul>

                    <button className="relative group w-full py-4 px-8 rounded-xl bg-white/10 text-white font-medium transition-all duration-300 overflow-hidden transform hover:scale-[1.02] hover:bg-white/20">
                      <span className="relative z-10">{t("pricing.tiers.enterprise.buttonText")}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-6xl mx-auto mt-20"
            >
              <h2 className="section-title">
                <span className="text-gradient">{t("pricing.faq.title")}</span>
              </h2>

              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-xl">
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />

                  {/* Border gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                    <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  {/* Content */}
                  <div className="relative p-6">
                    <h3 className="card-title">{t("pricing.faq.whatAreTokens.question")}</h3>
                    <p className="card-description">{t("pricing.faq.whatAreTokens.answer")}</p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl">
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />

                  {/* Border gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                    <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  {/* Content */}
                  <div className="relative p-6">
                    <h3 className="card-title">{t("pricing.faq.canUpgradeDowngrade.question")}</h3>
                    <p className="card-description">{t("pricing.faq.canUpgradeDowngrade.answer")}</p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl">
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />

                  {/* Border gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                    <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  {/* Content */}
                  <div className="relative p-6">
                    <h3 className="card-title">{t("pricing.faq.whyFreePowerful.question")}</h3>
                    <p className="card-description">{t("pricing.faq.whyFreePowerful.answer")}</p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl">
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />

                  {/* Border gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                    <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  {/* Content */}
                  <div className="relative p-6">
                    <h3 className="card-title">{t("pricing.faq.isThereFreeTrial.question")}</h3>
                    <p className="card-description">{t("pricing.faq.isThereFreeTrial.answer")}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Pricing
