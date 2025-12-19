import { motion } from "framer-motion";
import type React from "react";
import { CheckIcon } from "../components/CheckIcon";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";
import { useTranslation } from "../hooks/useTranslation";

interface PricingTier {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cloudStorage: string;
  aiTokens: string;
  buttonText: string;
  highlighted?: boolean;
}

export const Pricing: React.FC = () => {
  const { t } = useTranslation();

  const pricingTiers: PricingTier[] = [
    {
      name: t("pricing.tiers.free.name"),
      price: t("pricing.tiers.free.price"),
      period: t("pricing.tiers.free.period"),
      description: t("pricing.tiers.free.description"),
      features: [
        "100+ AI tools (run locally)",
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
        "10K AI tokens/mo (Haiku, GPT-4o-mini, GPT-4o)",
        "AI avatars - 10 hours/mo",
        "AI video - 100 clips/mo",
        "34 premium transitions (3D, glitch)",
        "Stock 4K/8K - 100 downloads/mo",
        "Cloud sync 100GB",
        "Priority support",
      ],

      cloudStorage: "100GB",
      aiTokens: "10K mixed AI\n$2.95/1M avg",
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
        "500K AI tokens/mo (all models)",
        "100 hours avatar generation",
        "1000 video clips/mo",
        "Unlimited Stock footage",
        "1TB cloud storage",
        "100 hours rendering/mo",
        "Beta access to new AI",
        "Personal Discord channel",
      ],

      cloudStorage: "1TB",
      aiTokens: "500K all models\n100 hours",
      buttonText: t("pricing.tiers.max.buttonText"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="fxms82h">
      <SEO
        title="Pricing"
        description="Timeline Studio pricing plans. Free tier with local AI, Pro with cloud features, and Max for professionals. All local features are free forever."
        url="/pricing"
        data-oid="51abgp_"
      />

      <Navigation data-oid="yyia2q:" />

      <main className="flex-1" data-oid="60veivz">
        {/* Hero Section */}
        <section
          className="relative pt-32 pb-20 overflow-hidden"
          data-oid="a5k:z.z"
        >
          {/* Background */}
          <div className="absolute inset-0 hero-gradient" data-oid="6vc0dv4" />

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="kn4xhcf"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
              data-oid="u797ykt"
            >
              <h1 className="page-title" data-oid="z8q_myi">
                <span className="text-gradient" data-oid="z0tm5s7">
                  {t("pricing.title")}
                </span>
              </h1>
              <p
                className="text-xl md:text-2xl text-gray-300 mb-4"
                data-oid="_t7ic5p"
              >
                {t("pricing.subtitle")}
              </p>
              <p className="text-lg text-gray-400" data-oid="scahakf">
                {t("pricing.description")} ⚡
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20" data-oid="o.14ykc">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="04fae-2"
          >
            <div
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-full mx-auto items-stretch"
              data-oid="u8obv5g"
            >
              {pricingTiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative flex flex-col"
                  data-oid="vyqca20"
                >
                  {tier.highlighted && (
                    <div
                      className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10"
                      data-oid="zcaqddu"
                    >
                      <span
                        className="bg-[#8b5cf6] text-white text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wider"
                        data-oid="9sgo9rv"
                      >
                        {t("pricing.mostPopular")}
                      </span>
                    </div>
                  )}

                  <div
                    className="relative overflow-hidden rounded-2xl h-full"
                    data-oid="59p9l4:"
                  >
                    {/* Glassmorphism background */}
                    <div
                      className={`absolute inset-0 bg-linear-to-br ${
                        tier.highlighted
                          ? "from-blue-500/15 via-purple-500/15 to-pink-500/15"
                          : "from-purple-500/10 via-blue-500/10 to-pink-500/10"
                      } backdrop-blur-xl`}
                      data-oid="z8ezrpf"
                    />

                    <div
                      className="absolute inset-0 bg-white/2"
                      data-oid="8beg.:p"
                    />

                    {/* Border gradient */}
                    <div
                      className={`absolute inset-0 rounded-2xl bg-linear-to-br ${
                        tier.highlighted
                          ? "from-blue-500/30 via-purple-500/30 to-pink-500/30"
                          : "from-purple-500/20 via-transparent to-blue-500/20"
                      } p-px`}
                      data-oid=":tppbhj"
                    >
                      <div
                        className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                        data-oid="8ykm0ch"
                      />
                    </div>

                    {/* Content */}
                    <div
                      className="relative p-8 h-full flex flex-col"
                      data-oid="cjxqkp3"
                    >
                      <div className="text-center mb-8" data-oid="z.ge3d7">
                        <h3 className="card-title" data-oid="5m34jsg">
                          {tier.name}
                        </h3>
                        <div
                          className="flex items-baseline justify-center mb-4"
                          data-oid="-b-fnb0"
                        >
                          <span
                            className="text-5xl font-light text-white tracking-tight"
                            data-oid="qe-8vrf"
                          >
                            {tier.price}
                          </span>
                          <span
                            className="text-gray-400 ml-2"
                            data-oid="4y6lxaw"
                          >
                            {tier.period}
                          </span>
                        </div>
                        <p className="card-description" data-oid="5ibvc2c">
                          {tier.description}
                        </p>
                      </div>

                      {/* Cloud Storage & AI Tokens */}
                      <div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 p-4 bg-white/5 rounded-lg"
                        data-oid="wv0pswi"
                      >
                        <div className="text-center" data-oid="zt:d57.">
                          <p
                            className="text-xs text-gray-400 uppercase mb-1"
                            data-oid="iwlpw8:"
                          >
                            {t("pricing.cloudStorage")}
                          </p>
                          <p
                            className="text-sm sm:text-lg font-normal text-white break-words"
                            data-oid="qdi9z8n"
                          >
                            {tier.cloudStorage}
                          </p>
                        </div>
                        <div className="text-center" data-oid=".j_v6z1">
                          <p
                            className="text-xs text-gray-400 uppercase mb-1"
                            data-oid="8:jkuvs"
                          >
                            {t("pricing.aiTokens")}
                          </p>
                          <p
                            className="text-sm sm:text-lg font-normal text-white break-words whitespace-pre-line"
                            data-oid="zq-10b8"
                          >
                            {tier.aiTokens}
                          </p>
                        </div>
                      </div>

                      {/* Features */}
                      <ul
                        className="space-y-4 mb-8 flex-grow"
                        data-oid="yp:wx6:"
                      >
                        {tier.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start"
                            data-oid="c:aza.h"
                          >
                            <CheckIcon
                              className="w-5 h-5 text-green-400 mr-3 mt-0.5 shrink-0"
                              data-oid=":3yc:gi"
                            />
                            <span
                              className="text-gray-300 text-sm"
                              data-oid="4s1-6cr"
                            >
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA Button */}
                      <button
                        className="group relative w-full py-3 px-6 rounded-xl font-medium text-white overflow-hidden cursor-pointer"
                        data-oid="craee43"
                      >
                        {/* Background with purple base */}
                        <div
                          className="absolute inset-0 bg-[#8b5cf6] rounded-xl"
                          data-oid="hb.c7oq"
                        />

                        {/* Kiro-style spreading effect on hover */}
                        <div
                          className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-150 group-hover:scale-y-220"
                          data-oid="hdoxwag"
                        />

                        {/* Text */}
                        <span
                          className="relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-500"
                          data-oid="mbfw64w"
                        >
                          {tier.buttonText}
                        </span>
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
              data-oid="68tvm3p"
            >
              <h2 className="section-title" data-oid="he7hcca">
                <span className="text-gradient" data-oid="p.paa93">
                  {t("pricing.teamsEnterprise")}
                </span>
              </h2>

              <div
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                data-oid="n3zj3ds"
              >
                {/* Team Plan */}
                <div
                  className="relative overflow-hidden rounded-2xl"
                  data-oid="qsf--2e"
                >
                  <div
                    className="absolute inset-0 bg-linear-to-br from-green-500/10 via-teal-500/10 to-blue-500/10 backdrop-blur-xl"
                    data-oid="ku-hhe8"
                  />
                  <div
                    className="absolute inset-0 bg-white/2"
                    data-oid="-wed9o9"
                  />
                  <div
                    className="absolute inset-0 rounded-2xl bg-linear-to-br from-green-500/20 via-transparent to-teal-500/20 p-px"
                    data-oid="23ht5av"
                  >
                    <div
                      className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                      data-oid="8s.j4jm"
                    />
                  </div>

                  <div className="relative p-8" data-oid="fhxfys3">
                    <div
                      className="flex items-center justify-between mb-6"
                      data-oid="1zy:zq0"
                    >
                      <div data-oid="udp_z-5">
                        <h3
                          className="text-2xl font-medium text-white"
                          data-oid="xbw4.sv"
                        >
                          {t("pricing.tiers.team.name")}
                        </h3>
                        <p className="text-gray-400 text-sm" data-oid="5si.vus">
                          {t("pricing.tiers.team.description")}
                        </p>
                      </div>
                      <div className="text-right" data-oid="-t7kjav">
                        <span
                          className="text-4xl font-light text-white tracking-tight"
                          data-oid="pvamg:d"
                        >
                          {t("pricing.tiers.team.price")}
                        </span>
                        <span className="text-gray-400" data-oid="q90tn8c">
                          {t("pricing.perUserMonth")}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8" data-oid="bnj72zb">
                      <li className="flex items-start" data-oid="5eda6zu">
                        <CheckIcon
                          className="w-5 h-5 text-green-400 mr-3 mt-0.5 shrink-0"
                          data-oid="xs6-_on"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="pad7vt4"
                        >
                          {t("pricing.features.everythingInProBase")}
                        </span>
                      </li>
                      <li className="flex items-start" data-oid="cwmshwy">
                        <CheckIcon
                          className="w-5 h-5 text-green-400 mr-3 mt-0.5 shrink-0"
                          data-oid="uu6pj5y"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="dw0k872"
                        >
                          {t("pricing.features.realTimeCollaboration")}
                        </span>
                      </li>
                      <li className="flex items-start" data-oid="uew9bua">
                        <CheckIcon
                          className="w-5 h-5 text-green-400 mr-3 mt-0.5 shrink-0"
                          data-oid="nh2mu4_"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="1gl7-.-"
                        >
                          500GB per user
                        </span>
                      </li>
                      <li className="flex items-start" data-oid="0v1elsy">
                        <CheckIcon
                          className="w-5 h-5 text-green-400 mr-3 mt-0.5 shrink-0"
                          data-oid="q3e306p"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="a4_vxu1"
                        >
                          50 hours cloud rendering/month
                        </span>
                      </li>
                      <li className="flex items-start" data-oid=".9aq4us">
                        <CheckIcon
                          className="w-5 h-5 text-green-400 mr-3 mt-0.5 shrink-0"
                          data-oid="mr0egz8"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="odt_mth"
                        >
                          {t("pricing.features.teamResourceLibraries")}
                        </span>
                      </li>
                      <li className="flex items-start" data-oid="7k:ms3a">
                        <CheckIcon
                          className="w-5 h-5 text-green-400 mr-3 mt-0.5 shrink-0"
                          data-oid=":46cj5w"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="9a21iw."
                        >
                          {t("pricing.features.ssoAuthentication")}
                        </span>
                      </li>
                    </ul>

                    <button
                      className="group relative w-full py-4 px-8 rounded-xl text-white font-medium overflow-hidden cursor-pointer"
                      data-oid="o-dv3c4"
                    >
                      {/* Background with purple base */}
                      <div
                        className="absolute inset-0 bg-[#8b5cf6] rounded-xl"
                        data-oid="df9rttn"
                      />

                      {/* Kiro-style spreading effect on hover */}
                      <div
                        className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-150 group-hover:scale-y-220"
                        data-oid="r.ep9qj"
                      />

                      {/* Text */}
                      <span
                        className="relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-500"
                        data-oid="-mzzg:l"
                      >
                        {t("pricing.tiers.team.buttonText")}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Enterprise Plan */}
                <div
                  className="relative overflow-hidden rounded-2xl"
                  data-oid="036vup-"
                >
                  <div
                    className="absolute inset-0 bg-linear-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-xl"
                    data-oid="omz182g"
                  />
                  <div
                    className="absolute inset-0 bg-white/2"
                    data-oid="zo29t6d"
                  />
                  <div
                    className="absolute inset-0 rounded-2xl bg-linear-to-br from-amber-500/20 via-transparent to-orange-500/20 p-px"
                    data-oid="cxcf8ly"
                  >
                    <div
                      className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl"
                      data-oid="s8-7vyp"
                    />
                  </div>

                  <div className="relative p-8" data-oid="repq309">
                    <div
                      className="flex items-center justify-between mb-6"
                      data-oid="1y30g2z"
                    >
                      <div data-oid="jeh4:24">
                        <h3
                          className="text-2xl font-medium text-white"
                          data-oid="9i0lysb"
                        >
                          {t("pricing.tiers.enterprise.name")}
                        </h3>
                        <p className="text-gray-400 text-sm" data-oid="ppo9o9q">
                          {t("pricing.tiers.enterprise.description")}
                        </p>
                      </div>
                      <div className="text-right" data-oid="llh4_nl">
                        <span
                          className="text-2xl font-light text-white"
                          data-oid="v7:gasi"
                        >
                          {t("pricing.contactUs")}
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-3 mb-8" data-oid="mg.uz4:">
                      <li className="flex items-start" data-oid="wii5x12">
                        <CheckIcon
                          className="w-5 h-5 text-amber-400 mr-3 mt-0.5 shrink-0"
                          data-oid="jwpcdus"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="jgr-2hf"
                        >
                          {t("pricing.features.onPremiseDeployment")}
                        </span>
                      </li>
                      <li className="flex items-start" data-oid="5cdjxxn">
                        <CheckIcon
                          className="w-5 h-5 text-amber-400 mr-3 mt-0.5 shrink-0"
                          data-oid="n6k9tzm"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="b._hf41"
                        >
                          {t("pricing.features.unlimitedStorageRendering")}
                        </span>
                      </li>
                      <li className="flex items-start" data-oid="xykhlcq">
                        <CheckIcon
                          className="w-5 h-5 text-amber-400 mr-3 mt-0.5 shrink-0"
                          data-oid="f3q61zp"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="h7qcsqs"
                        >
                          {t("pricing.features.customAiModels")}
                        </span>
                      </li>
                      <li className="flex items-start" data-oid="8g.b79a">
                        <CheckIcon
                          className="w-5 h-5 text-amber-400 mr-3 mt-0.5 shrink-0"
                          data-oid="rwu7nzv"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="8c0jben"
                        >
                          {t("pricing.features.apiAccess")}
                        </span>
                      </li>
                      <li className="flex items-start" data-oid="-8aabb_">
                        <CheckIcon
                          className="w-5 h-5 text-amber-400 mr-3 mt-0.5 shrink-0"
                          data-oid="gkweivm"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="fce6x4-"
                        >
                          {t("pricing.features.dedicatedManagerSla")}
                        </span>
                      </li>
                      <li className="flex items-start" data-oid="wvog2gz">
                        <CheckIcon
                          className="w-5 h-5 text-amber-400 mr-3 mt-0.5 shrink-0"
                          data-oid="uezqatz"
                        />
                        <span
                          className="text-gray-300 text-sm"
                          data-oid="wp4rk0t"
                        >
                          {t("pricing.features.whiteLabelCustomization")}
                        </span>
                      </li>
                    </ul>

                    <button
                      className="w-full py-4 px-8 rounded-xl bg-white/10 text-white font-medium transition-all duration-300 transform hover:scale-[1.02] hover:bg-white/20 cursor-pointer"
                      data-oid="omgzk8e"
                    >
                      {t("pricing.tiers.enterprise.buttonText")}
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
              data-oid="owpj0t0"
            >
              <h2 className="section-title" data-oid="df3khpr">
                <span className="text-gradient" data-oid="r7y:av2">
                  {t("pricing.faq.title")}
                </span>
              </h2>

              <div className="space-y-6" data-oid="erhs9up">
                <div
                  className="relative overflow-hidden rounded-xl"
                  data-oid="saa.n.9"
                >
                  {/* Glassmorphism background */}
                  <div
                    className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                    data-oid="1isy3fx"
                  />
                  <div
                    className="absolute inset-0 bg-white/2"
                    data-oid="wqw3:rv"
                  />

                  {/* Border gradient */}
                  <div
                    className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                    data-oid=".quo0jl"
                  >
                    <div
                      className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                      data-oid="u:px9hg"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative p-6" data-oid="5la9-c:">
                    <h3 className="card-title" data-oid="2nrhcqe">
                      {t("pricing.faq.whatAreTokens.question")}
                    </h3>
                    <p className="card-description" data-oid="xtvkzks">
                      {t("pricing.faq.whatAreTokens.answer")}
                    </p>
                  </div>
                </div>

                <div
                  className="relative overflow-hidden rounded-xl"
                  data-oid="uyf4w:_"
                >
                  {/* Glassmorphism background */}
                  <div
                    className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                    data-oid="_q:2fij"
                  />
                  <div
                    className="absolute inset-0 bg-white/2"
                    data-oid="fqyky:e"
                  />

                  {/* Border gradient */}
                  <div
                    className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                    data-oid="ypm_lkw"
                  >
                    <div
                      className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                      data-oid="ea7q2ox"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative p-6" data-oid="xmqthwp">
                    <h3 className="card-title" data-oid="0vkrda:">
                      {t("pricing.faq.canUpgradeDowngrade.question")}
                    </h3>
                    <p className="card-description" data-oid="t2rmj0-">
                      {t("pricing.faq.canUpgradeDowngrade.answer")}
                    </p>
                  </div>
                </div>

                <div
                  className="relative overflow-hidden rounded-xl"
                  data-oid="jh0cnvr"
                >
                  {/* Glassmorphism background */}
                  <div
                    className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                    data-oid="p9vs-qw"
                  />
                  <div
                    className="absolute inset-0 bg-white/2"
                    data-oid="s3c9mhs"
                  />

                  {/* Border gradient */}
                  <div
                    className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                    data-oid="c-9p0k0"
                  >
                    <div
                      className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                      data-oid="t01niou"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative p-6" data-oid="m_ynfd7">
                    <h3 className="card-title" data-oid="9w8s4.5">
                      {t("pricing.faq.whyFreePowerful.question")}
                    </h3>
                    <p className="card-description" data-oid="1gk6jg0">
                      {t("pricing.faq.whyFreePowerful.answer")}
                    </p>
                  </div>
                </div>

                <div
                  className="relative overflow-hidden rounded-xl"
                  data-oid="sqxgjzz"
                >
                  {/* Glassmorphism background */}
                  <div
                    className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl"
                    data-oid="_mwsxa."
                  />
                  <div
                    className="absolute inset-0 bg-white/2"
                    data-oid="q4faczw"
                  />

                  {/* Border gradient */}
                  <div
                    className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px"
                    data-oid="-ydxugz"
                  >
                    <div
                      className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl"
                      data-oid="l-wi9l0"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative p-6" data-oid="3:j6o2l">
                    <h3 className="card-title" data-oid="7q8k7pi">
                      {t("pricing.faq.isThereFreeTrial.question")}
                    </h3>
                    <p className="card-description" data-oid="bczhv95">
                      {t("pricing.faq.isThereFreeTrial.answer")}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer data-oid="p2kfymr" />
    </div>
  );
};

export default Pricing;
