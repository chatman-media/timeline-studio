import { motion } from "framer-motion"
import type React from "react"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { SEO } from "../components/SEO"

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <SEO title="Terms of Service" description="Terms of Service for Timeline Studio video editor." url="/terms" />
      <Navigation />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-12 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 hero-gradient opacity-30" />

          <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
            >
              <h1 className="page-title">
                <span className="text-gradient">Terms of Service</span>
              </h1>
              <p className="text-gray-400">Last updated: July 28, 2025</p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 pb-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-4xl mx-auto prose prose-invert prose-lg"
            >
              <div className="space-y-8 text-gray-300">
                <div>
                  <h2 className="text-3xl text-white mb-4">1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using Timeline Studio ("the Service"), you agree to be bound by these Terms of
                    Service ("Terms"). If you do not agree to these Terms, please do not use the Service. Timeline
                    Studio, Inc. ("we," "us," or "our") reserves the right to update and change these Terms at any time
                    without notice.
                  </p>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">2. Description of Service</h2>
                  <p>
                    Timeline Studio is a desktop video editing application that provides AI-powered editing tools,
                    multi-platform export capabilities, and cloud storage services. The Service includes both free and
                    paid subscription options with varying features and limitations.
                  </p>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">3. User Accounts</h2>
                  <p>
                    To access certain features of the Service, you may be required to create an account. You are
                    responsible for:
                  </p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Maintaining the confidentiality of your account credentials</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized use</li>
                    <li>Providing accurate and complete information</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">4. Acceptable Use</h2>
                  <p>You agree not to use Timeline Studio to:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Violate any laws or regulations</li>
                    <li>Infringe upon intellectual property rights</li>
                    <li>Create or distribute harmful, offensive, or illegal content</li>
                    <li>Attempt to gain unauthorized access to the Service</li>
                    <li>Interfere with or disrupt the Service or servers</li>
                    <li>Use the Service for any unauthorized commercial purposes</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">5. Intellectual Property</h2>
                  <p>
                    The Service and its original content, features, and functionality are owned by Timeline Studio, Inc.
                    and are protected by international copyright, trademark, patent, trade secret, and other
                    intellectual property laws. You retain all rights to content you create using the Service.
                  </p>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">6. User Content</h2>
                  <p>
                    You retain ownership of all content you create, upload, or process using Timeline Studio. By using
                    the Service, you grant us a limited license to process and store your content solely for the purpose
                    of providing the Service. We do not claim ownership of your content and will not use it for any
                    purpose other than providing the Service.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">7. Privacy</h2>
                  <p>
                    Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy,
                    which also governs the Service and informs users of our data collection practices.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">8. Subscriptions and Payments</h2>
                  <p>
                    Some aspects of the Service may be provided for a fee. You will be required to select a subscription
                    plan and provide payment information. By providing payment information, you represent and warrant
                    that:
                  </p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>You have the legal right to use any payment method provided</li>
                    <li>The information you supply is true, correct, and complete</li>
                    <li>You will promptly update payment information if it changes</li>
                  </ul>
                  <p className="mt-3">
                    Subscription fees are billed in advance on a monthly or annual basis and are non-refundable except
                    as required by law.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">9. Termination</h2>
                  <p>
                    We may terminate or suspend your account and access to the Service immediately, without prior notice
                    or liability, for any reason, including breach of these Terms. Upon termination, your right to use
                    the Service will immediately cease.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">10. Disclaimer</h2>
                  <p>
                    The Service is provided "as is" and "as available" without any warranties of any kind, either
                    express or implied. We do not warrant that the Service will be uninterrupted, timely, secure, or
                    error-free.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">11. Limitation of Liability</h2>
                  <p>
                    In no event shall Timeline Studio, Inc., its directors, employees, partners, agents, suppliers, or
                    affiliates be liable for any indirect, incidental, special, consequential, or punitive damages,
                    including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">12. Governing Law</h2>
                  <p>
                    These Terms shall be governed and construed in accordance with the laws of the United States,
                    without regard to its conflict of law provisions. Any disputes arising from these Terms will be
                    resolved in the courts of the United States.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">13. Changes to Terms</h2>
                  <p>
                    We reserve the right to modify or replace these Terms at any time. If a revision is material, we
                    will provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">14. Contact Information</h2>
                  <p>If you have any questions about these Terms, please contact us at:</p>
                  <ul className="list-none mt-3 space-y-1">
                    <li>Email: ak.chatman.media@gmail.com</li>
                    <li>Website: https://timeline-studio.chatman.studio</li>
                  </ul>
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

export default Terms
