// Конфигурация путей к markdown файлам для каждого языка
// Используем прямые пути для fetch API

export const blogPostsConfig = {
  en: {
    'release-2-6-0': '/src/content/blog/en/release-2-6-0.md',
    'ai-features-guide': '/src/content/blog/en/ai-features-guide.md',
    'getting-started': '/src/content/blog/en/getting-started.md',
  },
  ru: {
    'release-2-6-0': '/src/content/blog/ru/release-2-6-0.md',
    'ai-features-guide': '/src/content/blog/ru/ai-features-guide.md',
    'getting-started': '/src/content/blog/ru/getting-started.md',
  },
  zh: {
    'release-2-6-0': '/src/content/blog/zh/release-2-6-0.md',
    'ai-features-guide': '/src/content/blog/zh/ai-features-guide.md',
    'getting-started': '/src/content/blog/zh/getting-started.md',
  },
}

// Порядок постов (от новых к старым)
export const blogPostsOrder = ['release-2-6-0', 'ai-features-guide', 'getting-started']
