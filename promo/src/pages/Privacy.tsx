import { motion } from "framer-motion"
import type React from "react"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { SEO } from "../components/SEO"

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <SEO title="Privacy Policy" description="Privacy Policy for Timeline Studio. Learn how we handle your data." url="/privacy" />
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
                <span className="text-gradient">Privacy Policy</span>
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
                  <h2 className="text-3xl text-white mb-4">1. Introduction</h2>
                  <p>
                    Timeline Studio, Inc. ("we," "us," or "our") respects your privacy and is committed to protecting
                    your personal data. This privacy policy explains how we collect, use, disclose, and safeguard your
                    information when you use Timeline Studio desktop application and related services.
                  </p>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">2. Information We Collect</h2>
                  <p>We collect information you provide directly to us, such as:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>
                      <strong>Account Information:</strong> Name, email address, and password when you create an account
                    </li>
                    <li>
                      <strong>Payment Information:</strong> Billing details for paid subscriptions (processed securely
                      by third-party payment providers)
                    </li>
                    <li>
                      <strong>Content Data:</strong> Videos, images, and projects you create or upload (stored locally
                      or in cloud storage based on your plan)
                    </li>
                    <li>
                      <strong>Usage Data:</strong> Information about how you interact with Timeline Studio
                    </li>
                    <li>
                      <strong>Device Information:</strong> Operating system, hardware specifications, and app version
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">3. How We Use Your Information</h2>
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Provide, maintain, and improve Timeline Studio</li>
                    <li>Process transactions and send related information</li>
                    <li>Send technical notices, updates, and support messages</li>
                    <li>Respond to your comments, questions, and customer service requests</li>
                    <li>Monitor and analyze usage patterns to improve user experience</li>
                    <li>Detect, prevent, and address technical issues</li>
                    <li>Provide AI-powered features (content is processed locally when possible)</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">4. Data Storage and Security</h2>
                  <p>We implement appropriate technical and organizational measures to protect your personal data:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Local projects are stored on your device and are not accessible to us</li>
                    <li>Cloud storage is encrypted in transit and at rest</li>
                    <li>Access to personal data is restricted to authorized personnel only</li>
                    <li>We regularly review and update our security practices</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">5. AI Processing and Content Analysis</h2>
                  <p>Timeline Studio uses AI features for video editing assistance. Important points:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>AI processing happens locally on your device when possible</li>
                    <li>Cloud AI features only process content with your explicit consent</li>
                    <li>We do not use your content to train our AI models</li>
                    <li>Processed content is deleted from our servers after completion</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">6. Data Sharing</h2>
                  <p>
                    We do not sell, trade, or rent your personal information. We may share your information only in the
                    following circumstances:
                  </p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>With your consent</li>
                    <li>With service providers who assist in operating our service</li>
                    <li>To comply with legal obligations</li>
                    <li>To protect our rights, privacy, safety, or property</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights</h2>
                  <p>You have the right to:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Access and receive a copy of your personal data</li>
                    <li>Correct inaccurate or incomplete data</li>
                    <li>Delete your account and associated data</li>
                    <li>Export your projects and content</li>
                    <li>Opt-out of marketing communications</li>
                    <li>Disable analytics and usage tracking</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">8. Data Retention</h2>
                  <p>
                    We retain your information for as long as your account is active or as needed to provide services.
                    If you delete your account:
                  </p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Account data is deleted within 30 days</li>
                    <li>Cloud-stored content is permanently deleted</li>
                    <li>Local projects remain on your device</li>
                    <li>Some anonymized usage data may be retained for analytics</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
                  <p>
                    Timeline Studio is not intended for children under 13 years of age. We do not knowingly collect
                    personal information from children under 13. If you believe we have collected information from a
                    child under 13, please contact us immediately.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">10. International Data Transfers</h2>
                  <p>
                    Your information may be transferred to and processed in countries other than your own. We ensure
                    appropriate safeguards are in place to protect your information in accordance with this privacy
                    policy.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">11. Changes to This Policy</h2>
                  <p>
                    We may update this privacy policy from time to time. We will notify you of any changes by posting
                    the new policy on this page and updating the "Last updated" date.
                  </p>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">12. Contact Us</h2>
                  <p>If you have questions or concerns about this privacy policy, please contact us at:</p>
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

export default Privacy
