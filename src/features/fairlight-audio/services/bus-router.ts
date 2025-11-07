/**
 * Bus Router Service
 * Система маршрутизации аудио сигналов между каналами, группами и шинами
 */

import { createLogger } from "@/lib/tauri-logger"

export interface AudioBus {
  id: string
  name: string
  type: "stereo" | "mono" | "surround"
  inputGain: GainNode
  outputGain: GainNode
  effects: AudioNode[]
  destinations: string[] // ID других шин или выходов
  isMuted: boolean
  isSolo: boolean
}

export interface ChannelGroup {
  id: string
  name: string
  channelIds: string[]
  busId: string // какая шина принимает группу
  color: string
  isMuted: boolean
  isSolo: boolean
  gain: number
}

export interface ChannelSend {
  id: string
  sourceChannelId: string
  destinationBusId: string
  level: number // 0-1
  isPre: boolean // pre или post fader
  isEnabled: boolean
}

export interface RoutingMatrix {
  buses: Map<string, AudioBus>
  groups: Map<string, ChannelGroup>
  sends: Map<string, ChannelSend>
  channelBusAssignments: Map<string, string> // channelId -> busId
}

export class BusRouter {
  private static logger = createLogger("BusRouter")
  private context: AudioContext
  private matrix: RoutingMatrix
  private masterBus: AudioBus
  private callbacks = new Map<string, () => void>()

  constructor(context: AudioContext) {
    this.context = context

    this.matrix = {
      buses: new Map(),
      groups: new Map(),
      sends: new Map(),
      channelBusAssignments: new Map(),
    }

    // Создаем мастер шину
    this.masterBus = this.createBus("master", "Master", "stereo")
    this.masterBus.outputGain.connect(context.destination)
  }

  /**
   * Создание новой шины
   */
  createBus(id: string, name: string, type: AudioBus["type"]): AudioBus {
    const inputGain = this.context.createGain()
    const outputGain = this.context.createGain()

    // Соединяем вход с выходом по умолчанию
    inputGain.connect(outputGain)

    const bus: AudioBus = {
      id,
      name,
      type,
      inputGain,
      outputGain,
      effects: [],
      destinations: ["master"], // по умолчанию идет в мастер
      isMuted: false,
      isSolo: false,
    }

    this.matrix.buses.set(id, bus)

    // Подключаем к мастеру по умолчанию
    if (id !== "master") {
      outputGain.connect(this.masterBus.inputGain)
    }

    return bus
  }

  /**
   * Создание группы каналов
   */
  createGroup(id: string, name: string, channelIds: string[], color = "#3b82f6"): ChannelGroup {
    // Создаем шину для группы
    const groupBus = this.createBus(`${id}_bus`, `${name} Bus`, "stereo")

    const group: ChannelGroup = {
      id,
      name,
      channelIds: [...channelIds],
      busId: groupBus.id,
      color,
      isMuted: false,
      isSolo: false,
      gain: 1.0,
    }

    this.matrix.groups.set(id, group)

    // Назначаем каналы в группу
    channelIds.forEach((channelId) => {
      this.assignChannelToBus(channelId, groupBus.id)
    })

    return group
  }

  /**
   * Назначение канала на шину
   */
  assignChannelToBus(channelId: string, busId: string) {
    this.matrix.channelBusAssignments.set(channelId, busId)
    this.notifyRoutingChange()
  }

  /**
   * Создание send (посыла)
   */
  createSend(id: string, sourceChannelId: string, destinationBusId: string, level = 0.5, isPre = false): ChannelSend {
    const send: ChannelSend = {
      id,
      sourceChannelId,
      destinationBusId,
      level,
      isPre,
      isEnabled: true,
    }

    this.matrix.sends.set(id, send)
    return send
  }

  /**
   * Подключение канала к роутингу
   */
  connectChannel(channelId: string, sourceNode: AudioNode): GainNode {
    // Создаем gain node для этого канала
    const channelGain = this.context.createGain()
    sourceNode.connect(channelGain)

    // Находим назначенную шину
    const assignedBusId = this.matrix.channelBusAssignments.get(channelId) || "master"
    const bus = this.matrix.buses.get(assignedBusId)

    if (bus) {
      channelGain.connect(bus.inputGain)
    }

    // Подключаем sends
    this.connectChannelSends(channelId, channelGain)

    return channelGain
  }

