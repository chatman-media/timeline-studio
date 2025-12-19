import type React from "react";
import { AnimatedSection } from "../components/AnimatedSection";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";
import { useTranslation } from "../hooks/useTranslation";

const FAQ: React.FC = () => {
  const { t } = useTranslation();

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
  ];

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid=".h:r10d">
      <SEO
        title="FAQ"
        description="Frequently asked questions about Timeline Studio. Learn about features, pricing, supported formats, and how to get started."
        url="/faq"
        data-oid="sirisub"
      />

      <Navigation data-oid="-g:fqn:" />

      <main className="flex-1" data-oid="jnnz7gi">
        <AnimatedSection animation="fadeIn" data-oid="jpbntu0">
          <section className="py-20 bg-[#12192C]" data-oid="b29wd-7">
            <div className="container mx-auto px-4" data-oid="wze6l:5">
              <div className="max-w-4xl mx-auto" data-oid=":62_fm2">
                <h1
                  className="page-title text-center mt-8 mb-16"
                  data-oid="sp1m69-"
                >
                  <span className="text-gradient" data-oid="lciz:i1">
                    {t("faq.title")}
                  </span>
                </h1>

                <div className="space-y-6" data-oid="w73p0fr">
                  {faqs.map((faq, index) => (
                    <AnimatedSection
                      key={index}
                      animation="fadeUp"
                      delay={index * 0.1}
                      data-oid="lihox7b"
                    >
                      <div className="glass-card" data-oid="lj1-bnk">
                        <div className="glass-card-bg" data-oid="duw6br1" />
                        <div
                          className="glass-card-overlay"
                          data-oid="wahkq._"
                        />
                        <div className="glass-card-border" data-oid="rzxh69:">
                          <div
                            className="glass-card-inner"
                            data-oid="9vohmzn"
                          />
                        </div>
                        <div className="glass-card-content" data-oid="ymypk0p">
                          <div className="card-title" data-oid="3vbrsu8">
                            {faq.question}
                          </div>
                          <p className="card-description" data-oid="7cmwnpm">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>

                <AnimatedSection
                  animation="fadeUp"
                  delay={0.5}
                  data-oid="kttyrwa"
                >
                  <div className="mt-16 text-center" data-oid="_enngub">
                    <h2 className="section-title mb-4" data-oid="purayc:">
                      <span className="text-gradient" data-oid="xdkwenk">
                        {t("faq.stillQuestions.title")}
                      </span>
                    </h2>
                    <p className="text-gray-300 mb-8" data-oid="h06q5up">
                      {t("faq.stillQuestions.description")}
                    </p>
                    <div
                      className="flex flex-col sm:flex-row gap-4 justify-center"
                      data-oid="mbknvz-"
                    >
                      <a
                        href="https://discord.gg/uvSBCw6e"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-[#5865F2] text-white font-medium rounded-xl hover:bg-[#4752C4] transition-colors"
                        data-oid="ede.bub"
                      >
                        {t("faq.stillQuestions.joinDiscord")}
                      </a>
                      <a
                        href="https://github.com/chatman-media/timeline-studio/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors"
                        data-oid="6m5t45v"
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

      <Footer data-oid="m-hycy1" />
    </div>
  );
};

export default FAQ;
