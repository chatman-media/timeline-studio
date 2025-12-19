import { motion } from "framer-motion";
import type React from "react";
import { Link } from "react-router-dom";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";
import { useLanguage } from "../contexts/LanguageContext";
import { useBlogPosts } from "../hooks/useMarkdownContent";

export const Blog: React.FC = () => {
  const { posts, isLoading } = useBlogPosts();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="lr_o.a9">
      <SEO
        title="Blog"
        description="Latest news, updates, and tutorials about Timeline Studio video editor. Release notes, tips, and development insights."
        url="/blog"
        data-oid="-l9nz83"
      />

      <Navigation data-oid="s.e33rj" />

      <main className="flex-1" data-oid="vj4z-:b">
        {/* Hero Section */}
        <section
          className="relative pt-32 pb-20 overflow-hidden"
          data-oid="2ng_:1f"
        >
          {/* Background */}
          <div className="absolute inset-0 hero-gradient" data-oid="yjyv7er" />

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="6kcfws0"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center"
              data-oid="c9jjs8b"
            >
              <h1 className="page-title" data-oid="cgwjy:k">
                <span className="text-gradient" data-oid="67_:uke">
                  {t("blog.title")}
                </span>
              </h1>
              <p
                className="text-xl md:text-2xl text-gray-300 mb-4"
                data-oid="odc7zoi"
              >
                {t("blog.subtitle")}
              </p>
              <p className="text-lg text-gray-400 mb-8" data-oid="8a-p5qx">
                {t("blog.tagline")} 📰
              </p>
              <div
                className="flex items-center justify-center space-x-4 text-gray-400 text-sm"
                data-oid="9j7eia5"
              >
                <span data-oid="sd.88fp">{t("blog.updatedWeekly")}</span>
                <span data-oid="ipcw7vl">•</span>
                <span data-oid="bf4i153">{t("blog.developerInsights")}</span>
                <span data-oid="r:e1ve6">•</span>
                <span data-oid="zpoqflx">{t("blog.tutorials")}</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="py-20" data-oid="jogknxs">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="t--oyco"
          >
            <div className="max-w-4xl mx-auto" data-oid="c78g-f4">
              {isLoading ? (
                <div className="glass-card" data-oid="lghjq4o">
                  <div className="glass-card-bg" data-oid="td6icy_" />
                  <div className="glass-card-overlay" data-oid="8brl7tv" />
                  <div className="glass-card-border" data-oid="wv4zff3">
                    <div className="glass-card-inner" data-oid="sj6ow6n" />
                  </div>
                  <div
                    className="glass-card-content text-center"
                    data-oid="oc8m-:w"
                  >
                    <p className="text-lg text-gray-400" data-oid="24kk5j8">
                      {t("blog.loading")}
                    </p>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="glass-card" data-oid="7bccn2j">
                  <div className="glass-card-bg" data-oid="cqn3mzq" />
                  <div className="glass-card-overlay" data-oid="1bk9.0b" />
                  <div className="glass-card-border" data-oid="rd1q9o1">
                    <div className="glass-card-inner" data-oid="oxn1jwe" />
                  </div>
                  <div
                    className="glass-card-content text-center"
                    data-oid="x7xq12t"
                  >
                    <p className="text-lg text-gray-400" data-oid="mjvdtak">
                      No blog posts found
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-8" data-oid="ok7_eh7">
                  {posts.map((post, index) => (
                    <motion.article
                      key={post.slug}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="glass-card"
                      data-oid="f5zysv7"
                    >
                      <div className="glass-card-bg" data-oid="yzi4.q3" />
                      <div className="glass-card-overlay" data-oid="ly9htw7" />
                      <div className="glass-card-border" data-oid="kou74tv">
                        <div className="glass-card-inner" data-oid="eri6xn_" />
                      </div>

                      <Link
                        to={`/blog/${post.slug}`}
                        className="relative block group glass-card-content"
                        data-oid="02lrmvo"
                      >
                        <div
                          className="flex items-center justify-between mb-4"
                          data-oid="s3xtual"
                        >
                          <span
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            data-oid="q8o2.7x"
                          >
                            {post.category}
                          </span>
                          <span
                            className="text-sm text-gray-500"
                            data-oid="gnc2bcp"
                          >
                            {post.readTime}
                          </span>
                        </div>
                        <h2
                          className="text-2xl font-medium text-white mb-3 group-hover:text-purple-400 transition-colors"
                          style={{
                            fontFamily:
                              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                          }}
                          data-oid="nibi.db"
                        >
                          {post.title}
                        </h2>
                        <div
                          className="flex items-center space-x-4 text-sm text-gray-400 mb-4"
                          data-oid="934cxdl"
                        >
                          <span data-oid="p507d2y">
                            {new Date(post.date).toLocaleDateString()}
                          </span>
                          <span data-oid="syl6fn6">•</span>
                          <span data-oid="pyv77.5">{post.author}</span>
                        </div>
                        <p
                          className="text-gray-300 leading-relaxed mb-4"
                          style={{
                            fontFamily:
                              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                          }}
                          data-oid="vnhbn29"
                        >
                          {post.excerpt}
                        </p>
                        <span
                          className="text-purple-400 group-hover:text-purple-300 transition-colors flex items-center space-x-2"
                          data-oid="arbw.e5"
                        >
                          <span data-oid="7cxvpoc">{t("blog.readMore")}</span>
                          <svg
                            className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            data-oid="vl8oybn"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                              data-oid="p2fp:6l"
                            />
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

      <Footer data-oid="mxqw-a7" />
    </div>
  );
};

export default Blog;
