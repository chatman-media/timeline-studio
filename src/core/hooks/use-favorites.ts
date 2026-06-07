import { useCallback, useEffect, useMemo, useState } from "react"
import { container } from "../container"
import type { BrowserState, BrowserTab, ProjectState } from "../types"

type FavoritesByType = Record<string, string[]>

const emptyFavorites: FavoritesByType = {
  transition: [],
  effect: [],
  template: [],
  filter: [],
  subtitle: [],
  media: [],
  music: [],
  styleTemplate: [],
}

const typeToTabMap: Record<string, BrowserTab> = {
  transition: "transitions",
  effect: "effects",
  template: "templates",
  filter: "filters",
  subtitle: "subtitles",
  media: "media",
  music: "music",
  styleTemplate: "style_templates",
}

const tabToTypeMap: Partial<Record<BrowserTab, string>> = {
  transitions: "transition",
  effects: "effect",
  templates: "template",
  filters: "filter",
  subtitles: "subtitle",
  media: "media",
  music: "music",
  style_templates: "styleTemplate",
}

function getBrowserState(projectState: ProjectState | null): BrowserState | null {
  return projectState?.browser_state ?? ((projectState?.ui_state?.browser_state as BrowserState | null) || null)
}

function mapFavorites(browserState: BrowserState | null): FavoritesByType {
  const result: FavoritesByType = { ...emptyFavorites }

  if (!browserState?.favorites) {
    return result
  }

  for (const [tab, fileIds] of Object.entries(browserState.favorites)) {
    const type = tabToTypeMap[tab as BrowserTab]

    if (type) {
      result[type] = fileIds as string[]
    }
  }

  return result
}

export function useFavorites() {
  const [browserState, setBrowserState] = useState<BrowserState | null>(null)

  useEffect(() => {
    let isMounted = true

    if (!container.hasBackend()) {
      return
    }

    const backend = container.getBackend()

    backend
      .getProjectState()
      .then((projectState) => {
        if (isMounted) {
          setBrowserState(getBrowserState(projectState))
        }
      })
      .catch(() => {
        if (isMounted) {
          setBrowserState(null)
        }
      })

    const unsubscribe = backend.onStateChange((projectState) => {
      if (isMounted) {
        setBrowserState(getBrowserState(projectState))
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const favorites = useMemo(() => mapFavorites(browserState), [browserState])

  const addToFavorites = useCallback(async (item: any, type: string) => {
    const tab = typeToTabMap[type]

    if (!tab || !container.hasBackend()) {
      return
    }

    await container.getBackend().executeCommand({
      type: "BrowserAddToFavorites",
      params: { file_id: item.id, tab },
    })

    setBrowserState((current) => ({
      ...(current ?? {
        active_tab: tab,
        selected_files: {},
        tab_settings: {},
        favorites: {},
      }),
      favorites: {
        ...(current?.favorites ?? {}),
        [tab]: Array.from(new Set([...(current?.favorites?.[tab] ?? []), item.id])),
      },
    }))
  }, [])

  const removeFromFavorites = useCallback(async (item: any, type: string) => {
    const tab = typeToTabMap[type]

    if (!tab || !container.hasBackend()) {
      return
    }

    await container.getBackend().executeCommand({
      type: "BrowserRemoveFromFavorites",
      params: { file_id: item.id, tab },
    })

    setBrowserState((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        favorites: {
          ...current.favorites,
          [tab]: (current.favorites?.[tab] ?? []).filter((fileId) => fileId !== item.id),
        },
      }
    })
  }, [])

  const isItemFavorite = useCallback(
    (item: any, type: string) => {
      return favorites[type]?.includes(item.id) || false
    },
    [favorites],
  )

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isItemFavorite,
  }
}
