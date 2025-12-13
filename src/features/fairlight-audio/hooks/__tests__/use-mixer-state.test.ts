/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it } from "vitest"
import type { AudioChannel } from "../../types"
import { useMixerState } from "../use-mixer-state"

describe("useMixerState", () => {
  let result: ReturnType<typeof renderHook<ReturnType<typeof useMixerState>, void>>

  beforeEach(() => {
    result = renderHook(() => useMixerState())
  })

  describe("initial state", () => {
    it("returns initial mixer state with 3 channels", () => {
      expect(result.result.current.channels).toHaveLength(3)
      expect(result.result.current.channels[0].id).toBe("ch1")
      expect(result.result.current.channels[1].id).toBe("ch2")
      expect(result.result.current.channels[2].id).toBe("ch3")
    })

    it("has correct initial master settings", () => {
      const { master } = result.result.current
      expect(master.volume).toBe(85)
      expect(master.muted).toBe(false)
      expect(master.limiterEnabled).toBe(true)
      expect(master.limiterThreshold).toBe(-3)
    })

    it("has correct initial channel properties", () => {
      const { channels } = result.result.current

      // Channel 1 (ch1)
      expect(channels[0]).toMatchObject({
        id: "ch1",
        name: "Track 1",
        type: "stereo",
        volume: 75,
        pan: 0,
        muted: false,
        solo: false,
        armed: false,
      })

      // Channel 2 (ch2)
      expect(channels[1]).toMatchObject({
        id: "ch2",
        name: "Track 2",
        type: "mono",
        volume: 60,
        pan: -20,
        muted: false,
        solo: false,
        armed: true,
      })

      // Channel 3 (ch3)
      expect(channels[2]).toMatchObject({
        id: "ch3",
        name: "Track 3",
        type: "stereo",
        volume: 80,
        pan: 20,
        muted: true,
        solo: false,
        armed: false,
      })
    })

    it("has empty buses array", () => {
      expect(result.result.current.buses).toEqual([])
    })

    it("has correct solo mode", () => {
      expect(result.result.current.soloMode).toBe("AFL")
    })
  })

  describe("updateChannel", () => {
    it("updates specific channel properties", () => {
      act(() => {
        result.result.current.updateChannel("ch1", { volume: 90, name: "Updated Track" })
      })

      const channel = result.result.current.channels.find((ch) => ch.id === "ch1")
      expect(channel?.volume).toBe(90)
      expect(channel?.name).toBe("Updated Track")
      // Other properties should remain unchanged
      expect(channel?.pan).toBe(0)
      expect(channel?.muted).toBe(false)
    })

    it("only updates the target channel", () => {
      act(() => {
        result.result.current.updateChannel("ch2", { volume: 95 })
      })

      // ch1 and ch3 should remain unchanged
      expect(result.result.current.channels[0].volume).toBe(75)
      expect(result.result.current.channels[2].volume).toBe(80)
      // ch2 should be updated
      expect(result.result.current.channels[1].volume).toBe(95)
    })

    it("handles non-existent channel gracefully", () => {
      const originalChannels = result.result.current.channels

      act(() => {
        result.result.current.updateChannel("non-existent", { volume: 100 })
      })

      // Channels should remain unchanged
      expect(result.result.current.channels).toEqual(originalChannels)
    })
  })

  describe("toggleMute", () => {
    it("toggles mute state for specific channel", () => {
      // ch1 starts unmuted
      expect(result.result.current.channels[0].muted).toBe(false)

      act(() => {
        result.result.current.toggleMute("ch1")
      })

      expect(result.result.current.channels[0].muted).toBe(true)

      act(() => {
        result.result.current.toggleMute("ch1")
      })

      expect(result.result.current.channels[0].muted).toBe(false)
    })

    it("only affects the target channel", () => {
      act(() => {
        result.result.current.toggleMute("ch1")
      })

      expect(result.result.current.channels[0].muted).toBe(true)
      expect(result.result.current.channels[1].muted).toBe(false)
      expect(result.result.current.channels[2].muted).toBe(true) // ch3 starts muted
    })
  })

  describe("toggleSolo", () => {
    it("toggles solo state for specific channel", () => {
      // All channels start with solo: false
      expect(result.result.current.channels[0].solo).toBe(false)

      act(() => {
        result.result.current.toggleSolo("ch1")
      })

      expect(result.result.current.channels[0].solo).toBe(true)

      act(() => {
        result.result.current.toggleSolo("ch1")
      })

      expect(result.result.current.channels[0].solo).toBe(false)
    })

    it("can have multiple channels soloed", () => {
      act(() => {
        result.result.current.toggleSolo("ch1")
        result.result.current.toggleSolo("ch2")
      })

      expect(result.result.current.channels[0].solo).toBe(true)
      expect(result.result.current.channels[1].solo).toBe(true)
      expect(result.result.current.channels[2].solo).toBe(false)
    })
  })

  describe("toggleArm", () => {
    it("toggles arm state for specific channel", () => {
      // ch2 starts armed
      expect(result.result.current.channels[1].armed).toBe(true)

      act(() => {
        result.result.current.toggleArm("ch2")
      })

      expect(result.result.current.channels[1].armed).toBe(false)

      act(() => {
        result.result.current.toggleArm("ch2")
      })

      expect(result.result.current.channels[1].armed).toBe(true)
    })

    it("can arm multiple channels", () => {
      act(() => {
        result.result.current.toggleArm("ch1") // ch1 starts unarmed
        result.result.current.toggleArm("ch3") // ch3 starts unarmed
      })

      expect(result.result.current.channels[0].armed).toBe(true)
      expect(result.result.current.channels[1].armed).toBe(true) // ch2 starts armed
      expect(result.result.current.channels[2].armed).toBe(true)
    })
  })

  describe("updateMaster", () => {
    it("updates master properties", () => {
      act(() => {
        result.result.current.updateMaster({
          volume: 90,
          muted: true,
          limiterThreshold: -6,
        })
      })

      const { master } = result.result.current
      expect(master.volume).toBe(90)
      expect(master.muted).toBe(true)
      expect(master.limiterThreshold).toBe(-6)
      expect(master.limiterEnabled).toBe(true) // Should remain unchanged
    })

    it("partially updates master properties", () => {
      act(() => {
        result.result.current.updateMaster({ volume: 95 })
      })

      const { master } = result.result.current
      expect(master.volume).toBe(95)
      expect(master.muted).toBe(false) // Should remain unchanged
      expect(master.limiterEnabled).toBe(true) // Should remain unchanged
      expect(master.limiterThreshold).toBe(-3) // Should remain unchanged
    })
  })

  describe("addChannel", () => {
    it("adds new channel to the end of channels array", () => {
      const newChannel: AudioChannel = {
        id: "ch4",
        name: "New Track",
        type: "mono",
        volume: 50,
        pan: 10,
        muted: false,
        solo: false,
        armed: false,
        effects: [],
        sends: [],
        eq: { enabled: false, bands: [] },
      }

      act(() => {
        result.result.current.addChannel(newChannel)
      })

      expect(result.result.current.channels).toHaveLength(4)
      expect(result.result.current.channels[3]).toEqual(newChannel)
    })
  })

  describe("removeChannel", () => {
    it("removes channel by id", () => {
      act(() => {
        result.result.current.removeChannel("ch2")
      })

      expect(result.result.current.channels).toHaveLength(2)
      expect(result.result.current.channels.find((ch) => ch.id === "ch2")).toBeUndefined()
      expect(result.result.current.channels[0].id).toBe("ch1")
      expect(result.result.current.channels[1].id).toBe("ch3")
    })

    it("handles non-existent channel gracefully", () => {
      const originalLength = result.result.current.channels.length

      act(() => {
        result.result.current.removeChannel("non-existent")
      })

      expect(result.result.current.channels).toHaveLength(originalLength)
    })
  })

  describe("setChannels", () => {
    it("replaces all channels with new array", () => {
      const newChannels: AudioChannel[] = [
        {
          id: "new1",
          name: "New Channel 1",
          type: "stereo",
          volume: 100,
          pan: 0,
          muted: false,
          solo: false,
          armed: false,
          effects: [],
          sends: [],
          eq: { enabled: false, bands: [] },
        },
        {
          id: "new2",
          name: "New Channel 2",
          type: "mono",
          volume: 80,
          pan: -10,
          muted: true,
          solo: false,
          armed: true,
          effects: [],
          sends: [],
          eq: { enabled: false, bands: [] },
        },
      ]

      act(() => {
        result.result.current.setChannels(newChannels)
      })

      expect(result.result.current.channels).toHaveLength(2)
      expect(result.result.current.channels).toEqual(newChannels)
    })
  })

  describe("MIDI integration methods", () => {
    describe("setChannelVolume", () => {
      it("sets volume by channel index (0-based)", () => {
        act(() => {
          result.result.current.setChannelVolume(0, 0.9) // 90%
        })

        expect(result.result.current.channels[0].volume).toBe(90)
      })

      it("converts normalized value to percentage", () => {
        act(() => {
          result.result.current.setChannelVolume(1, 0.5) // 50%
        })

        expect(result.result.current.channels[1].volume).toBe(50)
      })

      it("handles out of bounds index gracefully", () => {
        const originalChannels = result.result.current.channels

        act(() => {
          result.result.current.setChannelVolume(10, 0.8)
        })

        expect(result.result.current.channels).toEqual(originalChannels)
      })
    })

    describe("setChannelPan", () => {
      it("sets pan by channel index", () => {
        act(() => {
          result.result.current.setChannelPan(0, 0.75) // 75%
        })

        expect(result.result.current.channels[0].pan).toBe(75)
      })

      it("converts normalized value to percentage", () => {
        act(() => {
          result.result.current.setChannelPan(2, -0.5) // -50%
        })

        expect(result.result.current.channels[2].pan).toBe(-50)
      })
    })

    describe("setMasterVolume", () => {
      it("sets master volume from normalized value", () => {
        act(() => {
          result.result.current.setMasterVolume(0.7) // 70%
        })

        expect(result.result.current.master.volume).toBe(70)
      })
    })

    describe("setMasterLimiterThreshold", () => {
      it("sets master limiter threshold", () => {
        act(() => {
          result.result.current.setMasterLimiterThreshold(-6)
        })

        expect(result.result.current.master.limiterThreshold).toBe(-6)
      })
    })
  })

  describe("function stability", () => {
    it("returns stable function references", () => {
      const firstRender = result.result.current

      result.rerender()

      const secondRender = result.result.current

      // Functions should be the same reference (stable)
      expect(secondRender.updateChannel).toBe(firstRender.updateChannel)
      expect(secondRender.toggleMute).toBe(firstRender.toggleMute)
      expect(secondRender.toggleSolo).toBe(firstRender.toggleSolo)
      expect(secondRender.toggleArm).toBe(firstRender.toggleArm)
      expect(secondRender.updateMaster).toBe(firstRender.updateMaster)
      expect(secondRender.addChannel).toBe(firstRender.addChannel)
      expect(secondRender.removeChannel).toBe(firstRender.removeChannel)
      expect(secondRender.setChannels).toBe(firstRender.setChannels)
    })
  })
})
