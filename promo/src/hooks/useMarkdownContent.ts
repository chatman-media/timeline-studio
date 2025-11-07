import { useEffect, useState } from "react"
import { useLanguage } from "../contexts/LanguageContext"
import { blogPostsConfig, blogPostsOrder } from "../data/blog-posts"
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
        const langKey = language as "en" | "ru" | "zh"
        const langConfig = blogPostsConfig[langKey] || blogPostsConfig.en
        const loadedPosts: PostMetadata[] = []

        console.log('[useBlogPosts] Loading posts for language:', language)

        for (const slug of blogPostsOrder) {
          const path = langConfig[slug as keyof typeof langConfig]
          if (!path) {
            console.warn('[useBlogPosts] No path found for slug:', slug)
            continue
          }

          try {
            console.log('[useBlogPosts] Fetching:', path)
            const response = await fetch(path)
            if (!response.ok) {
              console.error('[useBlogPosts] Failed to fetch:', path, response.status)
              continue
            }

            const content = await response.text()
            console.log('[useBlogPosts] Loaded content for', slug, 'type:', typeof content, 'length:', content.length)

            if (typeof content !== 'string' || content.length === 0) {
              console.warn('[useBlogPosts] Invalid content for slug:', slug)
              continue
            }

            const { metadata } = parseMarkdown(content)
            console.log('[useBlogPosts] Parsed metadata:', metadata.title, metadata.slug)

            // Если slug не задан, используем из конфига
            if (!metadata.slug) {
              metadata.slug = slug
            }

            loadedPosts.push(metadata)
          } catch (error) {
            console.error('[useBlogPosts] Error loading post:', slug, error)
          }
        }

        console.log('[useBlogPosts] Total loaded posts:', loadedPosts.length)
        setPosts(loadedPosts)
      } catch (error) {
        console.error("Error loading blog posts:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPosts()
  }, [language])

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
        const langKey = language as "en" | "ru" | "zh"
        const langConfig = blogPostsConfig[langKey] || blogPostsConfig.en
        const path = langConfig[slug as keyof typeof langConfig]

        if (!path) {
          console.error("Post path not found for slug:", slug, "in language:", language)
          setIsLoading(false)
          return
        }

        const response = await fetch(path)
        if (!response.ok) {
          console.error("Failed to fetch post:", path, response.status)
          setIsLoading(false)
          return
        }

        const content = await response.text()

        if (typeof content === 'string' && content.length > 0) {
          const parsedPost = parseMarkdown(content)
          setPost(parsedPost)
        } else {
          console.error("Invalid content for slug:", slug)
        }
      } catch (error) {
        console.error("Error loading blog post:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPost()
  }, [slug, language])

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
