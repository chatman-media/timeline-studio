import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  noIndex?: boolean;
}

const BASE_URL = "https://timelinestudio.pro";
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = "Timeline Studio";

const updateMetaTag = (
  property: string,
  content: string,
  isProperty = false,
) => {
  const selector = isProperty
    ? `meta[property="${property}"]`
    : `meta[name="${property}"]`;
  let element = document.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    if (isProperty) {
      element.setAttribute("property", property);
    } else {
      element.setAttribute("name", property);
    }
    document.head.appendChild(element);
  }
  element.content = content;
};

const updateCanonical = (href: string) => {
  let element = document.querySelector(
    'link[rel="canonical"]',
  ) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
};

export const SEO: React.FC<SEOProps> = ({
  title,
  description = "Professional video editor with 100+ AI tools. Local features free forever. Local AI processing.",
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noIndex = false,
}) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} - Professional Video Editor with AI`;
  const fullUrl = url ? `${BASE_URL}/#${url}` : BASE_URL;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Basic meta tags
    updateMetaTag("description", description);
    if (noIndex) {
      updateMetaTag("robots", "noindex, nofollow");
    }

    // Open Graph
    updateMetaTag("og:title", fullTitle, true);
    updateMetaTag("og:description", description, true);
    updateMetaTag("og:image", image, true);
    updateMetaTag("og:url", fullUrl, true);
    updateMetaTag("og:type", type, true);
    updateMetaTag("og:site_name", SITE_NAME, true);

    // Twitter
    updateMetaTag("twitter:card", "summary_large_image");
    updateMetaTag("twitter:title", fullTitle);
    updateMetaTag("twitter:description", description);
    updateMetaTag("twitter:image", image);

    // Canonical
    updateCanonical(fullUrl);
  }, [fullTitle, description, image, fullUrl, type, noIndex]);

  return null;
};

export default SEO;
