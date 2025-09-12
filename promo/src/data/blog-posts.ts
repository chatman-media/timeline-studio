// Явный импорт всех постов блога

// English posts
import enAiEditingRaw from "../../content/blog/en/ai-video-editing-guide.md?raw"
import enAlphaReleaseRaw from "../../content/blog/en/alpha-release-ollama-integration.md?raw"
import enIntroducingRaw from "../../content/blog/en/introducing-timeline-studio.md?raw"
import enVersionRaw from "../../content/blog/en/version-079-documentation-investment.md?raw"

// Russian posts
import ruAiEditingRaw from "../../content/blog/ru/ai-video-editing-guide.md?raw"
import ruAlphaReleaseRaw from "../../content/blog/ru/alpha-release-ollama-integration.md?raw"
import ruIntroducingRaw from "../../content/blog/ru/introducing-timeline-studio.md?raw"

// Chinese posts
import zhAiEditingRaw from "../../content/blog/zh/ai-video-editing-guide.md?raw"
import zhAlphaReleaseRaw from "../../content/blog/zh/alpha-release-ollama-integration.md?raw"
import zhIntroducingRaw from "../../content/blog/zh/introducing-timeline-studio.md?raw"
import zhVersionRaw from "../../content/blog/zh/version-079-documentation-investment.md?raw"

export const blogPostsRaw = {
  en: {
    "introducing-timeline-studio": enIntroducingRaw,
    "ai-video-editing-guide": enAiEditingRaw,
    "alpha-release-ollama-integration": enAlphaReleaseRaw,
    "version-079-documentation-investment": enVersionRaw,
    "getting-started-ai-editing": enAiEditingRaw, // alias for compatibility
  },
  ru: {
    "introducing-timeline-studio": ruIntroducingRaw,
    "ai-video-editing-guide": ruAiEditingRaw,
    "alpha-release-ollama-integration": ruAlphaReleaseRaw,
    "getting-started-ai-editing": ruAiEditingRaw, // alias for compatibility
  },
  zh: {
    "introducing-timeline-studio": zhIntroducingRaw,
    "ai-video-editing-guide": zhAiEditingRaw,
    "alpha-release-ollama-integration": zhAlphaReleaseRaw,
    "version-079-documentation-investment": zhVersionRaw,
    "getting-started-ai-editing": zhAiEditingRaw, // alias for compatibility
  },
}

export const blogPostsList = {
  en: [enVersionRaw, enAlphaReleaseRaw, enIntroducingRaw, enAiEditingRaw],
  ru: [ruAlphaReleaseRaw, ruIntroducingRaw, ruAiEditingRaw],
  zh: [zhVersionRaw, zhAlphaReleaseRaw, zhIntroducingRaw, zhAiEditingRaw],
}
