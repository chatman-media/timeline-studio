import { motion } from "framer-motion"
import type React from "react"
import { Link } from "react-router-dom"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"
import { SEO } from "../components/SEO"
import { useLanguage } from "../contexts/LanguageContext"
import { useBlogPosts } from "../hooks/useMarkdownContent"

export const Blog: React.FC = () => {
  const { posts, isLoading } = useBlogPosts()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <SEO
        title="Blog"
        description="Latest news, updates, and tutorials about Timeline Studio video editor. Release notes, tips, and development insights."
        url="/blog"
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
                <span className="text-gradient">{t("blog.title")}</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4">{t("blog.subtitle")}</p>
              <p className="text-lg text-gray-400 mb-8">{t("blog.tagline")} 📰</p>
              <div className="flex items-center justify-center space-x-4 text-gray-400 text-sm">
                <span>{t("blog.updatedWeekly")}</span>
                <span>•</span>
                <span>{t("blog.developerInsights")}</span>
                <span>•</span>
                <span>{t("blog.tutorials")}</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="max-w-4xl mx-auto">
              {isLoading ? (
                <div className="glass-card">
                  <div className="glass-card-bg" />
                  <div className="glass-card-overlay" />
                  <div className="glass-card-border">
                    <div className="glass-card-inner" />
                  </div>
                  <div className="glass-card-content text-center">
                    <p className="text-lg text-gray-400">{t("blog.loading")}</p>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="glass-card">
                  <div className="glass-card-bg" />
                  <div className="glass-card-overlay" />
                  <div className="glass-card-border">
                    <div className="glass-card-inner" />
                  </div>
                  <div className="glass-card-content text-center">
                    <p className="text-lg text-gray-400">No blog posts found</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {posts.map((post, index) => (
                    <motion.article
                      key={post.slug}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="glass-card"
                    >
                      <div className="glass-card-bg" />
                      <div className="glass-card-overlay" />
                      <div className="glass-card-border">
                        <div className="glass-card-inner" />
                      </div>

                      <Link to={`/blog/${post.slug}`} className="relative block group glass-card-content">
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {post.category}
                          </span>
                          <span className="text-sm text-gray-500">{post.readTime}</span>
                        </div>
                        <h2
                          className="text-2xl font-medium text-white mb-3 group-hover:text-purple-400 transition-colors"
                          style={{
                            fontFamily:
                              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                          }}
                        >
                          {post.title}
                        </h2>
                        <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                          <span>{new Date(post.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{post.author}</span>
                        </div>
                        <p
                          className="text-gray-300 leading-relaxed mb-4"
                          style={{
                            fontFamily:
                              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                          }}
                        >
                          {post.excerpt}
                        </p>
                        <span className="text-purple-400 group-hover:text-purple-300 transition-colors flex items-center space-x-2">
                          <span>{t("blog.readMore")}</span>
                          <svg
                            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Blog
