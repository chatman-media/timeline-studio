import { motion } from "framer-motion";
import type React from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SearchDemo } from "../components/SearchDemo";

export const Demo: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
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
              className="max-w-4xl mx-auto text-center mb-12"
            >
              <h1 className="page-title">
                <span className="text-gradient">AI-Powered Video Creation</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4">
                Watch how Timeline Studio AI helps you create viral content in
                seconds
              </p>
              <p className="text-lg text-gray-400">
                Type your idea and let AI do the magic ✨
              </p>
            </motion.div>

            {/* Demo Component */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              <SearchDemo />
            </motion.div>

            {/* Features Grid */}
            <h2 className="sr-only">Key Features</h2>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="relative overflow-hidden rounded-xl">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/2" />

                {/* Border gradient */}
                <div className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px">
                  <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative p-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <div className="card-title">Smart Analysis</div>
                  <p className="card-description">
                    AI analyzes trends and suggests the best content strategy
                    for maximum engagement
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/2" />

                {/* Border gradient */}
                <div className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px">
                  <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative p-8">
                  <div className="text-4xl mb-4">⚡</div>
                  <div className="card-title">Instant Creation</div>
                  <p className="card-description">
                    Generate professional videos with trending effects and
                    transitions in seconds
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/2" />

                {/* Border gradient */}
                <div className="absolute inset-0 rounded-xl bg-linear-to-br from-purple-500/20 via-transparent to-blue-500/20 p-px">
                  <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>

                {/* Content */}
                <div className="relative p-8">
                  <div className="text-4xl mb-4">📈</div>
                  <div className="card-title">Viral Optimization</div>
                  <p className="card-description">
                    Optimize timing, hashtags, and content format for each
                    social platform
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="max-w-4xl mx-auto mt-20 text-center"
            >
              <h2 className="section-title">
                <span className="text-gradient">Ready to Go Viral?</span>
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Join millions of creators using Timeline Studio to create
                engaging content
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 rounded-xl text-lg font-medium text-white bg-[#8b5cf6] hover:bg-[#7c3aed] transform hover:scale-[1.02] transition-all"
                >
                  Download Free ⭐
                </a>
                <Link
                  to="/pricing"
                  className="px-8 py-4 rounded-xl text-lg font-medium text-white bg-white/10 hover:bg-white/20 transition-colors transform hover:scale-[1.02]"
                >
                  View Pricing
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Demo;
