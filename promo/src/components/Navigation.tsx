import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useLanguage } from "../contexts/LanguageContext"
import { LanguageToggle } from "./LanguageToggle"
import { Logo } from "./Logo"

interface NavItem {
  label: string
  href: string
  isExternal?: boolean
  isScroll?: boolean
}

const navItems: NavItem[] = []

// Moved inside component to access translations

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t } = useLanguage()

  const rightNavItems: NavItem[] = [
    { label: t("nav.project").toUpperCase(), href: "/project", isExternal: false },
    { label: t("nav.pricing").toUpperCase(), href: "/pricing", isExternal: false },
    { label: t("nav.changelog").toUpperCase(), href: "/changelog", isExternal: false },
    { label: t("nav.docs").toUpperCase(), href: "/docs", isExternal: false },
    { label: t("nav.blog").toUpperCase(), href: "/blog", isExternal: false },
  ]

  useEffect(() => {
    let ticking = false
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10)

          // Определяем активную секцию только для скролл-элементов из обоих массивов
          const allItems = [...navItems, ...rightNavItems]
          const scrollSections = allItems.filter((item) => item.isScroll).map((item) => item.href.slice(1))
          const scrollPosition = window.scrollY + 100

          for (const section of scrollSections) {
            const element = document.getElementById(section)
            if (element) {
              const { offsetTop, offsetHeight } = element
              if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                setActiveSection(section)
                break
              }
            }
          }
          
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Проверяем начальное состояние
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-[padding] duration-300 ease-out ${isScrolled ? "py-0" : "py-3"}`}>
      <div className={`transition-[padding] duration-300 ease-out ${isScrolled ? "px-2 md:px-2 pt-3" : "px-2 md:px-2 lg:px-2"}`}>
        <div
          className={`flex items-center justify-between outline-none border border-transparent px-3 md:px-5 py-3 transition-[background-color,border-radius,box-shadow] duration-300 ease-out ${
            isScrolled ? "nav-glass-scrolled rounded-2xl" : ""
          }`}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ position: "relative" }}
          >
            <Link to="/" className="inline-block">
              <Logo size="medium" />
            </Link>
          </motion.div>

          {/* Right side container */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="flex items-center space-x-2 lg:space-x-6"
            style={{ position: "relative" }}
          >
            {/* Navigation Items */}
            <ul className="hidden md:flex items-center space-x-0.5 lg:space-x-1 xl:space-x-2">
              {[...navItems, ...rightNavItems].map((item) => (
                <li key={item.href}>
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-2 lg:px-3 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200 tracking-wider"
                    >
                      {item.label}
                    </a>
                  ) : item.isScroll ? (
                    <a
                      href={item.href}
                      onClick={(e) => handleClick(e, item.href)}
                      className={`block px-2 lg:px-3 py-2 text-xs font-medium transition-colors duration-200 tracking-wider ${
                        activeSection === item.href.slice(1) ? "text-white" : "text-gray-300 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="block px-2 lg:px-3 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200 tracking-wider"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {/* Language Toggle */}
            <div className="hidden lg:flex items-center mr-1 xl:mr-2">
              <LanguageToggle className="mr-2 xl:mr-4" />
            </div>

            {/* Social Icons */}
            <div className="hidden lg:flex items-center mr-1 xl:mr-2">
              <a
                href="https://discord.gg/uvSBCw6e"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Discord"
              >
                <svg className="w-5 h-5 mr-2 lg:mr-3 xl:mr-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
              <a
                href="https://t.me/timelinestudio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="Telegram"
              >
                <svg className="w-5 h-5 mr-2 lg:mr-3 xl:mr-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 1 0 24 12a12 12 0 0 0-12.056-12zM16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              <a
                href="https://github.com/chatman-media/timeline-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors duration-200"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5 mr-2 lg:mr-3 xl:mr-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>

            {/* Download Button */}
            <a
              href="https://github.com/chatman-media/timeline-studio/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative hidden lg:inline-flex px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-xs lg:text-sm font-medium text-white overflow-hidden mr-0"
            >
              {/* Background with purple base */}
              <div className="absolute inset-0 bg-[#8b5cf6] rounded-xl" />

              {/* Kiro-style spreading effect on hover */}
              <div className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-[150%] group-hover:scale-y-[220%]" />

              {/* Text */}
              <span className="relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-500">
                {t("nav.download")}
              </span>
            </a>

            {/* Compact download button for medium screens */}
            <a
              href="https://github.com/chatman-media/timeline-studio/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative hidden md:inline-flex lg:hidden px-3 py-2 rounded-lg text-xs font-medium text-white overflow-hidden mr-2"
            >
              {/* Background with purple base */}
              <div className="absolute inset-0 bg-[#8b5cf6] rounded-lg" />
              {/* Text */}
              <span className="relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-300">
                Download
              </span>
            </a>

            {/* Mobile menu button */}
            <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ position: "relative" }}
            className="md:hidden mt-2 nav-glass-scrolled rounded-2xl p-4"
          >
            <ul className="space-y-2">
              {[...navItems, ...rightNavItems].map((item) => (
                <li key={item.href}>
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : item.isScroll ? (
                    <a
                      href={item.href}
                      onClick={(e) => {
                        handleClick(e, item.href)
                        setIsMobileMenuOpen(false)
                      }}
                      className={`block px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors duration-200 ${
                        activeSection === item.href.slice(1)
                          ? "text-white bg-white/10"
                          : "text-gray-300 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}

              {/* Language toggle in mobile menu */}
              <li className="pt-2 border-t border-gray-700">
                <LanguageToggle isMobile={true} />
              </li>

              {/* Social icons in mobile menu */}
              <li className="pt-2 border-t border-gray-700">
                <div className="flex space-x-4 px-4 py-2">
                  <a
                    href="https://discord.gg/uvSBCw6e"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Discord"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  </a>
                  <a
                    href="https://t.me/timelinestudio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Telegram"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 1 0 24 12a12 12 0 0 0-12.056-12zM16.906 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </a>
                  <a
                    href="https://github.com/chatman-media/timeline-studio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="GitHub"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                </div>
              </li>

              {/* Download button in mobile menu */}
              <li className="pt-2">
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block mx-4 px-5 py-2 rounded-xl text-sm font-medium text-white text-center overflow-hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {/* Background with purple base */}
                  <div className="absolute inset-0 bg-[#8b5cf6] rounded-xl" />

                  {/* Kiro-style spreading effect on hover */}
                  <div className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-[150%] group-hover:scale-y-[220%]" />

                  {/* Text */}
                  <span className="relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-500">
                    Download
                  </span>
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
    </nav>
  )
}
