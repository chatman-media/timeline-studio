import { Helmet } from "react-helmet-async"

interface SEOProps {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: "website" | "article"
  noIndex?: boolean
}

const BASE_URL = "https://timelinestudio.pro"
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`
const SITE_NAME = "Timeline Studio"

export const SEO: React.FC<SEOProps> = ({
  title,
  description = "Professional video editor with 100+ AI tools. Local features free forever. Local AI processing.",
  image = DEFAULT_IMAGE,
  url,
  type = "website",
  noIndex = false,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Professional Video Editor with AI`
  const fullUrl = url ? `${BASE_URL}/#${url}` : BASE_URL

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Canonical */}
      <link rel="canonical" href={fullUrl} />
    </Helmet>
  )
}

export default SEO
