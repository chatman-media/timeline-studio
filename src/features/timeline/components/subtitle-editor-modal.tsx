import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useModals } from "@/core/hooks"

import type { SubtitleClip } from "@/features/subtitles/types"

export function SubtitleEditorModal() {
  const { modalData, closeModal } = useModals()

  const subtitle = modalData?.subtitle as SubtitleClip | undefined
  const onSave = modalData?.onSave as ((subtitle: Partial<SubtitleClip>) => void) | undefined
  const availableStyles = (modalData?.availableStyles as Array<{ id: string; name: string }>) || []

  const [text, setText] = useState("")
  const [startTime, setStartTime] = useState(0)
  const [duration, setDuration] = useState(2)
  const [styleId, setStyleId] = useState("")
  const [animationIn, setAnimationIn] = useState<
    "none" | "fade" | "slide" | "typewriter" | "scale" | "wave" | "bounce" | "shake" | "blink" | "dissolve"
  >("none")
  const [animationOut, setAnimationOut] = useState<
    "none" | "fade" | "slide" | "scale" | "bounce" | "shake" | "blink" | "dissolve"
  >("none")
  const [animationInDuration, setAnimationInDuration] = useState(0.5)
  const [animationOutDuration, setAnimationOutDuration] = useState(0.5)
  const [position, setPosition] = useState<
    | "top-left"
    | "top-center"
    | "top-right"
    | "middle-left"
    | "middle-center"
    | "middle-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
  >("bottom-center")
  const [wordWrap, setWordWrap] = useState(true)
  const [maxWidth, setMaxWidth] = useState(80)

  // Инициализация значений при открытии модального окна
  useEffect(() => {
    if (subtitle) {
      setText(subtitle.text || "")
      setStartTime(subtitle.startTime || 0)
      setDuration(subtitle.duration || 2)
      setStyleId(subtitle.subtitleStyleId || "")
      setAnimationIn((subtitle.animationIn?.type as typeof animationIn) || "none")
      setAnimationOut((subtitle.animationOut?.type as typeof animationOut) || "none")
      setAnimationInDuration(subtitle.animationIn?.duration || 0.5)
      setAnimationOutDuration(subtitle.animationOut?.duration || 0.5)
      setPosition(subtitle.subtitlePosition?.alignment || "bottom-center")
      setWordWrap(subtitle.wordWrap ?? true)
      setMaxWidth(subtitle.maxWidth || 80)
    }
  }, [subtitle])

  const handleSave = () => {
    const updatedSubtitle: Partial<SubtitleClip> = {
      text,
      startTime,
      duration,
      subtitleStyleId: styleId === "default" ? undefined : styleId || undefined,
      animationIn:
        animationIn !== "none"
          ? {
              type: animationIn,
              duration: animationInDuration,
            }
          : undefined,
      animationOut:
        animationOut !== "none"
          ? {
              type: animationOut,
              duration: animationOutDuration,
            }
          : undefined,
      subtitlePosition: {
        alignment: position,
        marginX: 20,
        marginY: 20,
      },
      wordWrap,
      maxWidth,
    }

    onSave?.(updatedSubtitle)
    closeModal()
  }

  return (
    <div className="grid gap-4 py-4" data-oid="ebz-_a_">
      {/* Текст субтитра */}
      <div className="space-y-2" data-oid="-704chp">
        <Label htmlFor="text" data-oid="6.s6b:6">
          Текст субтитра
        </Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Введите текст субтитра..."
          rows={3}
          className="resize-none"
          data-oid="rq:ppd1"
        />
      </div>

      {/* Временные параметры */}
      <div className="grid grid-cols-2 gap-4" data-oid="ik2ra29">
        <div className="space-y-2" data-oid=":04jni8">
          <Label htmlFor="startTime" data-oid="4mr-8bb">
            Время начала (сек)
          </Label>
          <Input
            id="startTime"
            type="number"
            value={startTime}
            onChange={(e) => setStartTime(Number.parseFloat(e.target.value) || 0)}
            step="0.1"
            min="0"
            data-oid="hon7c6w"
          />
        </div>
        <div className="space-y-2" data-oid="tf1_lcl">
          <Label htmlFor="duration" data-oid="_fv5p0p">
            Длительность (сек)
          </Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number.parseFloat(e.target.value) || 1)}
            step="0.1"
            min="0.1"
            data-oid="h-4lbmu"
          />
        </div>
      </div>

      {/* Стиль субтитра */}
      {availableStyles.length > 0 && (
        <div className="space-y-2" data-oid="md8:-p1">
          <Label htmlFor="style" data-oid="768:usx">
            Стиль субтитра
          </Label>
          <Select value={styleId} onValueChange={setStyleId} data-oid="9q9rm3j">
            <SelectTrigger id="style" data-oid="yx:gyq:">
              <SelectValue placeholder="Выберите стиль" data-oid="c:sb5ca" />
            </SelectTrigger>
            <SelectContent data-oid="-8lvjmx">
              <SelectItem value="default" data-oid="jqqrc71">
                По умолчанию
              </SelectItem>
              {availableStyles.map((style) => (
                <SelectItem key={style.id} value={style.id} data-oid="_m-uyj.">
                  {style.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Позиция */}
      <div className="space-y-2" data-oid="go6phfi">
        <Label htmlFor="position" data-oid="pilw:tf">
          Позиция на экране
        </Label>
        <Select value={position} onValueChange={(value) => setPosition(value as typeof position)} data-oid="6w7wk24">
          <SelectTrigger id="position" data-oid="t5eub5y">
            <SelectValue data-oid="30qw_37" />
          </SelectTrigger>
          <SelectContent data-oid="bm:ttzn">
            <SelectItem value="top-left" data-oid="yw-3dgq">
              Сверху слева
            </SelectItem>
            <SelectItem value="top-center" data-oid="x_xbfj6">
              Сверху по центру
            </SelectItem>
            <SelectItem value="top-right" data-oid="vcj97xs">
              Сверху справа
            </SelectItem>
            <SelectItem value="middle-left" data-oid="wpyix05">
              По центру слева
            </SelectItem>
            <SelectItem value="middle-center" data-oid=".f0tvjt">
              По центру
            </SelectItem>
            <SelectItem value="middle-right" data-oid="y6xg48x">
              По центру справа
            </SelectItem>
            <SelectItem value="bottom-left" data-oid="0:xv2a9">
              Снизу слева
            </SelectItem>
            <SelectItem value="bottom-center" data-oid="udmn:16">
              Снизу по центру
            </SelectItem>
            <SelectItem value="bottom-right" data-oid="m.p5hjf">
              Снизу справа
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Анимации */}
      <div className="grid grid-cols-2 gap-4" data-oid="94a9-nc">
        <div className="space-y-2" data-oid="eeeq:9y">
          <Label htmlFor="animationIn" data-oid="0hgt3pe">
            Анимация появления
          </Label>
          <Select
            value={animationIn}
            onValueChange={(value) => setAnimationIn(value as typeof animationIn)}
            data-oid=":dvek02"
          >
            <SelectTrigger id="animationIn" data-oid=".ot7aeg">
              <SelectValue data-oid="ebmtuf4" />
            </SelectTrigger>
            <SelectContent data-oid="5rpsecl">
              <SelectItem value="none" data-oid="z:stnve">
                Без анимации
              </SelectItem>
              <SelectItem value="fade" data-oid="lljzi_h">
                Затухание
              </SelectItem>
              <SelectItem value="slide" data-oid="i43rjy7">
                Скольжение
              </SelectItem>
              <SelectItem value="typewriter" data-oid="625u4r.">
                Печатная машинка
              </SelectItem>
              <SelectItem value="scale" data-oid="8i7etz-">
                Масштабирование
              </SelectItem>
              <SelectItem value="wave" data-oid="-3dewrt">
                Волна
              </SelectItem>
              <SelectItem value="bounce" data-oid="h9z4okb">
                Отскок
              </SelectItem>
              <SelectItem value="shake" data-oid="86w:an3">
                Встряхивание
              </SelectItem>
              <SelectItem value="blink" data-oid="0oga0hc">
                Мигание
              </SelectItem>
              <SelectItem value="dissolve" data-oid="e4-zp5y">
                Растворение
              </SelectItem>
            </SelectContent>
          </Select>
          {animationIn !== "none" && (
            <Input
              type="number"
              value={animationInDuration}
              onChange={(e) => setAnimationInDuration(Number.parseFloat(e.target.value) || 0.5)}
              step="0.1"
              min="0.1"
              max="2"
              placeholder="Длительность"
              data-oid="yhw94_8"
            />
          )}
        </div>

        <div className="space-y-2" data-oid="cg_v_ml">
          <Label htmlFor="animationOut" data-oid="2s88kf_">
            Анимация исчезновения
          </Label>
          <Select
            value={animationOut}
            onValueChange={(value) => setAnimationOut(value as typeof animationOut)}
            data-oid="d7lg64v"
          >
            <SelectTrigger id="animationOut" data-oid="voqqg_e">
              <SelectValue data-oid=".qd3o-s" />
            </SelectTrigger>
            <SelectContent data-oid="-s_x-k0">
              <SelectItem value="none" data-oid="bj2-9on">
                Без анимации
              </SelectItem>
              <SelectItem value="fade" data-oid="owo1_8q">
                Затухание
              </SelectItem>
              <SelectItem value="slide" data-oid="e9my4h1">
                Скольжение
              </SelectItem>
              <SelectItem value="scale" data-oid="whur52l">
                Масштабирование
              </SelectItem>
              <SelectItem value="bounce" data-oid="3uwr7_o">
                Отскок
              </SelectItem>
              <SelectItem value="shake" data-oid="d9mxs69">
                Встряхивание
              </SelectItem>
              <SelectItem value="blink" data-oid="x8may_k">
                Мигание
              </SelectItem>
              <SelectItem value="dissolve" data-oid="fq9f0i5">
                Растворение
              </SelectItem>
            </SelectContent>
          </Select>
          {animationOut !== "none" && (
            <Input
              type="number"
              value={animationOutDuration}
              onChange={(e) => setAnimationOutDuration(Number.parseFloat(e.target.value) || 0.5)}
              step="0.1"
              min="0.1"
              max="2"
              placeholder="Длительность"
              data-oid="pcle20m"
            />
          )}
        </div>
      </div>

      {/* Дополнительные настройки */}
      <div className="space-y-4" data-oid="uvp5p0w">
        <div className="flex items-center justify-between" data-oid="h-a-im3">
          <Label htmlFor="wordWrap" data-oid="_8ig4rk">
            Перенос слов
          </Label>
          <Switch id="wordWrap" checked={wordWrap} onCheckedChange={setWordWrap} data-oid="0377-6r" />
        </div>

        <div className="space-y-2" data-oid=".qprib0">
          <Label htmlFor="maxWidth" data-oid="k7b-o6i">
            Максимальная ширина (%)
          </Label>
          <Input
            id="maxWidth"
            type="number"
            value={maxWidth}
            onChange={(e) => setMaxWidth(Number.parseInt(e.target.value, 10) || 80)}
            min="20"
            max="100"
            step="5"
            data-oid="2n8qw:w"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4" data-oid="n7:_4ie">
        <Button variant="outline" onClick={closeModal} data-oid="jf3b8qu">
          Отмена
        </Button>
        <Button onClick={handleSave} disabled={!text.trim()} data-oid="_fwcj-v">
          {subtitle ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </div>
  )
}
