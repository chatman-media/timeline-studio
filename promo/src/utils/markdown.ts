import matter from "gray-matter"

export interface PostMetadata {
  title: string
  date: string
  author?: string
  slug: string
  excerpt?: string
  version?: string
  category?: string
  readTime?: string
}

export interface Post {
  metadata: PostMetadata
  content: string
}

// Функция для парсинга markdown с frontmatter
export function parseMarkdown(fileContent: string): Post {
  try {
    const { data, content } = matter(fileContent)

    return {
      metadata: {
        title: data.title || "Untitled",
        date: data.date || new Date().toISOString(),
        author: data.author,
        slug: data.slug || "",
        excerpt: data.excerpt,
        version: data.version,
        category: data.category,
        readTime: data.readTime,
      },
      content,
    }
  } catch (error) {
    console.error("Error parsing markdown:", error)
    // Возвращаем fallback данные
    return {
      metadata: {
        title: "Untitled",
        date: new Date().toISOString(),
        slug: "",
      },
      content: fileContent,
    }
  }
}

// В будущем здесь будут функции для загрузки файлов с сервера
export async function loadBlogPosts(): Promise<PostMetadata[]> {
  // TODO: Implement actual file loading
  return []
}

export async function loadBlogPost(slug: string): Promise<Post | null> {
  // TODO: Implement actual file loading
  console.log("Loading post with slug:", slug)
  return null
}

export async function loadChangelogEntries(): Promise<Post[]> {
  // TODO: Implement actual file loading
  return []
}
