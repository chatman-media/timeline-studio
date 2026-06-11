export interface TimelineStateAccess {
  getCurrentProject: () => unknown
  createProject: (project: any) => Promise<void>
  updateProject: (updates: any) => Promise<void>
  createSection: (section: any) => Promise<any>
  createTrack: (track: any) => Promise<any>
  addClip: (clip: any) => Promise<any>
  getProjectStats: () => {
    totalDuration: number
    totalClips: number
    totalTracks: number
    totalSections: number
  }
  sendTimelineCommand: (command: string, params?: any) => Promise<void>
}

let timelineStateAccess: TimelineStateAccess | null = null

export function setTimelineStateAccess(access: TimelineStateAccess | null): void {
  timelineStateAccess = access
}

export function getTimelineStateAccess(): TimelineStateAccess | null {
  return timelineStateAccess
}

export function hasTimelineStateAccess(): boolean {
  return timelineStateAccess !== null
}

export function requireTimelineStateAccess(): TimelineStateAccess {
  if (!timelineStateAccess) {
    throw new Error("Timeline state access не настроен")
  }
  return timelineStateAccess
}
