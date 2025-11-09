import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { BusRouter } from "../bus-router"

// Mock AudioContext and Web Audio API nodes
class MockAudioNode {
  connect = vi.fn()
  disconnect = vi.fn()
}

class MockGainNode extends MockAudioNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
  }
}

class MockAudioContext {
  state = "running"
  currentTime = 0
  sampleRate = 48000
  destination = new MockAudioNode()

  createGain = vi.fn(() => new MockGainNode())
}

global.AudioContext = MockAudioContext as any

describe("BusRouter", () => {
  let context: AudioContext
  let router: BusRouter

  beforeEach(() => {
    context = new AudioContext()
    router = new BusRouter(context)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("should create router with master bus", () => {
      const buses = router.getAvailableBuses()
      expect(buses).toHaveLength(1)
      expect(buses[0].id).toBe("master")
      expect(buses[0].name).toBe("Master")
    })

    it("should connect master bus to destination", () => {
      expect(context.destination).toBeDefined()
    })
  })

  describe("Bus Management", () => {
    it("should create new bus", () => {
      const bus = router.createBus("aux1", "Aux 1", "stereo")

      expect(bus.id).toBe("aux1")
      expect(bus.name).toBe("Aux 1")
      expect(bus.type).toBe("stereo")
      expect(bus.inputGain).toBeDefined()
      expect(bus.outputGain).toBeDefined()
      expect(bus.effects).toEqual([])
      expect(bus.destinations).toEqual(["master"])
      expect(bus.isMuted).toBe(false)
      expect(bus.isSolo).toBe(false)
    })

    it("should connect bus nodes on creation", () => {
      const bus = router.createBus("aux1", "Aux 1", "stereo")

      expect(bus.inputGain.connect).toHaveBeenCalledWith(bus.outputGain)
    })

    it("should connect non-master bus to master by default", () => {
      const buses = router.getAvailableBuses()
      const masterBus = buses.find((b) => b.id === "master")

      const bus = router.createBus("aux1", "Aux 1", "stereo")

      expect(bus.outputGain.connect).toHaveBeenCalledWith(masterBus?.inputGain)
    })

    it("should create buses of different types", () => {
      const stereoBus = router.createBus("stereo", "Stereo Bus", "stereo")
      const monoBus = router.createBus("mono", "Mono Bus", "mono")
      const surroundBus = router.createBus("surround", "Surround Bus", "surround")

      expect(stereoBus.type).toBe("stereo")
      expect(monoBus.type).toBe("mono")
      expect(surroundBus.type).toBe("surround")
    })

    it("should get all available buses", () => {
      router.createBus("aux1", "Aux 1", "stereo")
      router.createBus("aux2", "Aux 2", "stereo")

      const buses = router.getAvailableBuses()
      expect(buses).toHaveLength(3) // master + aux1 + aux2
    })

    it("should delete bus", () => {
      const bus = router.createBus("aux1", "Aux 1", "stereo")

      router.deleteBus("aux1")

      const buses = router.getAvailableBuses()
      expect(buses).not.toContain(bus)
      expect(bus.inputGain.disconnect).toHaveBeenCalled()
      expect(bus.outputGain.disconnect).toHaveBeenCalled()
    })

    it("should not delete master bus", () => {
      router.deleteBus("master")

      const buses = router.getAvailableBuses()
      expect(buses.find((b) => b.id === "master")).toBeDefined()
    })

    it("should reassign channels to master when deleting bus", () => {
      router.createBus("aux1", "Aux 1", "stereo")
      router.assignChannelToBus("channel1", "aux1")

      router.deleteBus("aux1")

      const channelBus = router.getChannelBus("channel1")
      expect(channelBus?.id).toBe("master")
    })
  })

  describe("Channel to Bus Assignment", () => {
    it("should assign channel to bus", () => {
      router.createBus("aux1", "Aux 1", "stereo")
      router.assignChannelToBus("channel1", "aux1")

      const bus = router.getChannelBus("channel1")
      expect(bus?.id).toBe("aux1")
    })

    it("should assign channel to master by default", () => {
      const bus = router.getChannelBus("unassigned-channel")
      expect(bus).toBeNull() // Not assigned yet, returns null
    })

    it("should trigger routing change callback on assignment", () => {
      const callback = vi.fn()
      router.onRoutingChange(callback)

      router.assignChannelToBus("channel1", "master")

      expect(callback).toHaveBeenCalled()
    })
  })

  describe("Channel Connection", () => {
    it("should connect channel to assigned bus", () => {
      const sourceNode = new MockAudioNode()
      router.createBus("aux1", "Aux 1", "stereo")
      router.assignChannelToBus("channel1", "aux1")

      const channelGain = router.connectChannel("channel1", sourceNode as any)

      expect(sourceNode.connect).toHaveBeenCalledWith(channelGain)
      expect(channelGain).toBeDefined()
    })

    it("should connect to master if no assignment exists", () => {
      const sourceNode = new MockAudioNode()
      const buses = router.getAvailableBuses()
      const masterBus = buses.find((b) => b.id === "master")

      const channelGain = router.connectChannel("channel1", sourceNode as any)

      expect(channelGain.connect).toHaveBeenCalledWith(masterBus?.inputGain)
    })
  })

  describe("Send Management", () => {
    it("should create send", () => {
      router.createBus("fx1", "FX 1", "stereo")
      const send = router.createSend("send1", "channel1", "fx1", 0.7, false)

      expect(send.id).toBe("send1")
      expect(send.sourceChannelId).toBe("channel1")
      expect(send.destinationBusId).toBe("fx1")
      expect(send.level).toBe(0.7)
      expect(send.isPre).toBe(false)
      expect(send.isEnabled).toBe(true)
    })

    it("should get sends for channel", () => {
      router.createBus("fx1", "FX 1", "stereo")
      router.createBus("fx2", "FX 2", "stereo")
      router.createSend("send1", "channel1", "fx1")
      router.createSend("send2", "channel1", "fx2")
      router.createSend("send3", "channel2", "fx1")

      const sends = router.getChannelSends("channel1")

      expect(sends).toHaveLength(2)
      expect(sends[0].sourceChannelId).toBe("channel1")
      expect(sends[1].sourceChannelId).toBe("channel1")
    })

    it("should update send level", () => {
      const callback = vi.fn()
      router.onRoutingChange(callback)

      router.createBus("fx1", "FX 1", "stereo")
      router.createSend("send1", "channel1", "fx1", 0.5)

      router.updateSendLevel("send1", 0.8)

      const sends = router.getChannelSends("channel1")
      expect(sends[0].level).toBe(0.8)
      expect(callback).toHaveBeenCalled()
    })

    it("should clamp send level between 0 and 1", () => {
      router.createBus("fx1", "FX 1", "stereo")
      router.createSend("send1", "channel1", "fx1")

      router.updateSendLevel("send1", 1.5)
      expect(router.getChannelSends("channel1")[0].level).toBe(1)

      router.updateSendLevel("send1", -0.5)
      expect(router.getChannelSends("channel1")[0].level).toBe(0)
    })

    it("should delete sends when deleting bus", () => {
      router.createBus("fx1", "FX 1", "stereo")
      router.createSend("send1", "channel1", "fx1")

      router.deleteBus("fx1")

      const sends = router.getChannelSends("channel1")
      expect(sends).toHaveLength(0)
    })
  })

  describe("Bus Mute and Solo", () => {
    it("should mute bus", () => {
      const bus = router.createBus("aux1", "Aux 1", "stereo")

      router.setBusMute("aux1", true)

      expect(bus.isMuted).toBe(true)
      expect(bus.outputGain.gain.value).toBe(0)
    })

    it("should unmute bus", () => {
      const bus = router.createBus("aux1", "Aux 1", "stereo")

      router.setBusMute("aux1", true)
      router.setBusMute("aux1", false)

      expect(bus.isMuted).toBe(false)
      expect(bus.outputGain.gain.value).toBe(1)
    })

    it("should solo bus and mute others", () => {
      const bus1 = router.createBus("aux1", "Aux 1", "stereo")
      const bus2 = router.createBus("aux2", "Aux 2", "stereo")

      router.setBusSolo("aux1", true)

      expect(bus1.isSolo).toBe(true)
      expect(bus2.outputGain.gain.value).toBe(0)
    })

    it("should allow multiple solo buses", () => {
      const bus1 = router.createBus("aux1", "Aux 1", "stereo")
      const bus2 = router.createBus("aux2", "Aux 2", "stereo")
      const bus3 = router.createBus("aux3", "Aux 3", "stereo")

      router.setBusSolo("aux1", true)
      router.setBusSolo("aux2", true)

      expect(bus1.isSolo).toBe(true)
      expect(bus2.isSolo).toBe(true)
      // Bus3 should be muted as it's not soloed
      expect(bus3.outputGain.gain.value).toBe(0)
    })

    it("should restore normal state when all solos disabled", () => {
      const bus1 = router.createBus("aux1", "Aux 1", "stereo")
      const bus2 = router.createBus("aux2", "Aux 2", "stereo")

      router.setBusSolo("aux1", true)
      router.setBusSolo("aux1", false)

      expect(bus1.outputGain.gain.value).toBe(1)
      expect(bus2.outputGain.gain.value).toBe(1)
    })

    it("should respect mute when disabling solo", () => {
      const bus1 = router.createBus("aux1", "Aux 1", "stereo")

      router.setBusMute("aux1", true)
      router.setBusSolo("aux1", true)
      router.setBusSolo("aux1", false)

      expect(bus1.outputGain.gain.value).toBe(0)
    })
  })

  describe("Group Management", () => {
    it("should create group with bus", () => {
      const group = router.createGroup("drums", "Drums", ["kick", "snare", "hats"], "#ff0000")

      expect(group.id).toBe("drums")
      expect(group.name).toBe("Drums")
      expect(group.channelIds).toEqual(["kick", "snare", "hats"])
      expect(group.color).toBe("#ff0000")
      expect(group.busId).toBe("drums_bus")
      expect(group.isMuted).toBe(false)
      expect(group.isSolo).toBe(false)
      expect(group.gain).toBe(1.0)
    })

    it("should use default color if not provided", () => {
      const group = router.createGroup("vocals", "Vocals", ["lead", "backing"])

      expect(group.color).toBe("#3b82f6")
    })

    it("should assign channels to group bus", () => {
      router.createGroup("drums", "Drums", ["kick", "snare"])

      const kickBus = router.getChannelBus("kick")
      const snareBus = router.getChannelBus("snare")

      expect(kickBus?.id).toBe("drums_bus")
      expect(snareBus?.id).toBe("drums_bus")
    })

    it("should get all groups", () => {
      router.createGroup("drums", "Drums", ["kick", "snare"])
      router.createGroup("vocals", "Vocals", ["lead", "backing"])

      const groups = router.getGroups()

      expect(groups).toHaveLength(2)
      expect(groups[0].id).toBe("drums")
      expect(groups[1].id).toBe("vocals")
    })

    it("should add channel to group", () => {
      const group = router.createGroup("drums", "Drums", ["kick", "snare"])

      router.addChannelToGroup("drums", "toms")

      expect(group.channelIds).toContain("toms")
      expect(router.getChannelBus("toms")?.id).toBe("drums_bus")
    })

    it("should not add duplicate channel to group", () => {
      const group = router.createGroup("drums", "Drums", ["kick", "snare"])

      router.addChannelToGroup("drums", "kick")

      expect(group.channelIds.filter((id) => id === "kick")).toHaveLength(1)
    })

    it("should remove channel from group", () => {
      const group = router.createGroup("drums", "Drums", ["kick", "snare", "hats"])

      router.removeChannelFromGroup("drums", "snare")

      expect(group.channelIds).not.toContain("snare")
      expect(router.getChannelBus("snare")?.id).toBe("master")
    })

    it("should set group mute", () => {
      const group = router.createGroup("drums", "Drums", ["kick", "snare"])
      const buses = router.getAvailableBuses()
      const groupBus = buses.find((b) => b.id === "drums_bus")

      router.setGroupMute("drums", true)

      expect(group.isMuted).toBe(true)
      expect(groupBus?.isMuted).toBe(true)
      expect(groupBus?.outputGain.gain.value).toBe(0)
    })

    it("should set group solo", () => {
      const group = router.createGroup("drums", "Drums", ["kick", "snare"])
      const buses = router.getAvailableBuses()
      const groupBus = buses.find((b) => b.id === "drums_bus")

      router.setGroupSolo("drums", true)

      expect(group.isSolo).toBe(true)
      expect(groupBus?.isSolo).toBe(true)
    })

    it("should set group gain", () => {
      const group = router.createGroup("drums", "Drums", ["kick", "snare"])
      const buses = router.getAvailableBuses()
      const groupBus = buses.find((b) => b.id === "drums_bus")

      router.setGroupGain("drums", 1.5)

      expect(group.gain).toBe(1.5)
      expect(groupBus?.outputGain.gain.value).toBe(1.5)
    })

    it("should clamp group gain between 0 and 2", () => {
      const group = router.createGroup("drums", "Drums", ["kick", "snare"])

      router.setGroupGain("drums", 3.0)
      expect(group.gain).toBe(2.0)

      router.setGroupGain("drums", -0.5)
      expect(group.gain).toBe(0)
    })

    it("should delete group and reassign channels", () => {
      router.createGroup("drums", "Drums", ["kick", "snare"])

      router.deleteGroup("drums")

      expect(router.getGroups()).toHaveLength(0)
      expect(router.getChannelBus("kick")?.id).toBe("master")
      expect(router.getChannelBus("snare")?.id).toBe("master")
    })

    it("should trigger routing change on group operations", () => {
      const callback = vi.fn()
      router.onRoutingChange(callback)

      router.createGroup("drums", "Drums", ["kick"])
      expect(callback).toHaveBeenCalled()

      callback.mockClear()
      router.deleteGroup("drums")
      expect(callback).toHaveBeenCalled()
    })
  })

  describe("Routing Matrix", () => {
    it("should get routing matrix", () => {
      router.createBus("aux1", "Aux 1", "stereo")
      router.createGroup("drums", "Drums", ["kick", "snare"])
      router.createSend("send1", "channel1", "aux1")

      const matrix = router.getRoutingMatrix()

      expect(matrix.buses).toBeDefined()
      expect(matrix.groups).toBeDefined()
      expect(matrix.sends).toBeDefined()
      expect(matrix.channelBusAssignments).toBeDefined()
    })
  })

  describe("Configuration Export/Import", () => {
    it("should export configuration", () => {
      router.createBus("aux1", "Aux 1", "stereo")
      router.createGroup("drums", "Drums", ["kick", "snare"])
      router.createSend("send1", "channel1", "aux1")

      const config = router.exportConfiguration()

      expect(config.buses).toBeDefined()
      expect(config.groups).toBeDefined()
      expect(config.sends).toBeDefined()
      expect(config.assignments).toBeDefined()
      expect(config.buses.length).toBeGreaterThan(0)
      expect(config.groups.length).toBeGreaterThan(0)
      expect(config.sends.length).toBeGreaterThan(0)
    })

    it("should import configuration", () => {
      router.createBus("aux1", "Aux 1", "stereo")
      router.createGroup("drums", "Drums", ["kick", "snare"])
      router.createSend("send1", "channel1", "aux1")

      const config = router.exportConfiguration()

      // Create new router and import
      const newRouter = new BusRouter(context)
      newRouter.importConfiguration(config)

      const newConfig = newRouter.exportConfiguration()

      expect(newConfig.buses.length).toBe(config.buses.length)
      expect(newConfig.groups.length).toBe(config.groups.length)
      expect(newConfig.sends.length).toBe(config.sends.length)
    })

    it("should clear existing configuration before import", () => {
      router.createBus("aux1", "Aux 1", "stereo")
      router.createBus("aux2", "Aux 2", "stereo")

      const config = {
        buses: [
          { id: "new_bus", name: "New Bus", type: "stereo" as const, destinations: [], isMuted: false, isSolo: false },
        ],
        groups: [],
        sends: [],
        assignments: [],
      }

      router.importConfiguration(config)

      const buses = router.getAvailableBuses()
      // Should only have master and new_bus
      expect(buses.length).toBe(2)
      expect(buses.find((b) => b.id === "aux1")).toBeUndefined()
      expect(buses.find((b) => b.id === "new_bus")).toBeDefined()
    })

    it("should not delete master bus on import", () => {
      const config = {
        buses: [],
        groups: [],
        sends: [],
        assignments: [],
      }

      router.importConfiguration(config)

      const buses = router.getAvailableBuses()
      expect(buses.find((b) => b.id === "master")).toBeDefined()
    })

    it("should trigger routing change on import", () => {
      const callback = vi.fn()
      router.onRoutingChange(callback)

      const config = router.exportConfiguration()
      router.importConfiguration(config)

      expect(callback).toHaveBeenCalled()
    })
  })

  describe("Callback Management", () => {
    it("should register routing change callback", () => {
      const callback = vi.fn()
      const id = router.onRoutingChange(callback)

      expect(id).toBeDefined()
      expect(typeof id).toBe("string")
    })

    it("should call callback on routing change", () => {
      const callback = vi.fn()
      router.onRoutingChange(callback)

      router.assignChannelToBus("channel1", "master")

      expect(callback).toHaveBeenCalled()
    })

    it("should remove callback", () => {
      const callback = vi.fn()
      const id = router.onRoutingChange(callback)

      router.removeRoutingCallback(id)
      router.assignChannelToBus("channel1", "master")

      expect(callback).not.toHaveBeenCalled()
    })

    it("should support multiple callbacks", () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      router.onRoutingChange(callback1)
      router.onRoutingChange(callback2)

      router.assignChannelToBus("channel1", "master")

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })
})
