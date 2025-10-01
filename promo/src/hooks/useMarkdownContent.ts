import { useEffect, useState } from "react"
import { useLanguage } from "../contexts/LanguageContext"
import { blogPostsList, blogPostsRaw } from "../data/blog-posts"
import type { Post, PostMetadata } from "../utils/markdown"
import { parseMarkdown } from "../utils/markdown"

// Загрузка всех постов блога
export function useBlogPosts() {
  const { language } = useLanguage()
  const [posts, setPosts] = useState<PostMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPosts() {
      try {
        // Используем явно импортированные посты для текущего языка
        const langPosts = blogPostsList[language as "en" | "ru" | "zh"] || blogPostsList.en
        const loadedPosts: PostMetadata[] = []

        for (const content of langPosts) {
          const { metadata } = parseMarkdown(content)

          // Если slug не задан, генерируем из заголовка
          if (!metadata.slug) {
            metadata.slug = metadata.title
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "")
          }

          loadedPosts.push(metadata)
        }

        // Сортируем по дате (новые первые)
        loadedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        setPosts(loadedPosts)
      } catch (error) {
        console.error("Error loading blog posts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [language]) // Перезагружаем посты при смене языка

  return { posts, isLoading }
}

// Загрузка одного поста
export function useBlogPost(slug: string) {
  const { language } = useLanguage()
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      try {
        // Используем явные импорты для текущего языка
        const langPosts = blogPostsRaw[language as "en" | "ru" | "zh"] || blogPostsRaw.en
        const content = langPosts[slug as keyof typeof langPosts]

        if (content) {
          const parsedPost = parseMarkdown(content)
          setPost(parsedPost)
        } else {
          console.error("Post not found for slug:", slug, "in language:", language)
        }
      } catch (error) {
        console.error("Error loading blog post:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPost()
  }, [slug, language]) // Перезагружаем пост при смене языка

  return { post, isLoading }
}

// Загрузка changelog записей
export function useChangelogEntries() {
  const [entries, setEntries] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadEntries() {
      try {
        const changelogFiles = import.meta.glob("../../content/changelog/*.md", {
          query: "?raw",
          import: "default",
        })

        const loadedEntries: Post[] = []

        for (const path in changelogFiles) {
          const content = (await changelogFiles[path]()) as string
          const entry = parseMarkdown(content)
          loadedEntries.push(entry)
        }

        // Сортируем по версии или дате
        loadedEntries.sort((a, b) => {
          if (a.metadata.version && b.metadata.version) {
            return b.metadata.version.localeCompare(a.metadata.version)
          }
          return new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime()
        })

        setEntries(loadedEntries)
      } catch (error) {
        console.error("Error loading changelog entries:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEntries()
  }, [])

  return { entries, isLoading }
}
