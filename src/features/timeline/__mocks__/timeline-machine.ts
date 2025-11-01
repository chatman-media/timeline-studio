/**
 * Mock Timeline State Machine
 */

import { assign, createMachine } from "xstate"

import { createTimelineProject } from "../types"

const mockProject = createTimelineProject("Test Project", {})

export const timelineMachine = createMachine({
  id: "timeline-mock",
  initial: "ready",
  states: {
    ready: {},
  },
  context: {
    project: mockProject,
    uiState: {
      currentTime: 0,
      playheadPosition: 0,
      timeScale: 100,
      scrollPosition: { x: 0, y: 0 },
      selectedClipIds: [],
      selectedTrackIds: [],
      selectedSectionIds: [],
      editMode: "select" as const,
      snapMode: "grid" as const,
      visibleTrackTypes: ["video", "audio", "music", "title", "subtitle", "voiceover", "sfx", "ambient"],
      collapsedSectionIds: [],
      clipboard: { clips: [], tracks: [] },
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,
    },
    isPlaying: false,
    isRecording: false,
    currentTime: 0,
    speedRampingConfigs: {},
    draggedClip: null,
    draggedTrack: null,
    error: null,
    lastAction: null,
  },
  on: {
    // Mock event handlers
    CREATE_PROJECT: {
      actions: assign({
        project: ({ event }) => createTimelineProject(event.name, event.settings),
        lastAction: () => "CREATE_PROJECT" as any,
      }),
    },
    LOAD_PROJECT: {
      actions: assign({
        project: ({ event }) => event.project,
        lastAction: () => "LOAD_PROJECT" as any,
      }),
    },
    ADD_MARKER: {
      actions: assign({
        lastAction: () => "ADD_MARKER" as any,
      }),
    },
    SHOW_MODAL: {
      actions: assign({
        lastAction: () => "SHOW_MODAL" as any,
      }),
    },
    // Speed Ramping events
    ENABLE_SPEED_RAMPING: {
      actions: assign({
        speedRampingConfigs: ({ context, event }) => ({
          ...context.speedRampingConfigs,
          [event.clipId]: {
            enabled: true,
            keyframes: [],
            maintainPitch: true,
          },
        }),
      }),
    },
    DISABLE_SPEED_RAMPING: {
      actions: assign({
        speedRampingConfigs: ({ context, event }) => ({
          ...context.speedRampingConfigs,
          [event.clipId]: {
            ...(context.speedRampingConfigs as any)[event.clipId],
            enabled: false,
          },
        }),
      }),
    },
    SET_SPEED_RAMPING_CONFIG: {
      actions: assign({
        speedRampingConfigs: ({ context, event }) => ({
          ...context.speedRampingConfigs,
          [event.clipId]: event.config,
        }),
      }),
    },
    ADD_SPEED_KEYFRAME: {
      actions: assign({
        speedRampingConfigs: ({ context, event }) => {
          const config = (context.speedRampingConfigs as any)[event.clipId] || {
            enabled: true,
            keyframes: [],
            maintainPitch: true,
          }
          const keyframe = {
            time: event.time,
            value: event.value,
            interpolation: event.interpolation || "linear",
          }
          return {
            ...context.speedRampingConfigs,
            [event.clipId]: {
              ...config,
              keyframes: [...config.keyframes, keyframe],
            },
          }
        },
      }),
    },
    UPDATE_SPEED_KEYFRAME: {
      actions: assign({
        speedRampingConfigs: ({ context, event }) => {
          const config = (context.speedRampingConfigs as any)[event.clipId]
          if (!config) return context.speedRampingConfigs

          return {
            ...context.speedRampingConfigs,
            [event.clipId]: {
              ...config,
              keyframes: config.keyframes.map((kf: any, index: number) => {
                // Support both keyframeId and keyframeIndex
                if (event.keyframeId && kf.id === event.keyframeId) {
                  return { ...kf, ...event.updates }
                }
                if (event.keyframeIndex !== undefined && index === event.keyframeIndex) {
                  return { ...kf, ...event.updates }
                }
                return kf
              }),
            },
          }
        },
      }),
    },
    REMOVE_SPEED_KEYFRAME: {
      actions: assign({
        speedRampingConfigs: ({ context, event }) => {
          const config = (context.speedRampingConfigs as any)[event.clipId]
          if (!config) return context.speedRampingConfigs

          return {
            ...context.speedRampingConfigs,
            [event.clipId]: {
              ...config,
              keyframes: config.keyframes.filter((kf: any, index: number) => {
                // Support both keyframeId and keyframeIndex
                if (event.keyframeId) {
                  return kf.id !== event.keyframeId
                }
                if (event.keyframeIndex !== undefined) {
                  return index !== event.keyframeIndex
                }
                return true
              }),
            },
          }
        },
      }),
    },
    // Add other events as needed for tests
  },
})
