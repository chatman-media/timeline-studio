import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { LanguageToggle } from "./LanguageToggle";
import { Logo } from "./Logo";

interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
  isScroll?: boolean;
}

const navItems: NavItem[] = [];

// Moved inside component to access translations

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const rightNavItems: NavItem[] = [
    { label: t("nav.about").toUpperCase(), href: "/about", isExternal: false },
    // { label: t("nav.pricing").toUpperCase(), href: "/pricing", isExternal: false }, // Hidden during beta
    {
      label: t("nav.changelog").toUpperCase(),
      href: "/changelog",
      isExternal: false,
    },
    { label: t("nav.docs").toUpperCase(), href: "/docs", isExternal: false },
    { label: t("nav.blog").toUpperCase(), href: "/blog", isExternal: false },
    {
      label: t("nav.investors").toUpperCase(),
      href: "/investors",
      isExternal: false,
    },
  ];

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);

          // Определяем активную секцию только для скролл-элементов из обоих массивов
          const allItems = [...navItems, ...rightNavItems];
          const scrollSections = allItems
            .filter((item) => item.isScroll)
            .map((item) => item.href.slice(1));
          const scrollPosition = window.scrollY + 100;

          for (const section of scrollSections) {
            const element = document.getElementById(section);
            if (element) {
              const { offsetTop, offsetHeight } = element;
              if (
                scrollPosition >= offsetTop &&
                scrollPosition < offsetTop + offsetHeight
              ) {
                setActiveSection(section);
                break;
              }
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Проверяем начальное состояние
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-[padding] duration-300 ease-out ${isScrolled ? "py-0" : "py-3"}`}
      data-oid="28i7l8a"
    >
      <div
        className={`transition-[padding] duration-300 ease-out ${isScrolled ? "px-2 md:px-2 pt-3" : "px-2 md:px-2 lg:px-2"}`}
        data-oid="jopqldy"
      >
        <div
          className={`flex items-center justify-between outline-none border border-transparent px-3 md:px-5 py-3 transition-[background-color,border-radius,box-shadow] duration-300 ease-out ${
            isScrolled ? "nav-glass-scrolled rounded-2xl" : ""
          }`}
          data-oid="obfclv1"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ position: "relative" }}
            data-oid="r1y3wf8"
          >
            <Link to="/" className="inline-block" data-oid="8i8-pom">
              <Logo size="medium" data-oid="ssulblm" />
            </Link>
          </motion.div>

          {/* Right side container */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="flex items-center space-x-2 lg:space-x-6"
            style={{ position: "relative" }}
            data-oid="4._zv7x"
          >
            {/* Navigation Items */}
            <ul
              className="hidden lg:flex items-center space-x-0.5 lg:space-x-1 xl:space-x-2"
              data-oid="tgur92c"
            >
              {[...navItems, ...rightNavItems].map((item) => (
                <li key={item.href} data-oid="sl_ad9b">
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-2 lg:px-3 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200 tracking-wider"
                      data-oid="fgc0sd_"
                    >
                      {item.label}
                    </a>
                  ) : item.isScroll ? (
                    <a
                      href={item.href}
                      onClick={(e) => handleClick(e, item.href)}
                      className={`block px-2 lg:px-3 py-2 text-xs font-medium transition-colors duration-200 tracking-wider ${
                        activeSection === item.href.slice(1)
                          ? "text-white"
                          : "text-gray-300 hover:text-white"
                      }`}
                      data-oid="gsq_bfo"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="block px-2 lg:px-3 py-2 text-xs font-medium text-gray-300 hover:text-white transition-colors duration-200 tracking-wider"
                      data-oid="a2h29mf"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>

            {/* Language Toggle */}
            <div
              className="hidden min-[560px]:flex items-center mr-1 xl:mr-2"
              data-oid="m_89fm5"
            >
              <LanguageToggle className="mr-2 xl:mr-4" data-oid="a:8z_dc" />
            </div>

            {/* Download Button */}
            <a
              href="https://github.com/chatman-media/timeline-studio/releases/latest"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative inline-flex px-3 lg:px-4 py-2 lg:py-3 rounded-xl text-xs lg:text-sm font-medium text-white overflow-hidden mr-3 lg:mr-7 cursor-pointer"
              data-oid="rgnt1qm"
            >
              {/* Background with purple base */}
              <div
                className="absolute inset-0 bg-[#8b5cf6] rounded-xl"
                data-oid="3yy51z3"
              />

              {/* Kiro-style spreading effect on hover */}
              <div
                className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-150 group-hover:scale-y-220"
                data-oid="7o6zu3v"
              />

              {/* Text */}
              <span
                className="relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-500"
                data-oid="1a2208t"
              >
                {t("nav.download")}
              </span>
            </a>

            {/* Mobile menu button */}
            <button
              className="lg:hidden text-white cursor-pointer"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              data-oid="xxfaldf"
            >
              {isMobileMenuOpen ? (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  data-oid="se8jytt"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                    data-oid="x19w8np"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  data-oid="7ekcram"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                    data-oid="yuia14q"
                  />
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
            className="lg:hidden mt-2 nav-glass-scrolled rounded-2xl p-4"
            data-oid="1:qwwht"
          >
            <ul className="space-y-2" data-oid="7rsncq6">
              {[...navItems, ...rightNavItems].map((item) => (
                <li key={item.href} data-oid="g4plsd6">
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-oid="4fwadyc"
                    >
                      {item.label}
                    </a>
                  ) : item.isScroll ? (
                    <a
                      href={item.href}
                      onClick={(e) => {
                        handleClick(e, item.href);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`block px-4 py-2 text-sm font-medium hover:bg-white/10 rounded-lg transition-colors duration-200 ${
                        activeSection === item.href.slice(1)
                          ? "text-white bg-white/10"
                          : "text-gray-300 hover:text-white"
                      }`}
                      data-oid="djbn_vo"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-oid="rw_ocq0"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}

              {/* Language toggle in mobile menu */}
              <li className="pt-2 border-t border-gray-700" data-oid="cqg95u6">
                <LanguageToggle isMobile={true} data-oid="rgt59fw" />
              </li>

              {/* Download button in mobile menu */}
              <li className="pt-2" data-oid="3q_wiwt">
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block mx-4 px-5 py-2 rounded-xl text-sm font-medium text-white text-center overflow-hidden"
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-oid="tvmizrl"
                >
                  {/* Background with purple base */}
                  <div
                    className="absolute inset-0 bg-[#8b5cf6] rounded-xl"
                    data-oid="0u1cvhm"
                  />

                  {/* Kiro-style spreading effect on hover */}
                  <div
                    className="absolute inset-0 z-10 rounded-xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-150 group-hover:scale-y-220"
                    data-oid="d-n9.h7"
                  />

                  {/* Text */}
                  <span
                    className="relative z-20 group-hover:text-[#8b5cf6] transition-colors duration-500"
                    data-oid="ci1.0e5"
                  >
                    Download
                  </span>
                </a>
              </li>
            </ul>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
