import { motion } from "framer-motion";
import type React from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";
import { useLanguage } from "../contexts/LanguageContext";
import { useBlogPost } from "../hooks/useMarkdownContent";

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { post, isLoading } = useBlogPost(slug || "");
  const { t } = useLanguage();

  if (isLoading || !post) {
    return (
      <div
        className="min-h-screen bg-[#12192C] flex flex-col"
        data-oid="q5jbze7"
      >
        <Navigation data-oid="yn7gbx6" />
        <main className="flex-1" data-oid="y6aitbr">
          <div className="pt-32 pb-20" data-oid="52fz_w8">
            <div
              className="container mx-auto px-6 md:px-8 lg:px-12"
              data-oid="3-b3j9y"
            >
              <div className="max-w-4xl mx-auto" data-oid="m0jut4v">
                <div className="glass-card" data-oid="eq_xru:">
                  <div className="glass-card-bg" data-oid="tj2p9od" />
                  <div className="glass-card-overlay" data-oid="gsuhr-e" />
                  <div className="glass-card-border" data-oid="k5yd-zn">
                    <div className="glass-card-inner" data-oid=":g8c3ym" />
                  </div>
                  <div
                    className="glass-card-content text-center"
                    data-oid="l7kej_9"
                  >
                    <p className="text-lg text-gray-400" data-oid="1m.fd6m">
                      {t("blog.loading")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer data-oid="s8mv76k" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="ct-fapz">
      <SEO
        title={post.metadata.title}
        description={post.content.slice(0, 160) + "..."}
        url={`/blog/${slug}`}
        type="article"
        data-oid="pz9zbbc"
      />

      <Navigation data-oid="t869s9w" />

      <main className="flex-1" data-oid="6xf2ieh">
        {/* Article Header */}
        <section
          className="relative pt-32 pb-12 overflow-hidden"
          data-oid="nx3b7xn"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 hero-gradient opacity-50"
            data-oid="i_dq51w"
          />

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="ksgld.2"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
              data-oid="xhktw7m"
            >
              <Link
                to="/blog"
                className="inline-flex items-center space-x-2 text-gray-400 hover:text-gray-200 transition-colors mb-6"
                data-oid="sgdbmn1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  data-oid="mffgr1j"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                    data-oid="mf_jn3b"
                  />
                </svg>
                <span data-oid="-xhpqng">{t("blog.backToBlog")}</span>
              </Link>

              <h1
                className="page-title"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                }}
                data-oid="j:h4f4y"
              >
                {post.metadata.title}
              </h1>

              <div
                className="flex items-center space-x-4 text-gray-400"
                data-oid="g1fmqy5"
              >
                <span data-oid="ohqf4l7">
                  {new Date(post.metadata.date).toLocaleDateString()}
                </span>
                <span data-oid="1v6rhw7">•</span>
                <span data-oid="um.:qq_">
                  {post.metadata.author || "Timeline Team"}
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Article Content */}
        <section className="py-12 pb-20" data-oid="af1en-.">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="bjpzobx"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="max-w-4xl mx-auto"
              data-oid="_3o44g1"
            >
              <div className="glass-card" data-oid="zhmpuap">
                <div className="glass-card-bg" data-oid="t0md5sv" />
                <div className="glass-card-overlay" data-oid="97u92jc" />
                <div className="glass-card-border" data-oid="knp6a5e">
                  <div className="glass-card-inner" data-oid="u7__0lf" />
                </div>
                <div className="relative p-8 md:p-12" data-oid="8ojcuxx">
                  <article
                    className="prose prose-invert prose-lg max-w-none"
                    data-oid="3uk8lw7"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1
                            className="text-4xl font-light text-white mb-6"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                            data-oid="t:-tp1k"
                          >
                            {children}
                          </h1>
                        ),

                        h2: ({ children }) => (
                          <h2
                            className="text-2xl font-light text-white mt-8 mb-4"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                            data-oid="yvi.n.:"
                          >
                            {children}
                          </h2>
                        ),

                        h3: ({ children }) => (
                          <h3
                            className="text-xl font-medium text-white mt-6 mb-3"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                            data-oid="w67d8bx"
                          >
                            {children}
                          </h3>
                        ),

                        p: ({ children }) => (
                          <p
                            className="text-gray-300 mb-4 leading-relaxed text-base"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                            data-oid="sfr1w8j"
                          >
                            {children}
                          </p>
                        ),

                        ul: ({ children }) => (
                          <ul
                            className="list-disc list-inside space-y-2 mb-4 text-gray-300"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                            data-oid="j.khxbl"
                          >
                            {children}
                          </ul>
                        ),

                        li: ({ children }) => (
                          <li
                            className="text-gray-300"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                            data-oid="bugtd3e"
                          >
                            {children}
                          </li>
                        ),

                        strong: ({ children }) => (
                          <strong
                            className="text-white font-semibold"
                            data-oid="ob.k-zh"
                          >
                            {children}
                          </strong>
                        ),

                        code: ({ children }) => (
                          <code
                            className="bg-gray-800/50 px-1.5 py-0.5 rounded text-purple-400 text-sm font-mono"
                            data-oid="yvgsx91"
                          >
                            {children}
                          </code>
                        ),

                        a: ({ children, href }) => (
                          <a
                            href={href}
                            className="text-purple-400 hover:text-purple-300 underline transition-colors"
                            data-oid=":97b.h7"
                          >
                            {children}
                          </a>
                        ),
                      }}
                      data-oid="atj1sa8"
                    >
                      {post.content}
                    </ReactMarkdown>
                  </article>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer data-oid="mk:4rq9" />
    </div>
  );
};

export default BlogPost;
