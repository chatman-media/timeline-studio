"use client"

import { useEffect } from "react"

import { createLogger } from "@/lib/tauri-logger"

const logger = createLogger({ module: "TauriMockProvider" })

const isTauri = () => {
  if (typeof window === "undefined") return false
  return (window as any).__TAURI_INTERNALS__ !== undefined && (window as any).__TAURI_INTERNALS__ !== null
}

export function TauriMockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only mock in browser environment when Tauri is not available
    // This includes development server and E2E tests
    if (typeof window !== "undefined" && !isTauri()) {
      // Mock navigator.mediaDevices API for Tauri environment
      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, "mediaDevices", {
          writable: true,
          value: {
            getUserMedia: () => {
              logger.warn(
                "[TauriMock] navigator.mediaDevices.getUserMedia not available in Tauri. Camera/microphone features disabled.",
              )
              return Promise.reject(new Error("MediaDevices API not available in Tauri environment"))
            },
            getDisplayMedia: () => {
              logger.warn(
                "[TauriMock] navigator.mediaDevices.getDisplayMedia not available in Tauri. Screen capture features disabled.",
              )
              return Promise.reject(new Error("MediaDevices API not available in Tauri environment"))
            },
            enumerateDevices: () => {
              logger.warn(
                "[TauriMock] navigator.mediaDevices.enumerateDevices not available in Tauri. Device enumeration disabled.",
              )
              return Promise.resolve([])
            },
          },
        })
      }
      // Track if temp project has been created
      let tempProjectCreated = false

      // Mock event plugin internals using Tauri's official mock structure
      // Store callbacks indexed by numeric IDs
      const callbacks = new Map<number, (data: any) => void>()
      // Store event listeners with their metadata
      const eventListeners: Record<string, { handlerId: number; event: string }> = {}

      function registerCallback(callback: any, once = false) {
        const identifier = Math.floor(Math.random() * 0xffffffff)
        callbacks.set(identifier, (data: any) => {
          if (once) {
            callbacks.delete(identifier)
          }
          return callback && callback(data)
        })
        return identifier
      }

      function unregisterCallback(id: number) {
        callbacks.delete(id)
      }

      function unregisterListener(_event: string, eventId: string) {
        // Безопасная проверка
        if (!eventId) return

        const listener = eventListeners[eventId]
        if (listener && typeof listener.handlerId === "number") {
          unregisterCallback(listener.handlerId)
          delete eventListeners[eventId]
        }
      }

      // Create a Proxy for listeners to prevent undefined access errors
      const listenersProxy = new Proxy(eventListeners, {
        get(target, prop) {
          if (typeof prop === "symbol") return undefined
          if (!(prop in target)) {
            return { handlerId: 0, event: "unknown" }
          }
          return target[prop as string]
        },
        has(target, prop) {
          return prop in target
        },
      })

      // Не перезаписываем если уже есть
      if (!(window as any).__TAURI_EVENT_PLUGIN_INTERNALS__) {
        ;(window as any).__TAURI_EVENT_PLUGIN_INTERNALS__ = {}
      }
      ;(window as any).__TAURI_EVENT_PLUGIN_INTERNALS__.listeners = listenersProxy
      ;(window as any).__TAURI_EVENT_PLUGIN_INTERNALS__.unregisterListener = unregisterListener

      ;(window as any).__TAURI_INTERNALS__ = {
        transformCallback: registerCallback,
        unregisterCallback,
        callbacks,
        invoke: async (cmd: string, args?: any) => {
          logger.info(`[TauriMock] Command: ${cmd}`, args)

          // Mock responses for common commands
          switch (cmd) {
            case "get_app_language_tauri":
              return { language: "ru", system_language: "ru" }
            case "get_media_files":
              return []
            case "file_exists":
              return false
            case "get_file_stats":
              return { size: 0, lastModified: Date.now() }
            case "get_app_directories":
              return {
                base_dir: "/Users/test/Movies/Timeline Studio",
                media_dir: "/Users/test/Movies/Timeline Studio/Media",
                projects_dir: "/Users/test/Movies/Timeline Studio/Projects",
                snapshot_dir: "/Users/test/Movies/Timeline Studio/Snapshots",
                cinematic_dir: "/Users/test/Movies/Timeline Studio/Cinematic",
                output_dir: "/Users/test/Movies/Timeline Studio/Output",
                render_dir: "/Users/test/Movies/Timeline Studio/Render",
                recognition_dir: "/Users/test/Movies/Timeline Studio/Recognition",
                backup_dir: "/Users/test/Movies/Timeline Studio/Backup",
                media_proxy_dir: "/Users/test/Movies/Timeline Studio/MediaProxy",
                caches_dir: "/Users/test/Movies/Timeline Studio/Caches",
                recorded_dir: "/Users/test/Movies/Timeline Studio/Recorded",
                audio_dir: "/Users/test/Movies/Timeline Studio/Audio",
                cloud_project_dir: "/Users/test/Movies/Timeline Studio/CloudProjects",
                upload_dir: "/Users/test/Movies/Timeline Studio/Upload",
              }
            case "get_active_jobs":
              return []
            case "load_store":
              return { settings: {}, projects: [], resources: [] }
            case "get_store":
              return { settings: {}, projects: [], resources: [] }
            case "get_gpu_capabilities":
              return { has_gpu: false, gpu_name: "Mock GPU", vram_mb: 0 }
            case "get_gpu_capabilities_full":
              return {
                available_encoders: ["VideoToolbox", "Software"],
                recommended_encoder: "VideoToolbox",
                current_gpu: {
                  name: "Apple M1",
                  driver_version: "Metal 3.0",
                  memory_total: 8192,
                  memory_used: 2048,
                  utilization: 25,
                  encoder_type: "VideoToolbox",
                  supported_codecs: ["h264", "hevc"],
                },
                hardware_acceleration_supported: true,
              }
            case "get_system_info":
              return {
                os: {
                  type: "Darwin",
                  version: "14.0",
                  architecture: "aarch64",
                },
                cpu: {
                  cores: 8,
                  arch: "aarch64",
                },
                memory: {
                  total_bytes: 8589934592,
                  total_mb: 8192,
                  total_gb: 8,
                },
                runtime: {
                  rust_version: "0.25.0",
                  tauri_version: "2.0.0",
                },
              }
            case "check_ffmpeg_capabilities":
              return {
                version: "5.1.2",
                available_codecs: ["h264", "hevc", "vp9", "av1"],
                hardware_encoders: ["h264_videotoolbox", "hevc_videotoolbox"],
                path: "/usr/local/bin/ffmpeg",
              }
            case "get_compiler_settings":
            case "get_compiler_settings_advanced":
              return {
                hardware_acceleration: true,
                max_concurrent_jobs: 2,
                temp_directory: "/tmp",
                cache_size_mb: 1024,
              }
            case "check_hardware_acceleration_support":
              return true
            case "set_hardware_acceleration":
              return null
            case "get_prerender_cache_info":
              return {
                file_count: 0,
                total_size: 0,
                cache_path: "/tmp/cache",
                files: [],
              }
            case "prerender_segment":
              // Mock prerender segment response
              return {
                filePath: "/tmp/prerender/mock_segment.mp4",
                duration: args?.end_time - args?.start_time || 10,
                fileSize: 1024 * 1024, // 1MB
                renderTimeMs: 100,
              }
            case "generate_preview":
              // Mock preview generation
              return Array.from({ length: 100 }, (_, i) => (i * 255) / 100) // Mock image data
            case "compile_video":
              // Mock video compilation
              return `mock-job-id-${Date.now()}`
            case "plugin:event|listen": {
              // Generate event ID and register listener
              const eventId = Math.random().toString(36).slice(2, 11)
              const handlerId = args?.handler || Math.floor(Math.random() * 0xffffffff)
              const eventName = args?.event || "unknown"

              // Register listener in the listeners object
              eventListeners[eventId] = {
                handlerId,
                event: eventName,
              }

              logger.debug(`[TauriMock] Registered listener for event: ${eventName}, eventId: ${eventId}`)
              return eventId
            }
            case "plugin:event|unlisten":
              // Unlisten will be handled by unregisterListener
              return null
            case "plugin:store|load":
              // Return a resource ID for the store
              return Math.random().toString(36).slice(2)
            case "plugin:store|get_store":
              // Return a resource ID for the store
              return Math.random().toString(36).slice(2)
            case "plugin:store|get":
              // Return [value, exists] tuple as expected by the store plugin
              if (args?.key === "app-settings") {
                return [
                  {
                    language: "en",
                    theme: "light",
                    autoSave: true,
                    autoSaveInterval: 5,
                    maxUndoSteps: 50,
                    recentProjects: [],
                  },
                  true,
                ]
              }
              if (args?.key === "user-settings") {
                return [
                  {
                    language: "en",
                    theme: "light",
                  },
                  true,
                ]
              }
              return [null, false]
            case "plugin:fs|exists":
              // Return true for any project file
              if (args?.path && args.path.includes(".tlsp")) {
                return true
              }
              return false
            case "plugin:fs|read_text_file":
              logger.info("[TauriMock] read_text_file called with path:", args?.path)
              // Check if it's a project file
              if (args?.path && args.path.includes(".tlsp")) {
                // For any .tlsp file, return a valid v2.0.0 project structure
                const projectId = Math.random().toString(36).slice(2)
                const sequenceId = Math.random().toString(36).slice(2)
                const now = new Date().toISOString()

                const projectData = {
                  metadata: {
                    id: projectId,
                    name: args.path.includes("temp_project") ? "Temporary Project" : "Test Project",
                    version: "2.0.0",
                    created: now,
                    modified: now,
                    platform: "macos",
                    appVersion: "1.0.0",
                  },
                  settings: {
                    resolution: "1920x1080",
                    frameRate: 30,
                    aspectRatio: { value: { name: "16:9", ratio: 1.7778 } },
                    audio: {
                      sampleRate: 48000,
                      bitDepth: 24,
                      channels: 2,
                      masterVolume: 1.0,
                      panLaw: "-3dB",
                    },
                    preview: {
                      resolution: "1/2",
                      quality: "better",
                      renderDuringPlayback: true,
                      useGPU: true,
                    },
                    exportPresets: [],
                  },
                  mediaPool: {
                    items: {},
                    bins: {},
                    stats: {
                      totalItems: 0,
                      totalSize: 0,
                      unusedItems: 0,
                    },
                  },
                  sequences: {
                    [sequenceId]: {
                      id: sequenceId,
                      name: "Sequence 1",
                      type: "main",
                      settings: {
                        resolution: { width: 1920, height: 1080 },
                        frameRate: 30,
                        aspectRatio: "16:9",
                        duration: 0,
                        audio: {
                          sampleRate: 48000,
                          bitDepth: 24,
                          channels: 2,
                        },
                      },
                      composition: {
                        tracks: [],
                        masterClips: [],
                      },
                      resources: {
                        effects: {},
                        filters: {},
                        transitions: {},
                        colorGrades: {},
                        titles: {},
                        generators: {},
                      },
                      markers: [],
                      history: [],
                      historyPosition: -1,
                      metadata: {
                        created: now,
                        modified: now,
                      },
                    },
                  },
                  activeSequenceId: sequenceId,
                  cache: {
                    thumbnails: {},
                    waveforms: {},
                    proxies: {},
                    sceneAnalysis: {},
                    totalSize: 0,
                  },
                  workspace: {
                    layout: "edit",
                    panels: {},
                    recentTools: [],
                    grid: {
                      enabled: false,
                      size: 10,
                      snapToGrid: false,
                      snapToClips: true,
                      magneticTimeline: true,
                    },
                  },
                  backup: {
                    autoSave: {
                      enabled: true,
                      interval: 5,
                      keepVersions: 10,
                    },
                    versions: [],
                    lastSaved: now,
                  },
                }
                const jsonString = JSON.stringify(projectData)
                logger.info(`[TauriMock] Returning project JSON for: ${args.path}`)
                return jsonString
              }
              // For other files that expect JSON, return valid empty JSON
              if (args?.path && (args.path.includes(".json") || args.path.includes("config"))) {
                return "{}"
              }
              // For other text files, return empty string
              return ""
            case "plugin:fs|write_text_file":
              // Mock writing file
              if (args?.path && args.path.includes("temp_project.tlsp")) {
                tempProjectCreated = true
              }
              return null
            case "plugin:path|join": {
              // Join path segments
              const paths = args?.paths || []
              return paths.join("/")
            }
            case "plugin:store|set":
              // Mock storing values
              return null
            case "plugin:store|save":
              // Mock saving store
              return null
            case "create_app_directories":
              return {
                base_dir: "/Users/test/Movies/Timeline Studio",
                media_dir: "/Users/test/Movies/Timeline Studio/Media",
                projects_dir: "/Users/test/Movies/Timeline Studio/Projects",
                snapshot_dir: "/Users/test/Movies/Timeline Studio/Snapshots",
                cinematic_dir: "/Users/test/Movies/Timeline Studio/Cinematic",
                output_dir: "/Users/test/Movies/Timeline Studio/Output",
                render_dir: "/Users/test/Movies/Timeline Studio/Render",
                recognition_dir: "/Users/test/Movies/Timeline Studio/Recognition",
                backup_dir: "/Users/test/Movies/Timeline Studio/Backup",
                media_proxy_dir: "/Users/test/Movies/Timeline Studio/MediaProxy",
                caches_dir: "/Users/test/Movies/Timeline Studio/Caches",
                recorded_dir: "/Users/test/Movies/Timeline Studio/Recorded",
                audio_dir: "/Users/test/Movies/Timeline Studio/Audio",
                cloud_project_dir: "/Users/test/Movies/Timeline Studio/CloudProjects",
                upload_dir: "/Users/test/Movies/Timeline Studio/Upload",
              }
            case "plugin:dialog|open_file":
              // Для тестов возвращаем пустой массив, если не переопределено
              return { paths: [] }
            case "plugin:dialog|open_folder":
              // Для тестов возвращаем null, если не переопределено
              return { path: null }
            case "scan_media_folder":
              // Возвращаем пустой массив файлов
              return []
            case "process_media_files":
              // Возвращаем успешный результат
              return { success: true, processed: 0 }
            case "list_api_keys":
              // Возвращаем пустой массив для API ключей (согласно типу ApiKeyInfo[])
              return []
            case "get_api_key":
              // Возвращаем null для отсутствующих ключей
              return null
            case "set_api_key":
              // Возвращаем успешный результат
              return { success: true }
            case "delete_api_key":
              // Возвращаем успешный результат
              return { success: true }
            case "ai_get_supported_providers":
              // Возвращаем список AI провайдеров (пустой в browser режиме)
              return { status: "ok", data: [], error: null }
            case "ai_get_provider_models":
              // Возвращаем пустой список моделей (в browser режиме без backend)
              return { status: "ok", data: [], error: null }
            case "ai_send_secure_request":
              // Mock AI request response
              return {
                status: "ok",
                data: {
                  provider: args?.provider || "mock",
                  content: "Mock AI response from browser mode",
                  toolCalls: null,
                },
                error: null,
              }
            default:
              logger.warn(`[TauriMock] Unhandled command: ${cmd}`, args)
              // Return sensible defaults for unknown commands instead of throwing
              if (cmd.includes("store")) return null
              if (cmd.includes("path")) return ""
              if (cmd.includes("fs")) return false
              return null
          }
        },
      }
    }
  }, [])

  return <>{children}</>
}
