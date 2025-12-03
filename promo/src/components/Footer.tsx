import type React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../hooks/useTranslation";
import { Logo } from "./Logo";

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer
      className="bg-[#12192C] border-t border-gray-800 mt-auto"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      }}
    >
      <div className="z-10 transition-all duration-300 grid w-full grid-cols-12 gap-2 px-4 sm:px-6 md:gap-4 md:px-10 lg:px-12 xl:px-20 xl:gap-6 max-w-[1920px] mx-auto">
        <div className="col-span-12 mb-8 mt-10 md:mb-0 md:mt-14">
          <div className="flex flex-col justify-between md:flex-row">
            {/* Logo on the left */}
            <div className="shrink-0 md:w-1/4">
              <Link to="/" className="inline-block">
                <Logo size="small" showText={false} />
              </Link>
            </div>

            {/* Three columns on the right */}
            <div className="mt-10 grid grid-cols-1 gap-8 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-4 md:mb-[120px] md:mt-0 lg:flex lg:flex-row lg:gap-[60px] xl:gap-80">
              {/* Product Column */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
                  {t("footer.product.title")}
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/about"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.product.about")}
                    </Link>
                  </li>
                  {/* Hidden during beta */}
                  {/* <li>
                    <Link
                      to="/pricing"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.product.pricing")}
                    </Link>
                  </li> */}
                  <li>
                    <Link
                      to="/changelog"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.product.changelog")}
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://github.com/chatman-media/timeline-studio/releases"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.product.downloads")}
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:ak.chatman.media@gmail.com"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.product.contact")}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Resources Column */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
                  {t("footer.resources.title")}
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/docs"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.resources.documentation")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/blog"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.resources.blog")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/faq"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.resources.faqs")}
                    </Link>
                  </li>
                  <li>
                    <a
                      href="https://github.com/chatman-media/timeline-studio/issues"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.resources.submitFeedback")}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Investors Column */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
                  {t("footer.investors.title")}
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link
                      to="/investors"
                      className="text-sm text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      {t("footer.investors.raisingSeed")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/project"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.investors.documentation")}
                    </Link>
                  </li>
                  <li>
                    <a
                      href="mailto:ak.chatman.media@gmail.com"
                      className="text-sm text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      {t("footer.investors.contact")}
                    </a>
                  </li>
                </ul>
              </div>

              {/* Social Column */}
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6 whitespace-nowrap">
                  {t("footer.social.title")}
                </h3>
                <div className="flex flex-wrap gap-4">
                  <a
                    href="https://discord.gg/uvSBCw6e"
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    aria-label="Discord"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </a>
                  <a
                    href="https://t.me/timelinestudio"
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    aria-label="Telegram"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.944 0A12 12 0 1 0 24 12a12 12 0 0 0-12.056-12zM16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/chatman-media/timeline-studio"
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    aria-label="GitHub"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/chatman-media"
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    aria-label="X"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@chatman-media"
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    aria-label="YouTube"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.tiktok.com/@chatman.media"
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    aria-label="TikTok"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.twitch.tv/chatman1984"
                    className="text-gray-500 hover:text-gray-300 transition-colors duration-200"
                    aria-label="Twitch"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-6">
        <div className="px-4 sm:px-6 md:px-10 lg:px-12 xl:px-20 max-w-[1920px] mx-auto">
          <div className="flex flex-col items-center space-y-4 md:flex-row md:justify-between md:space-y-0">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
              <img
                src="/fav.png"
                alt="Timeline Studio Logo"
                className="w-7 h-7 invert"
              />
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-x-6">
                <Link
                  to="/terms"
                  className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {t("footer.legal.termsOfService")}
                </Link>
                <Link
                  to="/privacy"
                  className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {t("footer.legal.privacyPolicy")}
                </Link>
                <Link
                  to="/responsible-ai"
                  className="text-xs sm:text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {t("footer.legal.responsibleAI")}
                </Link>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-400 text-center">
              {t("footer.copyright")}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