  /**
   * Подключение sends для канала
   */
  private connectChannelSends(channelId: string, channelNode: AudioNode) {
    const sends = Array.from(this.matrix.sends.values()).filter(
      (send) => send.sourceChannelId === channelId && send.isEnabled,
    )

    sends.forEach((send) => {
      const bus = this.matrix.buses.get(send.destinationBusId)
      if (bus) {
        const sendGain = this.context.createGain()
        sendGain.gain.value = send.level

        channelNode.connect(sendGain)
        sendGain.connect(bus.inputGain)
      }
    })
  }

  /**
   * Обновление уровня send
   */
  updateSendLevel(sendId: string, level: number) {
    const send = this.matrix.sends.get(sendId)
    if (send) {
      send.level = Math.max(0, Math.min(1, level))
      // Здесь нужно пересоздать соединения или обновить gain
      this.notifyRoutingChange()
    }
  }

  /**
   * Mute/Solo для шины
   */
  setBusMute(busId: string, muted: boolean) {
    const bus = this.matrix.buses.get(busId)
    if (bus) {
      bus.isMuted = muted
      bus.outputGain.gain.value = muted ? 0 : 1
    }
  }

  setBusSolo(busId: string, solo: boolean) {
    const bus = this.matrix.buses.get(busId)
    if (bus) {
      bus.isSolo = solo

      // Если есть solo, mute все остальные шины
      if (solo) {
        this.matrix.buses.forEach((otherBus, otherId) => {
          if (otherId !== busId && !otherBus.isSolo) {
            otherBus.outputGain.gain.value = 0
          }
        })
      } else {
        // Проверяем, есть ли другие solo шины
        const hasSoloBuses = Array.from(this.matrix.buses.values()).some((b) => b.isSolo)
        if (!hasSoloBuses) {
          // Возвращаем все шины в нормальное состояние
          this.matrix.buses.forEach((otherBus) => {
            otherBus.outputGain.gain.value = otherBus.isMuted ? 0 : 1
          })
        }
      }
    }
  }

  /**
   * Управление группами
   */
  setGroupMute(groupId: string, muted: boolean) {
    const group = this.matrix.groups.get(groupId)
    if (group) {
      group.isMuted = muted
      this.setBusMute(group.busId, muted)
    }
  }

  setGroupSolo(groupId: string, solo: boolean) {
    const group = this.matrix.groups.get(groupId)
    if (group) {
      group.isSolo = solo
      this.setBusSolo(group.busId, solo)
    }
  }

  setGroupGain(groupId: string, gain: number) {
    const group = this.matrix.groups.get(groupId)
    if (group) {
      group.gain = Math.max(0, Math.min(2, gain))
      const bus = this.matrix.buses.get(group.busId)
      if (bus) {
        bus.outputGain.gain.value = group.gain
      }
    }
  }

  /**
   * Добавление канала в группу
   */
  addChannelToGroup(groupId: string, channelId: string) {
    const group = this.matrix.groups.get(groupId)
    if (group && !group.channelIds.includes(channelId)) {
      group.channelIds.push(channelId)
      this.assignChannelToBus(channelId, group.busId)
    }
  }

  /**
   * Удаление канала из группы
   */
  removeChannelFromGroup(groupId: string, channelId: string) {
    const group = this.matrix.groups.get(groupId)
    if (group) {
      group.channelIds = group.channelIds.filter((id) => id !== channelId)
      // Возвращаем канал на мастер шину
      this.assignChannelToBus(channelId, "master")
    }
  }

  /**
   * Получение доступных шин для подключения
   */
  getAvailableBuses(): AudioBus[] {
    return Array.from(this.matrix.buses.values())
  }

  /**
   * Получение всех групп
   */
  getGroups(): ChannelGroup[] {
    return Array.from(this.matrix.groups.values())
  }

  /**
   * Получение sends для канала
   */
  getChannelSends(channelId: string): ChannelSend[] {
    return Array.from(this.matrix.sends.values()).filter((send) => send.sourceChannelId === channelId)
  }

  /**
   * Получение назначенной шины для канала
   */
  getChannelBus(channelId: string): AudioBus | null {
    const busId = this.matrix.channelBusAssignments.get(channelId)
    return busId ? this.matrix.buses.get(busId) || null : null
  }

  /**
   * Регистрация callback на изменение роутинга
   */
  onRoutingChange(callback: () => void): string {
    const id = Math.random().toString(36)
    this.callbacks.set(id, callback)
    return id
  }

  /**
   * Удаление callback
   */
  removeRoutingCallback(id: string) {
    this.callbacks.delete(id)
  }

