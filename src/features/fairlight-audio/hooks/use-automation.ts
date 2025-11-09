import { useCallback, useEffect, useRef, useState } from "react"
import { AutomationEngine, type AutomationMode } from "../services/automation-engine"
import { useAudioEngine } from "./use-audio-engine"

export function useAutomation() {
  const { engine: audioEngine } = useAudioEngine()
  const automationEngineRef = useRef<AutomationEngine | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Инициализируем automation engine
  useEffect(() => {
    if (!automationEngineRef.current) {
      automationEngineRef.current = new AutomationEngine()
      setIsInitialized(true)
    }

    return () => {
      setIsInitialized(false)
    }
  }, [])

  // Регистрируем callback'и для параметров
  const registerParameter = useCallback(
    (channelId: string, parameterId: string, callback: (value: number) => void) => {
      const automation = automationEngineRef.current
      if (!automation || !isInitialized) return

      const laneId = `${channelId}.${parameterId}`
      automation.registerParameterCallback(laneId, callback)
    },
    [isInitialized],
  )

  // Автоматическая регистрация основных параметров микшера
  useEffect(() => {
    const automation = automationEngineRef.current
    if (!automation || !audioEngine || !isInitialized) return

    // Регистрируем volume для всех каналов
    const channels = audioEngine.getChannels()
    channels.forEach((_channel, channelId) => {
      // Volume
      registerParameter(channelId, "volume", (value) => {
        audioEngine.updateChannelVolume(channelId, value)
      })

      // Pan
      registerParameter(channelId, "pan", (value) => {
        audioEngine.updateChannelPan(channelId, (value - 0.5) * 2) // -1 to 1
      })

      // Mute
      registerParameter(channelId, "mute", (value) => {
        audioEngine.muteChannel(channelId, value > 0.5)
      })

      // Solo
      registerParameter(channelId, "solo", (value) => {
        audioEngine.soloChannel(channelId, value > 0.5)
      })
    })
  }, [audioEngine, registerParameter, isInitialized])

  // Запись параметра
  const writeParameter = useCallback(
    (channelId: string, parameterId: string, value: number) => {
      const automation = automationEngineRef.current
      if (!automation || !isInitialized) return

      const laneId = `${channelId}.${parameterId}`
      automation.writeParameter(laneId, value)
    },
    [isInitialized],
  )

  // Touch/Release для touch и latch режимов
  const touchParameter = useCallback(
    (channelId: string, parameterId: string) => {
      const automation = automationEngineRef.current
      if (!automation || !isInitialized) return

      const laneId = `${channelId}.${parameterId}`
      automation.touchParameter(laneId)
    },
    [isInitialized],
  )

  const releaseParameter = useCallback(
    (channelId: string, parameterId: string) => {
      const automation = automationEngineRef.current
      if (!automation || !isInitialized) return

      const laneId = `${channelId}.${parameterId}`
      automation.releaseParameter(laneId)
    },
    [isInitialized],
  )

  // Управление режимом
  const setMode = useCallback(
    (mode: AutomationMode) => {
      const automation = automationEngineRef.current
      if (!automation || !isInitialized) return

      automation.setMode(mode)
    },
    [isInitialized],
  )

  const startRecording = useCallback(() => {
    const automation = automationEngineRef.current
    if (!automation || !isInitialized) return

    automation.startRecording()
  }, [isInitialized])

  const stopRecording = useCallback(() => {
    const automation = automationEngineRef.current
    if (!automation || !isInitialized) return

    automation.stopRecording()
  }, [isInitialized])

  // Обновление времени
  const updateTime = useCallback(
    (time: number) => {
      const automation = automationEngineRef.current
      if (!automation || !isInitialized) return

      automation.updateTime(time)
    },
    [isInitialized],
  )

  // Создание линии автоматизации
  const createLane = useCallback(
    (channelId: string, parameterId: string, initialValue = 0.5) => {
      const automation = automationEngineRef.current
      if (!automation || !isInitialized) return

      return automation.createLane(channelId, parameterId, initialValue)
    },
    [isInitialized],
  )

  // Получение состояния
  const getState = useCallback(() => {
    const automation = automationEngineRef.current
    if (!automation || !isInitialized) return null

    return automation.getState()
  }, [isInitialized])

  // Экспорт/импорт
  const exportAutomation = useCallback(() => {
    const automation = automationEngineRef.current
    if (!automation || !isInitialized) return null

    return automation.exportAutomation()
  }, [isInitialized])

  const importAutomation = useCallback(
    (data: any) => {
      const automation = automationEngineRef.current
      if (!automation || !isInitialized) return

      automation.importAutomation(data)
    },
    [isInitialized],
  )

  return {
    automationEngine: automationEngineRef.current,
    registerParameter,
    writeParameter,
    touchParameter,
    releaseParameter,
    setMode,
    startRecording,
    stopRecording,
    updateTime,
    createLane,
    getState,
    exportAutomation,
    importAutomation,
  }
}
