import { useTranslation } from "react-i18next"
import { useMixerState } from "../../hooks/use-mixer-state"
import { Fader } from "./fader"

export function MasterSection() {
  const { t } = useTranslation()
  const { master, updateMaster } = useMixerState()

  return (
    <div className="h-full flex flex-col p-4" data-oid="kq1pi83">
      <h3 className="text-sm font-medium text-zinc-300 mb-4" data-oid="hn1e9k7">
        {t("timeline.audioMixer.master")}
      </h3>

      {/* Bus section (placeholder for now) */}
      <div className="flex-1 space-y-2 mb-4" data-oid="wzc7n-6">
        <div className="p-3 bg-zinc-800 rounded" data-oid="094n8_v">
          <div className="text-xs text-zinc-500 mb-1" data-oid="yok5egf">
            {t("fairlightAudio.mixer.masterSection.bus1")}
          </div>
          <div className="h-2 bg-zinc-700 rounded" data-oid="-60gkyp" />
        </div>
        <div className="p-3 bg-zinc-800 rounded" data-oid="srpf8:v">
          <div className="text-xs text-zinc-500 mb-1" data-oid="erh4uwl">
            {t("fairlightAudio.mixer.masterSection.bus2")}
          </div>
          <div className="h-2 bg-zinc-700 rounded" data-oid="uuge9ej" />
        </div>
      </div>

      {/* Master controls */}
      <div className="border-t border-zinc-800 pt-4" data-oid="n6sihp.">
        {/* Limiter */}
        <div className="mb-4" data-oid="ge6kc.j">
          <label className="flex items-center gap-2 text-xs text-zinc-400" data-oid="r7uqilt">
            <input
              type="checkbox"
              checked={master.limiterEnabled}
              onChange={(e) => updateMaster({ limiterEnabled: e.target.checked })}
              className="rounded border-zinc-600"
              data-oid="eg7crta"
            />

            <span data-oid="3-y6u7s">{t("fairlightAudio.mixer.masterSection.limiter")}</span>
          </label>
          {master.limiterEnabled && (
            <div className="mt-2" data-oid="6l-6m5d">
              <div className="text-[10px] text-zinc-500 mb-1" data-oid="i98ud_8">
                {t("fairlightAudio.mixer.masterSection.threshold")} {master.limiterThreshold} dB
              </div>
              <input
                type="range"
                min="-20"
                max="0"
                value={master.limiterThreshold}
                onChange={(e) => updateMaster({ limiterThreshold: Number(e.target.value) })}
                className="w-full h-1"
                data-oid="w.x1.:u"
              />
            </div>
          )}
        </div>

        {/* Master fader */}
        <div className="flex justify-center" data-oid="tcaelxf">
          <Fader
            value={master.volume}
            onChange={(value) => updateMaster({ volume: value })}
            muted={master.muted}
            onMute={() => updateMaster({ muted: !master.muted })}
            label={t("fairlightAudio.mixer.masterSection.master")}
            className="scale-110"
            data-oid="bqb2snl"
          />
        </div>
      </div>
    </div>
  )
}
