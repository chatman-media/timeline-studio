import { motion } from "framer-motion";
import type React from "react";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";

export const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="q61vkca">
      <SEO
        title="Terms of Service"
        description="Terms of Service for Timeline Studio video editor."
        url="/terms"
        data-oid="xu8ms7i"
      />
      <Navigation data-oid="m0jo3wa" />

      <main className="flex-1" data-oid="cvrxxb3">
        {/* Hero Section */}
        <section
          className="relative pt-32 pb-12 overflow-hidden"
          data-oid="t081w0q"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 hero-gradient opacity-30"
            data-oid="nrmb:2r"
          />

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="vc29hg_"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
              data-oid="96nnhzi"
            >
              <h1 className="page-title" data-oid="9fl0s.s">
                <span className="text-gradient" data-oid="2nitcyo">
                  Terms of Service
                </span>
              </h1>
              <p className="text-gray-400" data-oid="4y5zurz">
                Last updated: July 28, 2025
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 pb-20" data-oid="5_9otgo">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid=":pisz-3"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-4xl mx-auto prose prose-invert prose-lg"
              data-oid="3gqdonh"
            >
              <div className="space-y-8 text-gray-300" data-oid="lvl0qib">
                <div data-oid="n1798hq">
                  <h2 className="text-3xl text-white mb-4" data-oid="4ou.2sy">
                    1. Acceptance of Terms
                  </h2>
                  <p data-oid="_l3-qec">
                    By accessing or using Timeline Studio ("the Service"), you
                    agree to be bound by these Terms of Service ("Terms"). If
                    you do not agree to these Terms, please do not use the
                    Service. Timeline Studio, Inc. ("we," "us," or "our")
                    reserves the right to update and change these Terms at any
                    time without notice.
                  </p>
                </div>

                <div data-oid="0o57w60">
                  <h2 className="text-3xl text-white mb-4" data-oid="zujvrge">
                    2. Description of Service
                  </h2>
                  <p data-oid="qb88jfq">
                    Timeline Studio is a desktop video editing application that
                    provides AI-powered editing tools, multi-platform export
                    capabilities, and cloud storage services. The Service
                    includes both free and paid subscription options with
                    varying features and limitations.
                  </p>
                </div>

                <div data-oid="bxpsjbl">
                  <h2 className="text-3xl text-white mb-4" data-oid="56r9qjf">
                    3. User Accounts
                  </h2>
                  <p data-oid="-44sbgf">
                    To access certain features of the Service, you may be
                    required to create an account. You are responsible for:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="w:qh0hs"
                  >
                    <li data-oid="l3iy8.8">
                      Maintaining the confidentiality of your account
                      credentials
                    </li>
                    <li data-oid="ddlpitp">
                      All activities that occur under your account
                    </li>
                    <li data-oid="1g1ew_k">
                      Notifying us immediately of any unauthorized use
                    </li>
                    <li data-oid="9tx06im">
                      Providing accurate and complete information
                    </li>
                  </ul>
                </div>

                <div data-oid="uovxv84">
                  <h2 className="text-3xl text-white mb-4" data-oid="mhz2hvv">
                    4. Acceptable Use
                  </h2>
                  <p data-oid="pdxzpu9">
                    You agree not to use Timeline Studio to:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="flye2ww"
                  >
                    <li data-oid="3hhr8jk">Violate any laws or regulations</li>
                    <li data-oid="ko55jgy">
                      Infringe upon intellectual property rights
                    </li>
                    <li data-oid="5m-3wcp">
                      Create or distribute harmful, offensive, or illegal
                      content
                    </li>
                    <li data-oid="ftl-f2:">
                      Attempt to gain unauthorized access to the Service
                    </li>
                    <li data-oid="k0g_g:b">
                      Interfere with or disrupt the Service or servers
                    </li>
                    <li data-oid="_0lzo2s">
                      Use the Service for any unauthorized commercial purposes
                    </li>
                  </ul>
                </div>

                <div data-oid="jc1-ook">
                  <h2 className="text-3xl text-white mb-4" data-oid="f3swxlt">
                    5. Intellectual Property
                  </h2>
                  <p data-oid="m5xiv87">
                    The Service and its original content, features, and
                    functionality are owned by Timeline Studio, Inc. and are
                    protected by international copyright, trademark, patent,
                    trade secret, and other intellectual property laws. You
                    retain all rights to content you create using the Service.
                  </p>
                </div>

                <div data-oid="ikiiqwr">
                  <h2 className="text-3xl text-white mb-4" data-oid="a-oq0kz">
                    6. User Content
                  </h2>
                  <p data-oid="5dq_8rc">
                    You retain ownership of all content you create, upload, or
                    process using Timeline Studio. By using the Service, you
                    grant us a limited license to process and store your content
                    solely for the purpose of providing the Service. We do not
                    claim ownership of your content and will not use it for any
                    purpose other than providing the Service.
                  </p>
                </div>

                <div data-oid="lp97441">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="4d5maed"
                  >
                    7. Privacy
                  </h2>
                  <p data-oid="709vjzt">
                    Your use of the Service is also governed by our Privacy
                    Policy. Please review our Privacy Policy, which also governs
                    the Service and informs users of our data collection
                    practices.
                  </p>
                </div>

                <div data-oid="lxkunln">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="yjh5bvj"
                  >
                    8. Subscriptions and Payments
                  </h2>
                  <p data-oid="6y:h5fq">
                    Some aspects of the Service may be provided for a fee. You
                    will be required to select a subscription plan and provide
                    payment information. By providing payment information, you
                    represent and warrant that:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="8:gjw-p"
                  >
                    <li data-oid="2rfs0s5">
                      You have the legal right to use any payment method
                      provided
                    </li>
                    <li data-oid="bj7-mcv">
                      The information you supply is true, correct, and complete
                    </li>
                    <li data-oid="5723tla">
                      You will promptly update payment information if it changes
                    </li>
                  </ul>
                  <p className="mt-3" data-oid="vglqbjg">
                    Subscription fees are billed in advance on a monthly or
                    annual basis and are non-refundable except as required by
                    law.
                  </p>
                </div>

                <div data-oid="pokt..7">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="_eypzv-"
                  >
                    9. Termination
                  </h2>
                  <p data-oid="58u63lx">
                    We may terminate or suspend your account and access to the
                    Service immediately, without prior notice or liability, for
                    any reason, including breach of these Terms. Upon
                    termination, your right to use the Service will immediately
                    cease.
                  </p>
                </div>

                <div data-oid="x:9vna4">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="2m.wl.0"
                  >
                    10. Disclaimer
                  </h2>
                  <p data-oid="ptxh9mu">
                    The Service is provided "as is" and "as available" without
                    any warranties of any kind, either express or implied. We do
                    not warrant that the Service will be uninterrupted, timely,
                    secure, or error-free.
                  </p>
                </div>

                <div data-oid="_093t6y">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="yuw0q4."
                  >
                    11. Limitation of Liability
                  </h2>
                  <p data-oid="s0:tazj">
                    In no event shall Timeline Studio, Inc., its directors,
                    employees, partners, agents, suppliers, or affiliates be
                    liable for any indirect, incidental, special, consequential,
                    or punitive damages, including without limitation, loss of
                    profits, data, use, goodwill, or other intangible losses.
                  </p>
                </div>

                <div data-oid="u5rndxv">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="imvcx31"
                  >
                    12. Governing Law
                  </h2>
                  <p data-oid=":__c6qv">
                    These Terms shall be governed and construed in accordance
                    with the laws of the United States, without regard to its
                    conflict of law provisions. Any disputes arising from these
                    Terms will be resolved in the courts of the United States.
                  </p>
                </div>

                <div data-oid="hqm0na:">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="n3g-euk"
                  >
                    13. Changes to Terms
                  </h2>
                  <p data-oid="n7x8xqr">
                    We reserve the right to modify or replace these Terms at any
                    time. If a revision is material, we will provide at least 30
                    days notice prior to any new terms taking effect.
                  </p>
                </div>

                <div data-oid=".ldukb:">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="jy6x:zt"
                  >
                    14. Contact Information
                  </h2>
                  <p data-oid="__ajlhq">
                    If you have any questions about these Terms, please contact
                    us at:
                  </p>
                  <ul className="list-none mt-3 space-y-1" data-oid="v:wap:x">
                    <li data-oid="r89bg14">
                      Email: ak.chatman.media@gmail.com
                    </li>
                    <li data-oid="7djh7ng">
                      Website: https://timeline-studio.chatman.studio
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer data-oid="zjx.n4s" />
    </div>
  );
};

export default Terms;
