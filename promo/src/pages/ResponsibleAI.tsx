import { motion } from "framer-motion";
import type React from "react";
import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { SEO } from "../components/SEO";

export const ResponsibleAI: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col" data-oid="qkdwd8u">
      <SEO
        title="Responsible AI"
        description="Our commitment to responsible AI development. Ethical guidelines and safety practices at Timeline Studio."
        url="/responsible-ai"
        data-oid="yos2kn6"
      />

      <Navigation data-oid="fksq2wi" />

      <main className="flex-1" data-oid="1zzuy2p">
        {/* Hero Section */}
        <section
          className="relative pt-32 pb-12 overflow-hidden"
          data-oid="jbq6bde"
        >
          {/* Background gradient */}
          <div
            className="absolute inset-0 hero-gradient opacity-30"
            data-oid="dwwfa0a"
          />

          <div
            className="relative container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="c2fuj:d"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto"
              data-oid="c5khk:d"
            >
              <h1 className="page-title" data-oid="b._hvnq">
                <span className="text-gradient" data-oid="k703k:i">
                  Responsible AI Policy
                </span>
              </h1>
              <p className="text-gray-400" data-oid="6qpd6og">
                Last updated: July 28, 2025
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 pb-20" data-oid="9jk290f">
          <div
            className="container mx-auto px-6 md:px-8 lg:px-12"
            data-oid="lstthu5"
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-4xl mx-auto prose prose-invert prose-lg"
              data-oid="p8ovcbq"
            >
              <div className="space-y-8 text-gray-300" data-oid="jn:ju28">
                <div
                  className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8"
                  data-oid="echog6."
                >
                  <p className="text-white font-medium" data-oid="tbr7p_k">
                    At Timeline Studio, we are committed to developing and
                    deploying AI technology responsibly. Our AI features are
                    designed to empower creators while respecting privacy,
                    promoting fairness, and ensuring transparency in how our
                    technology works.
                  </p>
                </div>

                <div data-oid="li-f0pe">
                  <h2 className="text-3xl text-white mb-4" data-oid="8xqiyyo">
                    1. Our AI Principles
                  </h2>
                  <p data-oid="vjhx820">
                    Timeline Studio's AI development and deployment are guided
                    by the following core principles:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="liyp033"
                  >
                    <li data-oid="5r8qbtz">
                      <strong data-oid="6r7oc_p">Human-Centered Design:</strong>{" "}
                      AI should augment human creativity, not replace it
                    </li>
                    <li data-oid="0rql3qx">
                      <strong data-oid="oe3j9u8">Transparency:</strong> Users
                      should understand how AI features work and their
                      limitations
                    </li>
                    <li data-oid="93va8w9">
                      <strong data-oid=":._k49y">Privacy First:</strong> User
                      data and content remain private and secure
                    </li>
                    <li data-oid="ngoagx:">
                      <strong data-oid="0ci.1di">
                        Fairness and Inclusivity:
                      </strong>{" "}
                      AI should work equitably for all users
                    </li>
                    <li data-oid="lxait_v">
                      <strong data-oid="c3qnvo2">
                        Safety and Reliability:
                      </strong>{" "}
                      AI features must be thoroughly tested and reliable
                    </li>
                    <li data-oid="anf4opt">
                      <strong data-oid="fvkiazj">User Control:</strong> Users
                      maintain full control over AI-generated content
                    </li>
                  </ul>
                </div>

                <div data-oid="ic578qf">
                  <h2 className="text-3xl text-white mb-4" data-oid="k-obg1w">
                    2. Ethical AI Use
                  </h2>
                  <p data-oid="chz29d_">
                    We design our AI features to promote ethical use and prevent
                    harm:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="5c5ll.f"
                  >
                    <li data-oid="s63c16a">
                      AI features are designed to enhance legitimate creative
                      work
                    </li>
                    <li data-oid="0nkso_h">
                      We prohibit use of our AI for creating deceptive or
                      harmful content
                    </li>
                    <li data-oid="1wv60ng">
                      Built-in safeguards prevent generation of inappropriate
                      content
                    </li>
                    <li data-oid="ohn3f6_">
                      We do not support deepfakes or non-consensual content
                      manipulation
                    </li>
                    <li data-oid="oayn7fa">
                      AI-generated content is clearly marked when appropriate
                    </li>
                  </ul>
                </div>

                <div data-oid="jfvp_5g">
                  <h2 className="text-3xl text-white mb-4" data-oid="z0f:px3">
                    3. Data Privacy and Security
                  </h2>
                  <p data-oid="j9p6yx_">
                    Your content and data are protected throughout the AI
                    processing pipeline:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="l-:hpzq"
                  >
                    <li data-oid=":n..z::">
                      <strong data-oid="d_r82o5">Local Processing:</strong> Many
                      AI features run directly on your device
                    </li>
                    <li data-oid="lgt0ras">
                      <strong data-oid="kr52.bb">
                        No Training on User Data:
                      </strong>{" "}
                      We never use your content to train our AI models
                    </li>
                    <li data-oid="ouqk2cr">
                      <strong data-oid="yl4aljl">Temporary Processing:</strong>{" "}
                      Cloud-processed content is deleted after completion
                    </li>
                    <li data-oid="w3mg4kr">
                      <strong data-oid="0b8.pjy">
                        Encrypted Transmission:
                      </strong>{" "}
                      All data transfers are encrypted end-to-end
                    </li>
                    <li data-oid="bxha4u0">
                      <strong data-oid="rrr0e4b">Data Minimization:</strong> We
                      only process what's necessary for the requested feature
                    </li>
                  </ul>
                </div>

                <div data-oid="2cwo6vj">
                  <h2 className="text-3xl text-white mb-4" data-oid=".dh4bg1">
                    4. AI Feature Transparency
                  </h2>
                  <p data-oid="kt_khok">
                    We believe in being transparent about our AI capabilities
                    and limitations:
                  </p>

                  <h3
                    className="text-lg font-semibold text-white mt-4 mb-2"
                    data-oid="by2v0lh"
                  >
                    Smart Montage AI
                  </h3>
                  <ul className="list-disc ml-6 space-y-1" data-oid="e7m9u.3">
                    <li data-oid="jgu19pb">
                      Analyzes video content for key moments and transitions
                    </li>
                    <li data-oid="4apsfhs">
                      Suggests edits based on content quality and pacing
                    </li>
                    <li data-oid=".u-5h2r">
                      All suggestions are reviewable and editable by users
                    </li>
                  </ul>

                  <h3
                    className="text-lg font-semibold text-white mt-4 mb-2"
                    data-oid="ojtks1q"
                  >
                    Scene Detection
                  </h3>
                  <ul className="list-disc ml-6 space-y-1" data-oid="ezrlur1">
                    <li data-oid="c2uy:fr">
                      Identifies scene changes and important moments
                    </li>
                    <li data-oid="euja2x.">
                      Uses computer vision to understand content
                    </li>
                    <li data-oid="lx5skz2">
                      Accuracy varies with video quality and content type
                    </li>
                  </ul>

                  <h3
                    className="text-lg font-semibold text-white mt-4 mb-2"
                    data-oid="ncg27l:"
                  >
                    Auto-Translation
                  </h3>
                  <ul className="list-disc ml-6 space-y-1" data-oid="fb19xn0">
                    <li data-oid="utn680b">
                      Provides subtitle translation in 13+ languages
                    </li>
                    <li data-oid="myn9yll">
                      Quality depends on source audio clarity
                    </li>
                    <li data-oid="9y5fyew">
                      Always allows manual correction of translations
                    </li>
                  </ul>
                </div>

                <div data-oid="zqboa:g">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="c1rypw6"
                  >
                    5. Bias Prevention and Fairness
                  </h2>
                  <p data-oid="gc76p6f">
                    We actively work to prevent bias in our AI systems:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="k-gpvtx"
                  >
                    <li data-oid="r5c9vwd">
                      Regular testing across diverse content types and user
                      groups
                    </li>
                    <li data-oid="mk_jssg">
                      Continuous monitoring for unintended bias in AI outputs
                    </li>
                    <li data-oid="zty1ky4">
                      Diverse training data to ensure broad applicability
                    </li>
                    <li data-oid="dng0jkn">
                      User feedback mechanisms to report bias or unfair
                      treatment
                    </li>
                    <li data-oid="ki:r3uv">
                      Regular audits of AI performance across different
                      demographics
                    </li>
                  </ul>
                </div>

                <div data-oid="8q0cjli">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="5djegtx"
                  >
                    6. User Rights and Control
                  </h2>
                  <p data-oid="2kdf.io">
                    You maintain complete control over AI features in Timeline
                    Studio:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="mw.2ow3"
                  >
                    <li data-oid="x:7g92g">
                      <strong data-oid="yiawdn-">Opt-in by Default:</strong> AI
                      features require explicit activation
                    </li>
                    <li data-oid="a0:qt6a">
                      <strong data-oid="y028.7d">Disable Anytime:</strong> Turn
                      off any AI feature in settings
                    </li>
                    <li data-oid="r1:4keq">
                      <strong data-oid="wvoi:po">Review and Edit:</strong> All
                      AI suggestions are editable
                    </li>
                    <li data-oid="puw:5op">
                      <strong data-oid="9mpanze">Export Original:</strong>{" "}
                      Always maintain access to unprocessed content
                    </li>
                    <li data-oid="s5fowuj">
                      <strong data-oid="1dd.-38">Delete AI Data:</strong> Remove
                      any AI-processed data on request
                    </li>
                  </ul>
                </div>

                <div data-oid="x6eumem">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="oieak1m"
                  >
                    7. Responsible Development Process
                  </h2>
                  <p data-oid="sylrhcy">
                    Our AI development follows strict ethical guidelines:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid=".y:4:0t"
                  >
                    <li data-oid="g2:65qj">
                      Ethics review for all new AI features before release
                    </li>
                    <li data-oid=":d7dkyn">
                      Extensive testing for safety and reliability
                    </li>
                    <li data-oid="1a.m3ga">
                      Regular security audits and penetration testing
                    </li>
                    <li data-oid="1ge_opd">
                      Collaboration with AI safety researchers
                    </li>
                    <li data-oid="95pe_wk">
                      Continuous improvement based on user feedback
                    </li>
                  </ul>
                </div>

                <div data-oid="wubzzez">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="bhyru71"
                  >
                    8. Prohibited Uses
                  </h2>
                  <p data-oid="zugfyn7">
                    The following uses of Timeline Studio's AI features are
                    strictly prohibited:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="wvc8o50"
                  >
                    <li data-oid="catir2n">
                      Creating misleading or deceptive content
                    </li>
                    <li data-oid="rteruve">
                      Generating content that violates others' rights
                    </li>
                    <li data-oid="_.a_5-p">
                      Producing harmful, offensive, or illegal material
                    </li>
                    <li data-oid="9h31_jm">
                      Bypassing content moderation or safety features
                    </li>
                    <li data-oid="pt04:2s">
                      Using AI to impersonate others without consent
                    </li>
                    <li data-oid="98vw.rq">
                      Creating non-consensual intimate content
                    </li>
                  </ul>
                </div>

                <div data-oid="njc7xoh">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="jnj:tf1"
                  >
                    9. Accountability and Reporting
                  </h2>
                  <p data-oid="hz_tqbl">
                    We take responsibility for our AI technology:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="16-rgl_"
                  >
                    <li data-oid="shw:-rk">
                      Regular transparency reports on AI usage and safety
                    </li>
                    <li data-oid=":ijklbm">
                      Clear channels for reporting AI-related concerns
                    </li>
                    <li data-oid="y9p7xjy">
                      Swift response to identified issues or misuse
                    </li>
                    <li data-oid=".gj5bhk">
                      Continuous improvement of safety measures
                    </li>
                    <li data-oid="_y-1-v1">
                      Collaboration with the broader AI safety community
                    </li>
                  </ul>
                </div>

                <div data-oid="23fll9e">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="5yym1wo"
                  >
                    10. Future Commitments
                  </h2>
                  <p data-oid="z2og5a:">
                    As AI technology evolves, we commit to:
                  </p>
                  <ul
                    className="list-disc ml-6 mt-3 space-y-2"
                    data-oid="_rwe:fp"
                  >
                    <li data-oid="ysfhm2_">
                      Staying current with AI safety best practices
                    </li>
                    <li data-oid="8.lk524">
                      Updating our policies as technology advances
                    </li>
                    <li data-oid="x6mtasa">
                      Engaging with users on AI development priorities
                    </li>
                    <li data-oid="ab.pfql">
                      Contributing to industry standards for responsible AI
                    </li>
                    <li data-oid="3-wvqgp">
                      Maintaining transparency about our AI roadmap
                    </li>
                  </ul>
                </div>

                <div data-oid="p2lt6.e">
                  <h2
                    className="text-2xl font-bold text-white mb-4"
                    data-oid="plz-w-7"
                  >
                    11. Contact Us
                  </h2>
                  <p data-oid="tjo5kjr">
                    For questions, concerns, or feedback about our AI policies
                    and practices:
                  </p>
                  <ul className="list-none mt-3 space-y-1" data-oid="d81zs4j">
                    <li data-oid="t.8r_x4">
                      Email: ak.chatman.media@gmail.com
                    </li>
                    <li data-oid="7hwbika">
                      Subject Line: "AI Policy Inquiry"
                    </li>
                    <li data-oid="wleb6gk">Response Time: Within 48 hours</li>
                  </ul>
                  <p className="mt-4" data-oid="22ti8xt">
                    We welcome feedback and suggestions on how we can improve
                    our responsible AI practices to better serve our creative
                    community.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer data-oid="v0gvmk2" />
    </div>
  );
};

export default ResponsibleAI;
