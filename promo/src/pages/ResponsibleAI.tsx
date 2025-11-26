import { motion } from "framer-motion"
import type React from "react"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { SEO } from "../components/SEO"

export const ResponsibleAI: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <SEO
        title="Responsible AI"
        description="Our commitment to responsible AI development. Ethical guidelines and safety practices at Timeline Studio."
        url="/responsible-ai"
      />
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
                <span className="text-gradient">Responsible AI Policy</span>
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
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8">
                  <p className="text-white font-medium">
                    At Timeline Studio, we are committed to developing and deploying AI technology responsibly. Our AI
                    features are designed to empower creators while respecting privacy, promoting fairness, and ensuring
                    transparency in how our technology works.
                  </p>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">1. Our AI Principles</h2>
                  <p>Timeline Studio's AI development and deployment are guided by the following core principles:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>
                      <strong>Human-Centered Design:</strong> AI should augment human creativity, not replace it
                    </li>
                    <li>
                      <strong>Transparency:</strong> Users should understand how AI features work and their limitations
                    </li>
                    <li>
                      <strong>Privacy First:</strong> User data and content remain private and secure
                    </li>
                    <li>
                      <strong>Fairness and Inclusivity:</strong> AI should work equitably for all users
                    </li>
                    <li>
                      <strong>Safety and Reliability:</strong> AI features must be thoroughly tested and reliable
                    </li>
                    <li>
                      <strong>User Control:</strong> Users maintain full control over AI-generated content
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">2. Ethical AI Use</h2>
                  <p>We design our AI features to promote ethical use and prevent harm:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>AI features are designed to enhance legitimate creative work</li>
                    <li>We prohibit use of our AI for creating deceptive or harmful content</li>
                    <li>Built-in safeguards prevent generation of inappropriate content</li>
                    <li>We do not support deepfakes or non-consensual content manipulation</li>
                    <li>AI-generated content is clearly marked when appropriate</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">3. Data Privacy and Security</h2>
                  <p>Your content and data are protected throughout the AI processing pipeline:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>
                      <strong>Local Processing:</strong> Many AI features run directly on your device
                    </li>
                    <li>
                      <strong>No Training on User Data:</strong> We never use your content to train our AI models
                    </li>
                    <li>
                      <strong>Temporary Processing:</strong> Cloud-processed content is deleted after completion
                    </li>
                    <li>
                      <strong>Encrypted Transmission:</strong> All data transfers are encrypted end-to-end
                    </li>
                    <li>
                      <strong>Data Minimization:</strong> We only process what's necessary for the requested feature
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-3xl text-white mb-4">4. AI Feature Transparency</h2>
                  <p>We believe in being transparent about our AI capabilities and limitations:</p>

                  <h3 className="text-lg font-semibold text-white mt-4 mb-2">Smart Montage AI</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Analyzes video content for key moments and transitions</li>
                    <li>Suggests edits based on content quality and pacing</li>
                    <li>All suggestions are reviewable and editable by users</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-white mt-4 mb-2">Scene Detection</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Identifies scene changes and important moments</li>
                    <li>Uses computer vision to understand content</li>
                    <li>Accuracy varies with video quality and content type</li>
                  </ul>

                  <h3 className="text-lg font-semibold text-white mt-4 mb-2">Auto-Translation</h3>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Provides subtitle translation in 13+ languages</li>
                    <li>Quality depends on source audio clarity</li>
                    <li>Always allows manual correction of translations</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">5. Bias Prevention and Fairness</h2>
                  <p>We actively work to prevent bias in our AI systems:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Regular testing across diverse content types and user groups</li>
                    <li>Continuous monitoring for unintended bias in AI outputs</li>
                    <li>Diverse training data to ensure broad applicability</li>
                    <li>User feedback mechanisms to report bias or unfair treatment</li>
                    <li>Regular audits of AI performance across different demographics</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">6. User Rights and Control</h2>
                  <p>You maintain complete control over AI features in Timeline Studio:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>
                      <strong>Opt-in by Default:</strong> AI features require explicit activation
                    </li>
                    <li>
                      <strong>Disable Anytime:</strong> Turn off any AI feature in settings
                    </li>
                    <li>
                      <strong>Review and Edit:</strong> All AI suggestions are editable
                    </li>
                    <li>
                      <strong>Export Original:</strong> Always maintain access to unprocessed content
                    </li>
                    <li>
                      <strong>Delete AI Data:</strong> Remove any AI-processed data on request
                    </li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">7. Responsible Development Process</h2>
                  <p>Our AI development follows strict ethical guidelines:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Ethics review for all new AI features before release</li>
                    <li>Extensive testing for safety and reliability</li>
                    <li>Regular security audits and penetration testing</li>
                    <li>Collaboration with AI safety researchers</li>
                    <li>Continuous improvement based on user feedback</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">8. Prohibited Uses</h2>
                  <p>The following uses of Timeline Studio's AI features are strictly prohibited:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Creating misleading or deceptive content</li>
                    <li>Generating content that violates others' rights</li>
                    <li>Producing harmful, offensive, or illegal material</li>
                    <li>Bypassing content moderation or safety features</li>
                    <li>Using AI to impersonate others without consent</li>
                    <li>Creating non-consensual intimate content</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">9. Accountability and Reporting</h2>
                  <p>We take responsibility for our AI technology:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Regular transparency reports on AI usage and safety</li>
                    <li>Clear channels for reporting AI-related concerns</li>
                    <li>Swift response to identified issues or misuse</li>
                    <li>Continuous improvement of safety measures</li>
                    <li>Collaboration with the broader AI safety community</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">10. Future Commitments</h2>
                  <p>As AI technology evolves, we commit to:</p>
                  <ul className="list-disc ml-6 mt-3 space-y-2">
                    <li>Staying current with AI safety best practices</li>
                    <li>Updating our policies as technology advances</li>
                    <li>Engaging with users on AI development priorities</li>
                    <li>Contributing to industry standards for responsible AI</li>
                    <li>Maintaining transparency about our AI roadmap</li>
                  </ul>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
                  <p>For questions, concerns, or feedback about our AI policies and practices:</p>
                  <ul className="list-none mt-3 space-y-1">
                    <li>Email: ak.chatman.media@gmail.com</li>
                    <li>Subject Line: "AI Policy Inquiry"</li>
                    <li>Response Time: Within 48 hours</li>
                  </ul>
                  <p className="mt-4">
                    We welcome feedback and suggestions on how we can improve our responsible AI practices to better
                    serve our creative community.
                  </p>
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

export default ResponsibleAI
