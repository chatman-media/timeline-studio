import { motion } from "framer-motion";
import type React from "react";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";
import { useTranslation } from "../hooks/useTranslation";

const Docs: React.FC = () => {
  const { t, language } = useTranslation();

  const docSections = [
    {
      title: t("docs.sections.gettingStarted.title"),
      icon: "🚀",
      items: [
        {
          name: t("docs.sections.gettingStarted.quickStart"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/01_project_docs/quick-start.md`,
        },
        {
          name: t("docs.sections.gettingStarted.installation"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/01_project_docs/installation.md`,
        },
        {
          name: t("docs.sections.gettingStarted.projectStructure"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/01_project_docs/project-structure.md`,
        },
      ],
    },
    {
      title: t("docs.sections.requirements.title"),
      icon: "📋",
      items: [
        {
          name: t("docs.sections.requirements.functional"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/02_requirements/functional-requirements.md`,
        },
        {
          name: t("docs.sections.requirements.technical"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/02_requirements/technical-requirements.md`,
        },
        {
          name: t("docs.sections.requirements.features"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/02_requirements/feature-specification.md`,
        },
      ],
    },
    {
      title: t("docs.sections.architecture.title"),
      icon: "🏗️",
      items: [
        {
          name: t("docs.sections.architecture.overview"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/01_project_docs/architecture-overview.md`,
        },
        {
          name: t("docs.sections.architecture.frontend"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/03_architecture/frontend/overview.md`,
        },
        {
          name: t("docs.sections.architecture.backend"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/03_architecture/backend/overview.md`,
        },
      ],
    },
    {
      title: t("docs.sections.development.title"),
      icon: "💻",
      items: [
        {
          name: t("docs.sections.development.guide"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/05_development/README.md`,
        },
        {
          name: t("docs.sections.development.commands"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/05_development/development-commands.md`,
        },
        {
          name: t("docs.sections.development.plugins"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/05_development/plugin-development.md`,
        },
        {
          name: t("docs.sections.development.codingStandards"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/05_development/coding-standards.md`,
        },
        {
          name: t("docs.sections.development.performance"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/05_development/performance.md`,
        },
        {
          name: t("docs.sections.development.testing"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/05_development/testing.md`,
        },
      ],
    },
    {
      title: t("docs.sections.api.title"),
      icon: "📚",
      items: [
        {
          name: t("docs.sections.api.media"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/04_api_reference/media-api.md`,
        },
        {
          name: t("docs.sections.api.timeline"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/04_api_reference/timeline-api.md`,
        },
        {
          name: t("docs.sections.api.recognition"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/04_api_reference/recognition-api.md`,
        },
        {
          name: t("docs.sections.api.aiChat"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/04_api_reference/ai-chat-api.md`,
        },
        {
          name: t("docs.sections.api.export"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/04_api_reference/export-api.md`,
        },
        {
          name: t("docs.sections.api.generated"),
          href: "/api-docs/",
          external: true,
        },
      ],
    },
    {
      title: t("docs.sections.integrations.title"),
      icon: "🔗",
      items: [
        {
          name: t("docs.sections.integrations.claude"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/04_api_reference/integrations/claude-api.md`,
        },
        {
          name: t("docs.sections.integrations.openai"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/04_api_reference/integrations/openai-api.md`,
        },
        {
          name: t("docs.sections.integrations.youtube"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/04_api_reference/integrations/youtube-api.md`,
        },
        {
          name: t("docs.sections.integrations.telegram"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/04_api_reference/integrations/telegram-api.md`,
        },
      ],
    },
    {
      title: t("docs.sections.deployment.title"),
      icon: "🚢",
      items: [
        {
          name: t("docs.sections.deployment.build"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/06_deployment/build-guide.md`,
        },
        {
          name: t("docs.sections.deployment.windows"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/06_deployment/platforms/windows.md`,
        },
        {
          name: t("docs.sections.deployment.macos"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/06_deployment/platforms/macos.md`,
        },
        {
          name: t("docs.sections.deployment.linux"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/06_deployment/platforms/linux.md`,
        },
        {
          name: t("docs.sections.deployment.oauth"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/06_deployment/oauth-setup.md`,
        },
      ],
    },
    {
      title: t("docs.sections.testing.title"),
      icon: "🧪",
      items: [
        {
          name: t("docs.sections.testing.guide"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/12_testing/README.md`,
        },
        {
          name: t("docs.sections.testing.backend"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/12_testing/backend-testing.md`,
        },
        {
          name: t("docs.sections.testing.realMedia"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/12_testing/testing-real-media.md`,
        },
      ],
    },
    {
      title: t("docs.sections.cicd.title"),
      icon: "🔄",
      items: [
        {
          name: t("docs.sections.cicd.setup"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/13_ci_cd/ci-cd-setup.md`,
        },
        {
          name: t("docs.sections.cicd.codecov"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/13_ci_cd/codecov-components.md`,
        },
      ],
    },
    {
      title: t("docs.sections.quality.title"),
      icon: "✅",
      items: [
        {
          name: t("docs.sections.quality.alphaGuide"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/14_quality_assurance/alpha-testing-guide.md`,
        },
      ],
    },
    {
      title: t("docs.sections.security.title"),
      icon: "🔒",
      items: [
        {
          name: t("docs.sections.security.guidelines"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/15_security/security-guidelines.md`,
        },
        {
          name: t("docs.sections.security.architecture"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/03_architecture/backend/security-architecture.md`,
        },
      ],
    },
    {
      title: t("docs.sections.tasks.title"),
      icon: "📋",
      items: [
        {
          name: t("docs.sections.tasks.active"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/08_tasks/active/README.md`,
        },
        {
          name: t("docs.sections.tasks.roadmap"),
          href: `https://github.com/chatman-media/timeline-studio/blob/main/docs/${language}/10_project_state/roadmap.md`,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <SEO
        title="Documentation"
        description="Timeline Studio documentation. Guides, tutorials, API reference, and developer resources."
        url="/docs"
      />
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 hero-gradient" />

          <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
            >
              <h1 className="page-title">
                <span className="text-gradient">{t("docs.title")}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4">
                {t("docs.subtitle")}
              </p>
              <p className="text-lg text-gray-400">
                {t("docs.description")} 📚
              </p>
            </motion.div>
          </div>
        </section>

        {/* Documentation Sections */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {docSections.map((section, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div className="relative overflow-hidden rounded-xl h-full">
                      {/* Glassmorphism background */}
                      <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                      <div className="absolute inset-0 bg-white/2" />

                      {/* Border gradient */}
                      <div className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px">
                        <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                      </div>

                      {/* Content */}
                      <div className="relative p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl">{section.icon}</span>
                          <div className="card-title">{section.title}</div>
                        </div>
                        <ul className="space-y-2">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex}>
                              {item.external ? (
                                <a
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-2 group text-sm"
                                >
                                  <span className="text-sm">→</span>
                                  <span className="text-sm group-hover:underline">
                                    {item.name}
                                  </span>
                                  <svg
                                    className="w-3 h-3 opacity-50"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                  </svg>
                                </a>
                              ) : (
                                <a
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-400 hover:text-gray-200 transition-colors flex items-center gap-2 group text-sm"
                                >
                                  <span className="text-sm">→</span>
                                  <span className="text-sm group-hover:underline">
                                    {item.name}
                                  </span>
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mt-16 text-center"
              >
                <div className="relative overflow-hidden rounded-xl inline-block">
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/2" />

                  {/* Border gradient */}
                  <div className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px">
                    <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>

                  {/* Content */}
                  <div className="relative p-8">
                    <h2 className="text-3xl font-medium text-white mb-4">
                      {t("docs.contribute.title")}
                    </h2>
                    <p className="text-gray-400 mb-6 text-sm">
                      {t("docs.contribute.description")}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a
                        href="https://github.com/chatman-media/timeline-studio/tree/main/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 justify-center"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                        {t("docs.contribute.viewGithub")}
                      </a>
                      <a
                        href="https://github.com/chatman-media/timeline-studio/blob/main/CONTRIBUTING.md"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-[#8b5cf6] text-white font-medium rounded-xl hover:bg-[#7c3aed] transition-all"
                      >
                        {t("docs.contribute.contributingGuide")}
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Docs;
