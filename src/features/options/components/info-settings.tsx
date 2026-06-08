import { ChevronDown, FileText, Info, Monitor, Music, Settings, Video } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import type { MediaFile } from "@/core/types"
import { useTimeline } from "@/features/timeline"

interface InfoSettingsState {
  mediaInfo: boolean
  projectInfo: boolean
  technicalInfo: boolean
  advanced: boolean
}

interface InfoSettingsProps {
  selectedMediaFile?: MediaFile | null
}

export function InfoSettings({ selectedMediaFile }: InfoSettingsProps) {
  const { t } = useTranslation()

  // Безопасно получаем timeline data
  let project: any = null
  let selectedClips: any[] = []
  try {
    const timeline = useTimeline()
    project = timeline.project
    // Используем правильное имя свойства selectedClipIds
    const selectedClipIds = timeline.selectedClipIds || []
    // Получаем клипы по их ID
    selectedClips = selectedClipIds
      .map((clipId: string) => timeline.clips?.find((clip: any) => clip.id === clipId))
      .filter(Boolean)
  } catch {
    // TimelineProvider не доступен (например, в тестах)
    project = null
    selectedClips = []
  }

  // Получаем первый выбранный клип для отображения информации
  const currentClip = selectedClips?.[0] || null

  // Состояние открытых секций
  const [openSections, setOpenSections] = useState<InfoSettingsState>({
    mediaInfo: true, // Первая секция открыта по умолчанию
    projectInfo: false,
    technicalInfo: false,
    advanced: false,
  })

  const toggleSection = (section: keyof InfoSettingsState) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  // Определяем медиафайл для отображения
  const displayMediaFile = selectedMediaFile || currentClip?.mediaFile || null

  // Извлекаем расширение файла из имени
  const getFileExtension = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase()
    return extension ? extension : "unknown"
  }

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`
  }

  const formatDuration = (seconds: number): string => {
    if (!seconds) return "00:00"
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getMediaTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "video":
        return <Video className="h-4 w-4 text-blue-400" data-oid="_c16uhn" />
      case "audio":
      case "music":
        return <Music className="h-4 w-4 text-green-400" data-oid="1-8am_u" />
      default:
        return <FileText className="h-4 w-4 text-gray-400" data-oid="vz-1809" />
    }
  }

  return (
    <div className="flex flex-col h-full" data-testid="info-settings" data-oid="on8pisy">
      {/* Основной контент с прокруткой */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-muted scrollbar-thumb-muted-foreground/50 hover:scrollbar-thumb-muted-foreground"
        data-oid="khe:gas"
      >
        <div className="p-4 space-y-4" data-oid="3bd5dax">
          {/* Информация о медиафайле */}
          <Collapsible open={openSections.mediaInfo} onOpenChange={() => toggleSection("mediaInfo")} data-oid="dgi:3go">
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="8e5sw7p"
            >
              <div className="flex items-center gap-2" data-oid="vd_qbqb">
                <div className="w-2 h-2 rounded-full bg-blue-400" data-oid=".hjm13k" />
                <FileText className="h-4 w-4 text-blue-400" data-oid="9xydend" />
                <h3 className="font-medium text-foreground" data-oid="84fkzdg">
                  {t("options.info.mediaInfo", "Media Information")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.mediaInfo ? "rotate-180" : ""}`}
                data-oid="tvgkl14"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="_sa7zu3">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="4:k_5vx">
                {displayMediaFile ? (
                  <div className="space-y-3" data-oid="0hhdycu">
                    {/* Имя файла */}
                    <div className="flex items-center justify-between" data-oid="wjg4d1m">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="0i73_.v">
                        {t("options.info.fileName", "File Name")}
                      </Label>
                      <div className="flex items-center gap-2" data-oid="fygt-bt">
                        {getMediaTypeIcon(displayMediaFile.type)}
                        <span className="text-sm text-foreground" data-oid="4:zx7jd">
                          {displayMediaFile.name}
                        </span>
                      </div>
                    </div>

                    {/* Путь к файлу */}
                    <div className="flex items-center justify-between" data-oid="0ibatdy">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="pu3g9op">
                        {t("options.info.filePath", "File Path")}
                      </Label>
                      <span
                        className="text-sm text-muted-foreground truncate max-w-64"
                        title={displayMediaFile.path}
                        data-oid="f_oy4f5"
                      >
                        {displayMediaFile.path}
                      </span>
                    </div>

                    {/* Размер файла */}
                    <div className="flex items-center justify-between" data-oid="e-71nsh">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="62u4vdl">
                        {t("options.info.fileSize", "File Size")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="4arfbto">
                        {formatFileSize(displayMediaFile.size || 0)}
                      </span>
                    </div>

                    {/* Длительность */}
                    <div className="flex items-center justify-between" data-oid="plmnfib">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="ix794:j">
                        {t("options.info.duration", "Duration")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="mjo44vq">
                        {formatDuration(displayMediaFile.duration || 0)}
                      </span>
                    </div>

                    {/* Тип файла */}
                    <div className="flex items-center justify-between" data-oid="368_0k:">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="idhfi3-">
                        {t("options.info.fileType", "File Type")}
                      </Label>
                      <span className="text-sm text-foreground uppercase" data-oid="xc3016b">
                        {getFileExtension(displayMediaFile.name)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground/70 py-8" data-oid="bh3un0y">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" data-oid="m08mw81" />
                    <div className="text-sm" data-oid="x91mk3r">
                      {t("options.info.noMediaSelected", "No media file selected")}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-1" data-oid="nif5h4i">
                      {t("options.info.selectMediaHint", "Select a media file or clip to view information")}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Информация о проекте */}
          <Collapsible
            open={openSections.projectInfo}
            onOpenChange={() => toggleSection("projectInfo")}
            data-oid="af-fukk"
          >
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="0wc_5l7"
            >
              <div className="flex items-center gap-2" data-oid="yls3bfd">
                <div className="w-2 h-2 rounded-full bg-green-400" data-oid="r_gjq:-" />
                <Monitor className="h-4 w-4 text-green-400" data-oid="d_om3cq" />
                <h3 className="font-medium text-foreground" data-oid="54gue1_">
                  {t("options.info.projectInfo", "Project Information")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.projectInfo ? "rotate-180" : ""}`}
                data-oid="n0413mb"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="k-4bua5">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="6_pel:q">
                {project ? (
                  <div className="space-y-3" data-oid="s70v-74">
                    {/* Название проекта */}
                    <div className="flex items-center justify-between" data-oid="s5sd96m">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="_iul4j.">
                        {t("options.info.projectName", "Project Name")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="oszk:v:">
                        {project.name || "Untitled Project"}
                      </span>
                    </div>

                    {/* Разрешение */}
                    <div className="flex items-center justify-between" data-oid="5h8zko2">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="ijm0sl_">
                        {t("options.info.resolution", "Resolution")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="cs4.379">
                        {project.settings?.resolution?.width || 1920} × {project.settings?.resolution?.height || 1080}
                      </span>
                    </div>

                    {/* Частота кадров */}
                    <div className="flex items-center justify-between" data-oid="xvzvmm5">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="jmujog6">
                        {t("options.info.frameRate", "Frame Rate")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="yk0qwl:">
                        {project.fps || 30} fps
                      </span>
                    </div>

                    {/* Длительность проекта */}
                    <div className="flex items-center justify-between" data-oid="jh8d1oq">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="u-mqdsq">
                        {t("options.info.projectDuration", "Project Duration")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="dbh7pw0">
                        {formatDuration(project.duration || 0)}
                      </span>
                    </div>

                    {/* Количество секций */}
                    <div className="flex items-center justify-between" data-oid="80r0usv">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="uq05b7m">
                        {t("options.info.sections", "Sections")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="qge1dsm">
                        {project.sections?.length || 0}
                      </span>
                    </div>

                    {/* Количество треков */}
                    <div className="flex items-center justify-between" data-oid=":1e45hj">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="08m-1j3">
                        {t("options.info.tracks", "Tracks")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="v17akc0">
                        {(project.globalTracks?.length || 0) +
                          (project.sections?.reduce(
                            (sum: number, section: any) => sum + (section.tracks?.length || 0),
                            0,
                          ) || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground/70 py-8" data-oid="8u-wk3s">
                    <Monitor className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" data-oid="s4t1eaf" />
                    <div className="text-sm" data-oid="75wwt3f">
                      {t("options.info.noProject", "No project loaded")}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Техническая информация */}
          <Collapsible
            open={openSections.technicalInfo}
            onOpenChange={() => toggleSection("technicalInfo")}
            data-oid="_wzk88."
          >
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="f1_dgqh"
            >
              <div className="flex items-center gap-2" data-oid="2v.6hji">
                <div className="w-2 h-2 rounded-full bg-yellow-400" data-oid="pc305.o" />
                <Info className="h-4 w-4 text-yellow-400" data-oid="kmayr35" />
                <h3 className="font-medium text-foreground" data-oid="ndxl5tr">
                  {t("options.info.technicalInfo", "Technical Information")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.technicalInfo ? "rotate-180" : ""}`}
                data-oid="srhetdd"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="40hbh:g">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="55-r6b0">
                {displayMediaFile ? (
                  <div className="space-y-3" data-oid="o2tq_8h">
                    {/* Видео кодек */}
                    {displayMediaFile.type === "video" && (
                      <>
                        <div className="flex items-center justify-between" data-oid="44gb.t9">
                          <Label className="text-sm font-medium text-foreground/90" data-oid="mlw4z:q">
                            {t("options.info.videoCodec", "Video Codec")}
                          </Label>
                          <span className="text-sm text-foreground" data-oid="__yxw.f">
                            {displayMediaFile.videoCodec || "Unknown"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between" data-oid="v-2gotk">
                          <Label className="text-sm font-medium text-foreground/90" data-oid="mz516nd">
                            {t("options.info.videoBitrate", "Video Bitrate")}
                          </Label>
                          <span className="text-sm text-foreground" data-oid="ncciz2v">
                            {displayMediaFile.bitrate ? `${displayMediaFile.bitrate} kbps` : "Unknown"}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Аудио кодек */}
                    {(displayMediaFile.type === "audio" || displayMediaFile.type === "video") && (
                      <>
                        <div className="flex items-center justify-between" data-oid="n4h_g-.">
                          <Label className="text-sm font-medium text-foreground/90" data-oid=".z98u:0">
                            {t("options.info.audioCodec", "Audio Codec")}
                          </Label>
                          <span className="text-sm text-foreground" data-oid="tbs.2g5">
                            {displayMediaFile.audioCodec || "Unknown"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between" data-oid="v.7a3o1">
                          <Label className="text-sm font-medium text-foreground/90" data-oid="_cw1n-5">
                            {t("options.info.sampleRate", "Sample Rate")}
                          </Label>
                          <span className="text-sm text-foreground" data-oid="h4r5of6">
                            {displayMediaFile.sampleRate ? `${displayMediaFile.sampleRate} Hz` : "Unknown"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between" data-oid="y40:5rs">
                          <Label className="text-sm font-medium text-foreground/90" data-oid="cktdkgx">
                            {t("options.info.channels", "Audio Channels")}
                          </Label>
                          <span className="text-sm text-foreground" data-oid="atyo5:1">
                            {displayMediaFile.channels || "Unknown"}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Дата создания */}
                    <div className="flex items-center justify-between" data-oid="jgbxy-3">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="naqj9tn">
                        {t("options.info.createdAt", "Created")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="v25yx1n">
                        {displayMediaFile.createdAt
                          ? new Date(displayMediaFile.createdAt).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground/70 py-8" data-oid=".uw0ax6">
                    <Info className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" data-oid="ja_8sv7" />
                    <div className="text-sm" data-oid="u916fge">
                      {t("options.info.noTechnicalInfo", "No technical information available")}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Дополнительная информация */}
          <Collapsible open={openSections.advanced} onOpenChange={() => toggleSection("advanced")} data-oid="w79gpmm">
            <CollapsibleTrigger
              className="flex items-center justify-between w-full p-3 bg-muted hover:bg-accent rounded-lg border border-border transition-colors"
              data-oid="sp83k45"
            >
              <div className="flex items-center gap-2" data-oid="s7lskw5">
                <div className="w-2 h-2 rounded-full bg-purple-400" data-oid="2dp.b5t" />
                <Settings className="h-4 w-4 text-purple-400" data-oid="v.vt6tk" />
                <h3 className="font-medium text-foreground" data-oid="o9d5zi6">
                  {t("options.info.advanced", "Advanced Information")}
                </h3>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${openSections.advanced ? "rotate-180" : ""}`}
                data-oid="lhdl53v"
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3" data-oid="qlggohv">
              <div className="bg-card rounded-lg border border-border p-4 space-y-4" data-oid="upfx-ep">
                {/* Информация о выбранном клипе */}
                {currentClip ? (
                  <div className="space-y-3" data-oid="hswimmw">
                    <div className="text-sm font-medium text-foreground/90 mb-3" data-oid="53wexcx">
                      {t("options.info.selectedClip", "Selected Clip")}
                    </div>

                    <div className="flex items-center justify-between" data-oid=":3k:7yi">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="zteaos_">
                        {t("options.info.clipName", "Clip Name")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="za55ox7">
                        {currentClip.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between" data-oid="f0h3nf2">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="dbpvalg">
                        {t("options.info.clipDuration", "Clip Duration")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="21d-ix2">
                        {formatDuration(currentClip.duration || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between" data-oid="s40p4:q">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="41vjsfn">
                        {t("options.info.clipStartTime", "Start Time")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="0ulwdue">
                        {formatDuration(currentClip.startTime || 0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between" data-oid="7r4taog">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="9f:ex79">
                        {t("options.info.clipVolume", "Volume")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="fq2:cy_">
                        {Math.round((currentClip.volume || 1) * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between" data-oid="o7hbwar">
                      <Label className="text-sm font-medium text-foreground/90" data-oid="ilf_4ku">
                        {t("options.info.clipSpeed", "Speed")}
                      </Label>
                      <span className="text-sm text-foreground" data-oid="r59iezc">
                        {(currentClip.speed || 1).toFixed(2)}x
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground/70 py-8" data-oid="l8.44gu">
                    <Settings className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" data-oid="5usx5yo" />
                    <div className="text-sm" data-oid="12_f4i1">
                      {t("options.info.noClipSelected", "No clip selected")}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}
