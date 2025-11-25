import type React from "react"
import { AnimatedSection } from "../components/AnimatedSection"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { useTranslation } from "../hooks/useTranslation"

const FAQ: React.FC = () => {
  const { t } = useTranslation()

  const faqs = [
    {
      question: t("faq.questions.whatIs.question"),
      answer: t("faq.questions.whatIs.answer"),
    },
    {
      question: t("faq.questions.isFree.question"),
      answer: t("faq.questions.isFree.answer"),
    },
    {
      question: t("faq.questions.formats.question"),
      answer: t("faq.questions.formats.answer"),
    },
    {
      question: t("faq.questions.commercial.question"),
      answer: t("faq.questions.commercial.answer"),
    },
    {
      question: t("faq.questions.requirements.question"),
      answer: t("faq.questions.requirements.answer"),
    },
    {
      question: t("faq.questions.aiHow.question"),
      answer: t("faq.questions.aiHow.answer"),
    },
    {
      question: t("faq.questions.dataSafe.question"),
      answer: t("faq.questions.dataSafe.answer"),
    },
    {
      question: t("faq.questions.contribute.question"),
      answer: t("faq.questions.contribute.answer"),
    },
  ]

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />

      <main className="flex-1">
        <AnimatedSection animation="fadeIn">
          <section className="py-20 bg-[#12192C]">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h1 className="page-title text-center mt-8 mb-16">
                  <span className="text-gradient">{t("faq.title")}</span>
                </h1>

                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <AnimatedSection key={index} animation="fadeUp" delay={index * 0.1}>
                      <div className="glass-card">
                        <div className="glass-card-bg" />
                        <div className="glass-card-overlay" />
                        <div className="glass-card-border">
                          <div className="glass-card-inner" />
                        </div>
                        <div className="glass-card-content">
                          <div className="card-title">{faq.question}</div>
                          <p className="card-description">{faq.answer}</p>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>

                <AnimatedSection animation="fadeUp" delay={0.5}>
                  <div className="mt-16 text-center">
                    <h2 className="section-title mb-4">
                      <span className="text-gradient">{t("faq.stillQuestions.title")}</span>
                    </h2>
                    <p className="text-gray-300 mb-8">{t("faq.stillQuestions.description")}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a
                        href="https://discord.gg/uvSBCw6e"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-[#5865F2] text-white font-medium rounded-xl hover:bg-[#4752C4] transition-colors"
                      >
                        {t("faq.stillQuestions.joinDiscord")}
                      </a>
                      <a
                        href="https://github.com/chatman-media/timeline-studio/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors"
                      >
                        {t("faq.stillQuestions.openIssue")}
                      </a>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>

      <Footer />
    </div>
  )
}

export default FAQ
