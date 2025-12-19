import { motion } from "framer-motion";
import type React from "react";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";

export const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="6-4knnd">
      <SEO
        title="Privacy Policy"
        description="Privacy Policy for Timeline Studio. Learn how we handle your data."
        url="/privacy"
        data-oid="zbsiup:"
      />
      <Navigation data-oid="ca-.cu0" />

      <main className="flex-1" data-oid="k99.k0-">
        {/* Hero Section */}
        <section
          className="relative pt-32 pb-12 overflow-hidden"
          data-oid="dtjze2f"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 hero-gradient opacity-30"
            data-oid="vex37rj"
          />

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="c3i-e14"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
              data-oid="y60oojk"
            >
              <h1 className="page-title" data-oid="oq.aj:k">
                <span className="text-gradient" data-oid="ju1e1hu">
                  Privacy Policy
                </span>
              </h1>
              <p className="text-gray-400" data-oid="ox9_oen">
                Last updated: July 28, 2025
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 pb-20" data-oid="-0zj8g4">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="8ry6uib"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-4xl mx-auto prose prose-invert prose-lg"
              data-oid="bz4uqho"
            >
              <div className="space-y-8 text-gray-300" data-oid="prz9ccm">
                <div data-oid="09k71rm">
                  <h2 className="text-3xl text-white mb-4" data-oid="asejwb_">
                    1. Introduction
                  </h2>
                  <p data-oid="gn5ixzy">
                    Timeline Studio, Inc. ("we," "us," or "our") respects your
                    privacy and is committed to protecting your personal data.
                    This privacy policy explains how we collect, use, disclose,
                    and safeguard your information when you use Timeline Studio
                    desktop application and related services.
                  </p>
                </div>

                <div data-oid="0v:l6oa">
                  <h2 className="text-3xl text-white mb-4" data-oid="ppv45gk">
                    2. Information We Collect
                  </h2>
                  <p data-oid="ztu86de">
                    We collect information you provide directly to us, such as:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="qp5tfmj"
                  >
                    <li data-oid="4ja4e.j">
                      <strong data-oid="qpirema">Account Information:</strong>{" "}
                      Name, email address, and password when you create an
                      account
                    </li>
                    <li data-oid="t.af01o">
                      <strong data-oid="kcq6clk">Payment Information:</strong>{" "}
                      Billing details for paid subscriptions (processed securely
                      by third-party payment providers)
                    </li>
                    <li data-oid="j69qah0">
                      <strong data-oid="sh0ka8o">Content Data:</strong> Videos,
                      images, and projects you create or upload (stored locally
                      or in cloud storage based on your plan)
                    </li>
                    <li data-oid="scrvh8s">
                      <strong data-oid="aljs5uq">Usage Data:</strong>{" "}
                      Information about how you interact with Timeline Studio
                    </li>
                    <li data-oid=":jwpez4">
                      <strong data-oid="ls8ict4">Device Information:</strong>{" "}
                      Operating system, hardware specifications, and app version
                    </li>
                  </ul>
                </div>

                <div data-oid="0j2s_1.">
                  <h2 className="text-3xl text-white mb-4" data-oid="ogf:frq">
                    3. How We Use Your Information
                  </h2>
                  <p data-oid="b3dyyqm">
                    We use the information we collect to:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="thptc6r"
                  >
                    <li data-oid="gdnqsfe">
                      Provide, maintain, and improve Timeline Studio
                    </li>
                    <li data-oid="t10rqgd">
                      Process transactions and send related information
                    </li>
                    <li data-oid=".gjw1yp">
                      Send technical notices, updates, and support messages
                    </li>
                    <li data-oid="vlttxv.">
                      Respond to your comments, questions, and customer service
                      requests
                    </li>
                    <li data-oid="la.wty8">
                      Monitor and analyze usage patterns to improve user
                      experience
                    </li>
                    <li data-oid="zerwz0l">
                      Detect, prevent, and address technical issues
                    </li>
                    <li data-oid=".04fizm">
                      Provide AI-powered features (content is processed locally
                      when possible)
                    </li>
                  </ul>
                </div>

                <div data-oid="u65_ems">
                  <h2 className="text-3xl text-white mb-4" data-oid="g69s5xf">
                    4. Data Storage and Security
                  </h2>
                  <p data-oid="vni6g6n">
                    We implement appropriate technical and organizational
                    measures to protect your personal data:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="lh:7t12"
                  >
                    <li data-oid="t-1fkmm">
                      Local projects are stored on your device and are not
                      accessible to us
                    </li>
                    <li data-oid="1g__3bf">
                      Cloud storage is encrypted in transit and at rest
                    </li>
                    <li data-oid="s8nzuq3">
                      Access to personal data is restricted to authorized
                      personnel only
                    </li>
                    <li data-oid="e9:ik.g">
                      We regularly review and update our security practices
                    </li>
                  </ul>
                </div>

                <div data-oid="mvv__.l">
                  <h2 className="text-3xl text-white mb-4" data-oid="xj..x4h">
                    5. AI Processing and Content Analysis
                  </h2>
                  <p data-oid="p5yswrk">
                    Timeline Studio uses AI features for video editing
                    assistance. Important points:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="n-btmmu"
                  >
                    <li data-oid=":bizw:h">
                      AI processing happens locally on your device when possible
                    </li>
                    <li data-oid="6bco2mt">
                      Cloud AI features only process content with your explicit
                      consent
                    </li>
                    <li data-oid="yavuzgj">
                      We do not use your content to train our AI models
                    </li>
                    <li data-oid="u:hihbm">
                      Processed content is deleted from our servers after
                      completion
                    </li>
                  </ul>
                </div>

                <div data-oid="2us.--d">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="2_a7p9i"
                  >
                    6. Data Sharing
                  </h2>
                  <p data-oid="fly.2js">
                    We do not sell, trade, or rent your personal information. We
                    may share your information only in the following
                    circumstances:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="tkte30h"
                  >
                    <li data-oid="oe5ucgw">With your consent</li>
                    <li data-oid="y_yy1mh">
                      With service providers who assist in operating our service
                    </li>
                    <li data-oid="kz4pq6d">To comply with legal obligations</li>
                    <li data-oid="i3tafdx">
                      To protect our rights, privacy, safety, or property
                    </li>
                  </ul>
                </div>

                <div data-oid="-alnnzt">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="u3jlij7"
                  >
                    7. Your Rights
                  </h2>
                  <p data-oid="27y7d9r">You have the right to:</p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid=".kflei4"
                  >
                    <li data-oid="1k_xziv">
                      Access and receive a copy of your personal data
                    </li>
                    <li data-oid="yr:1q31">
                      Correct inaccurate or incomplete data
                    </li>
                    <li data-oid="k7dbyn8">
                      Delete your account and associated data
                    </li>
                    <li data-oid="vba7udl">Export your projects and content</li>
                    <li data-oid="oi2uabu">
                      Opt-out of marketing communications
                    </li>
                    <li data-oid="_12urnk">
                      Disable analytics and usage tracking
                    </li>
                  </ul>
                </div>

                <div data-oid="n8rehty">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="an5dgb7"
                  >
                    8. Data Retention
                  </h2>
                  <p data-oid="r8hk82x">
                    We retain your information for as long as your account is
                    active or as needed to provide services. If you delete your
                    account:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="nmo26eb"
                  >
                    <li data-oid="q822f9q">
                      Account data is deleted within 30 days
                    </li>
                    <li data-oid="kciix72">
                      Cloud-stored content is permanently deleted
                    </li>
                    <li data-oid="5cpemmr">
                      Local projects remain on your device
                    </li>
                    <li data-oid="m0kk4sa">
                      Some anonymized usage data may be retained for analytics
                    </li>
                  </ul>
                </div>

                <div data-oid="ar8zokc">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="q_xcb6e"
                  >
                    9. Children's Privacy
                  </h2>
                  <p data-oid="e8t7akl">
                    Timeline Studio is not intended for children under 13 years
                    of age. We do not knowingly collect personal information
                    from children under 13. If you believe we have collected
                    information from a child under 13, please contact us
                    immediately.
                  </p>
                </div>

                <div data-oid="5pi9sh.">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="7kri06q"
                  >
                    10. International Data Transfers
                  </h2>
                  <p data-oid="qsg7fn_">
                    Your information may be transferred to and processed in
                    countries other than your own. We ensure appropriate
                    safeguards are in place to protect your information in
                    accordance with this privacy policy.
                  </p>
                </div>

                <div data-oid="h4ispfa">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="xt76eqj"
                  >
                    11. Changes to This Policy
                  </h2>
                  <p data-oid="n1p8vt0">
                    We may update this privacy policy from time to time. We will
                    notify you of any changes by posting the new policy on this
                    page and updating the "Last updated" date.
                  </p>
                </div>

                <div data-oid="1q5ii:9">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="orme15q"
                  >
                    12. Contact Us
                  </h2>
                  <p data-oid="edhnmw.">
                    If you have questions or concerns about this privacy policy,
                    please contact us at:
                  </p>
                  <ul className="list-none mt-3 space-y-1" data-oid="utqkz13">
                    <li data-oid="q_xrmk0">
                      Email: ak.chatman.media@gmail.com
                    </li>
                    <li data-oid="nd:pnra">
                      Website: https://timeline-studio.chatman.studio
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer data-oid="qtskp9j" />
    </div>
  );
};

export default Privacy;
