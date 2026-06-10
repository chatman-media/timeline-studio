/**
 * @vitest-environment jsdom
 */
/**
 * Интеграционные тесты для AppInitProvider
 *
 * Проверяет взаимодействие с реальными адаптерами и контейнером
 */

import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AppInitProvider, useAppInit } from "../app-init-provider"

// Мокируем только окружение
vi.mock("@/lib/environment", () => ({
  isDesktop: vi.fn(),
}))

import { container } from "@timeline-studio/core/container"
import { isDesktop } from "@/lib/environment"

describe("AppInitProvider Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Очищаем контейнер перед каждым тестом
    if (container.hasPlatform()) {
      ;(container as any).platform = null
    }
    if (container.hasStorage()) {
      ;(container as any).storage = null
    }
    if (container.hasBackend()) {
      ;(container as any).backend = null
    }
  })

  describe("Mock Adapters Integration", () => {
    it("должен инициализировать Mock адаптеры и зарегистрировать их в контейнере", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let initState: any = null

      function TestComponent() {
        initState = useAppInit()
        return (
          <div data-testid="ready" data-oid="ttutxnl">
            Ready
          </div>
        )
      }

      render(
        <AppInitProvider data-oid="l8cmdi8">
          <TestComponent data-oid="2ihf9sq" />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("ready")).toBeInTheDocument()
      })

      // Проверяем, что состояние обновилось
      expect(initState.initialized).toBe(true)
      expect(initState.isDesktop).toBe(false)

      // Проверяем, что сервисы зарегистрированы
      expect(initState.platform).not.toBeNull()
      expect(initState.storage).not.toBeNull()

      // Проверяем, что контейнер содержит сервисы
      expect(container.hasPlatform()).toBe(true)
      expect(container.hasStorage()).toBe(true)
    })

    it("должен предоставить доступ к Platform сервису", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let platformService: any = null

      function TestComponent() {
        const { platform } = useAppInit()
        platformService = platform
        return (
          <div data-testid="content" data-oid="xpx2wj8">
            Content
          </div>
        )
      }

      render(
        <AppInitProvider data-oid="8cp8h:_">
          <TestComponent data-oid="zwm82j3" />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(platformService).not.toBeNull()
      })

      // Проверяем, что Platform сервис имеет нужные методы
      expect(typeof platformService.convertFileSrc).toBe("function")
      expect(typeof platformService.showOpenDialog).toBe("function")
      expect(typeof platformService.readFile).toBe("function")
    })

    it("должен предоставить доступ к Storage сервису", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let storageService: any = null

      function TestComponent() {
        const { storage } = useAppInit()
        storageService = storage
        return (
          <div data-testid="content" data-oid=":-zp4mo">
            Content
          </div>
        )
      }

      render(
        <AppInitProvider data-oid="hc:52xk">
          <TestComponent data-oid="v4m6:-r" />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(storageService).not.toBeNull()
      })

      // Проверяем, что Storage сервис имеет нужные методы
      expect(typeof storageService.get).toBe("function")
      expect(typeof storageService.set).toBe("function")
      expect(typeof storageService.delete).toBe("function")
      expect(typeof storageService.has).toBe("function")
      expect(typeof storageService.clear).toBe("function")
    })
  })

  describe("Nested Providers", () => {
    it("должен работать с вложенными провайдерами", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let initState: any = null

      function NestedProvider({ children }: { children: React.ReactNode }) {
        return (
          <div data-testid="nested-provider" data-oid="ngduljg">
            {children}
          </div>
        )
      }

      function TestComponent() {
        initState = useAppInit()
        return (
          <div data-testid="test-component" data-oid="xf4j1dz">
            Test
          </div>
        )
      }

      render(
        <AppInitProvider data-oid="i8cyb-j">
          <NestedProvider data-oid="6zatwa5">
            <TestComponent data-oid="zc6:qnz" />
          </NestedProvider>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("test-component")).toBeInTheDocument()
      })

      expect(initState.initialized).toBe(true)
      expect(screen.getByTestId("nested-provider")).toBeInTheDocument()
    })

    it("должен предоставить контекст для всех дочерних компонентов", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      const results: boolean[] = []

      function Level1() {
        const { initialized } = useAppInit()
        results[0] = initialized
        return (
          <div data-testid="level1" data-oid="eq-.48k">
            <Level2 data-oid="tho:gsc" />
          </div>
        )
      }

      function Level2() {
        const { initialized } = useAppInit()
        results[1] = initialized
        return (
          <div data-testid="level2" data-oid="tgzrl-.">
            <Level3 data-oid="sgccah." />
          </div>
        )
      }

      function Level3() {
        const { initialized } = useAppInit()
        results[2] = initialized
        return (
          <div data-testid="level3" data-oid="gxwyakl">
            Deep
          </div>
        )
      }

      render(
        <AppInitProvider data-oid="zt_hql2">
          <Level1 data-oid="3v-rmt5" />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("level3")).toBeInTheDocument()
      })

      // Все уровни должны получить одинаковое состояние
      expect(results).toEqual([true, true, true])
    })
  })

  describe("Concurrent Rendering", () => {
    it("должен корректно работать при одновременном рендере нескольких компонентов", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      const states: any[] = []

      function Component1() {
        const state = useAppInit()
        states[0] = state
        return (
          <div data-testid="comp1" data-oid="2i63dof">
            Component 1
          </div>
        )
      }

      function Component2() {
        const state = useAppInit()
        states[1] = state
        return (
          <div data-testid="comp2" data-oid="2w59zvq">
            Component 2
          </div>
        )
      }

      function Component3() {
        const state = useAppInit()
        states[2] = state
        return (
          <div data-testid="comp3" data-oid="08.:u4l">
            Component 3
          </div>
        )
      }

      render(
        <AppInitProvider data-oid=".84zwi9">
          <Component1 data-oid="aqq5oq5" />
          <Component2 data-oid="1n_z0ei" />
          <Component3 data-oid="z2xa.4w" />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("comp1")).toBeInTheDocument()
        expect(screen.getByTestId("comp2")).toBeInTheDocument()
        expect(screen.getByTestId("comp3")).toBeInTheDocument()
      })

      // Все компоненты должны получить одинаковое состояние
      expect(states[0]).toEqual(states[1])
      expect(states[1]).toEqual(states[2])
      expect(states[0].initialized).toBe(true)
    })
  })

  describe("Platform Service Usage", () => {
    it("Platform сервис должен корректно конвертировать пути", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let convertedUrl = ""

      function TestComponent() {
        const { platform } = useAppInit()

        if (platform) {
          convertedUrl = platform.convertFileSrc("/test/path.mp4")
        }

        return (
          <div data-testid="test" data-oid="4-w-.5x">
            Test
          </div>
        )
      }

      render(
        <AppInitProvider data-oid="kq5pf5u">
          <TestComponent data-oid="qq2wzvs" />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(convertedUrl).toBeTruthy()
      })

      // Mock адаптер должен вернуть file:// URL
      expect(convertedUrl).toBe("file:///test/path.mp4")
    })

    it("Platform сервис должен сохранять URL без изменений", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let convertedUrl = ""

      function TestComponent() {
        const { platform } = useAppInit()

        if (platform) {
          convertedUrl = platform.convertFileSrc("http://example.com/video.mp4")
        }

        return (
          <div data-testid="test" data-oid="p31v--n">
            Test
          </div>
        )
      }

      render(
        <AppInitProvider data-oid="legm1:m">
          <TestComponent data-oid="l05asry" />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(convertedUrl).toBeTruthy()
      })

      // URL должен остаться без изменений
      expect(convertedUrl).toBe("http://example.com/video.mp4")
    })
  })

  describe("Storage Service Usage", () => {
    it("Storage сервис должен сохранять и читать значения", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let storedValue: string | null = null

      function TestComponent() {
        const { storage, initialized } = useAppInit()

        if (storage && initialized) {
          void storage.set("test-key", "test-value").then(() => {
            void storage.get<string>("test-key").then((value) => {
              storedValue = value
            })
          })
        }

        return (
          <div data-testid="test" data-oid="lrpq6vm">
            Test
          </div>
        )
      }

      render(
        <AppInitProvider data-oid="ez8i.10">
          <TestComponent data-oid="2oq53q0" />
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(storedValue).toBeTruthy()
      })

      expect(storedValue).toBe("test-value")
    })

    it("Storage сервис должен удалять значения", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      let valueAfterDelete: string | null | undefined = "not-null"

      function TestComponent() {
        const { storage, initialized } = useAppInit()

        if (storage && initialized) {
          void storage
            .set("test-key", "test-value")
            .then(() => storage.delete("test-key"))
            .then(() => storage.get<string>("test-key"))
            .then((value) => {
              valueAfterDelete = value
            })
        }

        return (
          <div data-testid="test" data-oid="aj-1se5">
            Test
          </div>
        )
      }

      render(
        <AppInitProvider data-oid="pkt93l-">
          <TestComponent data-oid="r0mgeok" />
        </AppInitProvider>,
      )

      await waitFor(
        () => {
          expect(valueAfterDelete).not.toBe("not-null")
        },
        { timeout: 2000 },
      )

      expect(valueAfterDelete).toBeNull()
    })
  })

  describe("Container State", () => {
    it("контейнер должен содержать зарегистрированные сервисы после инициализации", async () => {
      vi.mocked(isDesktop).mockReturnValue(false)

      render(
        <AppInitProvider data-oid="-h.u-k0">
          <div data-testid="content" data-oid="imz5fb7">
            Content
          </div>
        </AppInitProvider>,
      )

      await waitFor(() => {
        expect(screen.getByTestId("content")).toBeInTheDocument()
      })

      // Проверяем, что сервисы зарегистрированы в контейнере
      expect(container.hasPlatform()).toBe(true)
      expect(container.hasStorage()).toBe(true)

      // Проверяем, что можем получить сервисы из контейнера
      const platform = container.getPlatform()
      const storage = container.getStorage()

      expect(platform).not.toBeNull()
      expect(storage).not.toBeNull()
    })
  })
})
