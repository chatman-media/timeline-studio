// Конфигурация путей к markdown файлам для каждого языка
// Используем прямые пути для fetch API

export const blogPostsConfig = {
  en: {
    'release-3-15-0': '/content/blog/en/release-3-15-0.md',
    'release-3-14-0': '/content/blog/en/release-3-14-0.md',
    'release-3-11-0': '/content/blog/en/release-3-11-0.md',
    'release-2-6-0': '/content/blog/en/release-2-6-0.md',
    'alpha-release-ollama-integration': '/content/blog/en/alpha-release-ollama-integration.md',
    'introducing-timeline-studio': '/content/blog/en/introducing-timeline-studio.md',
  },
  ru: {
    'release-3-15-0': '/content/blog/ru/release-3-15-0.md',
    'release-3-14-0': '/content/blog/ru/release-3-14-0.md',
    'release-3-11-0': '/content/blog/ru/release-3-11-0.md',
    'release-2-6-0': '/content/blog/ru/release-2-6-0.md',
    'alpha-release-ollama-integration': '/content/blog/ru/alpha-release-ollama-integration.md',
    'introducing-timeline-studio': '/content/blog/ru/introducing-timeline-studio.md',
  },
  zh: {
    'release-3-15-0': '/content/blog/zh/release-3-15-0.md',
    'release-3-14-0': '/content/blog/zh/release-3-14-0.md',
    'release-3-11-0': '/content/blog/zh/release-3-11-0.md',
    'release-2-6-0': '/content/blog/zh/release-2-6-0.md',
    'alpha-release-ollama-integration': '/content/blog/zh/alpha-release-ollama-integration.md',
    'introducing-timeline-studio': '/content/blog/zh/introducing-timeline-studio.md',
  },
}

// Порядок постов (от новых к старым)
export const blogPostsOrder = [
  'release-3-15-0',
  'release-3-14-0',
  'release-3-11-0',
  'release-2-6-0',
  'alpha-release-ollama-integration',
  'introducing-timeline-studio',
]