  /**
   * Уведомление об изменении роутинга
   */
  private notifyRoutingChange() {
    this.callbacks.forEach((callback) => callback())
  }

  /**
   * Удаление шины
   */
  deleteBus(busId: string) {
    if (busId === "master") return // нельзя удалить мастер

    const bus = this.matrix.buses.get(busId)
    if (bus) {
      // Отключаем все соединения
      bus.inputGain.disconnect()
      bus.outputGain.disconnect()

      // Переназначаем каналы на мастер
      this.matrix.channelBusAssignments.forEach((assignedBusId, channelId) => {
        if (assignedBusId === busId) {
          this.assignChannelToBus(channelId, "master")
        }
      })

      // Удаляем sends на эту шину
      this.matrix.sends.forEach((send, sendId) => {
        if (send.destinationBusId === busId) {
          this.matrix.sends.delete(sendId)
        }
      })

      this.matrix.buses.delete(busId)
      this.notifyRoutingChange()
    }
  }

  /**
   * Удаление группы
   */
  deleteGroup(groupId: string) {
    const group = this.matrix.groups.get(groupId)
    if (group) {
      // Переназначаем каналы группы на мастер
      group.channelIds.forEach((channelId) => {
        this.assignChannelToBus(channelId, "master")
      })

      // Удаляем шину группы
      this.deleteBus(group.busId)

      this.matrix.groups.delete(groupId)
      this.notifyRoutingChange()
    }
  }

  /**
   * Экспорт конфигурации роутинга
   */
  exportConfiguration() {
    return {
      buses: Array.from(this.matrix.buses.entries()).map(([id, bus]) => ({
        id,
        name: bus.name,
        type: bus.type,
        destinations: bus.destinations,
        isMuted: bus.isMuted,
        isSolo: bus.isSolo,
      })),
      groups: Array.from(this.matrix.groups.entries()).map(([id, group]) => ({
        id,
        name: group.name,
        channelIds: group.channelIds,
        busId: group.busId,
        color: group.color,
        isMuted: group.isMuted,
        isSolo: group.isSolo,
        gain: group.gain,
      })),
      sends: Array.from(this.matrix.sends.entries()).map(([id, send]) => ({
        id,
        sourceChannelId: send.sourceChannelId,
        destinationBusId: send.destinationBusId,
        level: send.level,
        isPre: send.isPre,
        isEnabled: send.isEnabled,
      })),
      assignments: Array.from(this.matrix.channelBusAssignments.entries()),
    }
  }

  /**
   * Импорт конфигурации роутинга
   */
  importConfiguration(config: any) {
    // Очищаем текущую конфигурацию (кроме мастера)
    this.matrix.buses.forEach((_bus, id) => {
      if (id !== "master") {
        this.deleteBus(id)
      }
    })
    this.matrix.groups.clear()
    this.matrix.sends.clear()
    this.matrix.channelBusAssignments.clear()

    // Восстанавливаем шины
    config.buses?.forEach((busConfig: any) => {
      if (busConfig.id !== "master") {
        const bus = this.createBus(busConfig.id, busConfig.name, busConfig.type)
        bus.destinations = busConfig.destinations
        bus.isMuted = busConfig.isMuted
        bus.isSolo = busConfig.isSolo
      }
    })

    // Восстанавливаем группы
    config.groups?.forEach((groupConfig: any) => {
      const group = this.createGroup(groupConfig.id, groupConfig.name, groupConfig.channelIds, groupConfig.color)
      group.isMuted = groupConfig.isMuted
      group.isSolo = groupConfig.isSolo
      group.gain = groupConfig.gain
    })

    // Восстанавливаем sends
    config.sends?.forEach((sendConfig: any) => {
      this.createSend(
        sendConfig.id,
        sendConfig.sourceChannelId,
        sendConfig.destinationBusId,
        sendConfig.level,
        sendConfig.isPre,
      )
    })

    // Восстанавливаем назначения
    config.assignments?.forEach(([channelId, busId]: [string, string]) => {
      this.assignChannelToBus(channelId, busId)
    })

    this.notifyRoutingChange()
  }

  /**
   * Получение полной информации о роутинге
   */
  getRoutingMatrix(): RoutingMatrix {
    return {
      buses: new Map(this.matrix.buses),
      groups: new Map(this.matrix.groups),
      sends: new Map(this.matrix.sends),
      channelBusAssignments: new Map(this.matrix.channelBusAssignments),
    }
  }
}
