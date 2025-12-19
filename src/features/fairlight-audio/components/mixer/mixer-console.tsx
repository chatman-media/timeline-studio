import { useCallback, useEffect } from "react"

import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { useAudioEngine } from "../../hooks/use-audio-engine"
import { useMidiIntegration } from "../../hooks/use-midi-integration"
import { useMixerState } from "../../hooks/use-mixer-state"
import { useTimelineMixerSync } from "../../services/timeline-sync-service"
import { MidiIndicator } from "../midi/midi-indicator"
import { ChannelWithAudio } from "./channel-with-audio"
import { MasterSection } from "./master-section"

interface MixerConsoleProps {
  className?: string
}

export function MixerConsole({ className }: MixerConsoleProps) {
  const { t } = useTranslation()
  const { channels, updateChannel, toggleMute, toggleSolo, toggleArm, setChannels } = useMixerState()

  // Enable MIDI integration
  useMidiIntegration()

  const {
    engine,
    isInitialized,
    updateChannelVolume: engineUpdateVolume,
    updateChannelPan: engineUpdatePan,
    muteChannel: engineMuteChannel,
    soloChannel: engineSoloChannel,
    createChannel,
    getChannelAnalyser,
  } = useAudioEngine()

  // Sync with timeline
  const handleChannelsUpdate = useCallback(
    (newChannels: typeof channels) => {
      setChannels(newChannels)
    },
    [setChannels],
  )

  const { updateTrackFromMixer } = useTimelineMixerSync(handleChannelsUpdate)

  // Create audio channels when mixer channels change
  useEffect(() => {
    if (!isInitialized) return

    channels.forEach((channel) => {
      createChannel(channel.id)
      engineUpdateVolume(channel.id, channel.volume)
      engineUpdatePan(channel.id, channel.pan)
      engineMuteChannel(channel.id, channel.muted)
      engineSoloChannel(channel.id, channel.solo)
    })
  }, [
    channels,
    isInitialized,
    createChannel,
    engineUpdateVolume,
    engineUpdatePan,
    engineMuteChannel,
    engineSoloChannel,
  ])

  const handleVolumeChange = (channelId: string, volume: number) => {
    updateChannel(channelId, { volume })
    updateTrackFromMixer(channelId, { volume })
    engineUpdateVolume(channelId, volume)
  }

  const handlePanChange = (channelId: string, pan: number) => {
    updateChannel(channelId, { pan })
    updateTrackFromMixer(channelId, { pan })
    engineUpdatePan(channelId, pan)
  }

  const handleMute = (channelId: string) => {
    toggleMute(channelId)
    const channel = channels.find((ch) => ch.id === channelId)
    if (channel) {
      updateTrackFromMixer(channelId, { muted: !channel.muted })
      engineMuteChannel(channelId, !channel.muted)
    }
  }

  const handleSolo = (channelId: string) => {
    toggleSolo(channelId)
    const channel = channels.find((ch) => ch.id === channelId)
    if (channel) {
      updateTrackFromMixer(channelId, { solo: !channel.solo })
      engineSoloChannel(channelId, !channel.solo)
    }
  }

  return (
    <div className={cn("flex h-full bg-zinc-950", className)} data-oid="xi32t-s">
      {/* Left section - Input channels */}
      <div className="flex-1 flex overflow-x-auto" data-oid="ohvp1ss">
        <div className="flex gap-1 p-4" data-oid="ps9zi_x">
          {channels.length === 0 ? (
            <div className="flex items-center justify-center w-full text-zinc-500" data-oid="98rmhn5">
              <div className="text-center" data-oid="lhz2gqd">
                <p className="text-lg mb-2" data-oid="bk5m4y.">
                  {t("timeline.audioMixer.noTracks")}
                </p>
                <p className="text-sm" data-oid="-l_er_q">
                  {t("timeline.audioMixer.addTracksHint")}
                </p>
              </div>
            </div>
          ) : (
            channels.map((channel) => (
              <ChannelWithAudio
                key={channel.id}
                channelId={channel.id}
                trackId={channel.trackId}
                name={channel.name}
                type={channel.type}
                volume={channel.volume}
                pan={channel.pan}
                muted={channel.muted}
                solo={channel.solo}
                armed={channel.armed}
                onVolumeChange={(value) => handleVolumeChange(channel.id, value)}
                onPanChange={(value) => handlePanChange(channel.id, value)}
                onMute={() => handleMute(channel.id)}
                onSolo={() => handleSolo(channel.id)}
                onArm={() => toggleArm(channel.id)}
                audioContext={engine?.audioContext}
                analyser={getChannelAnalyser(channel.id) || undefined}
                data-oid="z5d.7np"
              />
            ))
          )}
        </div>
      </div>

      {/* Right section - Buses and Master */}
      <div className="w-64 border-l border-zinc-800 bg-zinc-900" data-oid="z7epep2">
        <div className="p-2 border-b border-zinc-800 flex justify-end" data-oid="ddt2_h3">
          <MidiIndicator data-oid="g60xzdu" />
        </div>
        <MasterSection data-oid="jebliqw" />
      </div>
    </div>
  )
}
