import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useModals } from "@/domains/system-integration"

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
    <div className="grid gap-4 py-4">
      {/* Текст субтитра */}
      <div className="space-y-2">
        <Label htmlFor="text">Текст субтитра</Label>
        <Textarea
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Введите текст субтитра..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Временные параметры */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Время начала (сек)</Label>
          <Input
            id="startTime"
            type="number"
            value={startTime}
            onChange={(e) => setStartTime(Number.parseFloat(e.target.value) || 0)}
            step="0.1"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">Длительность (сек)</Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number.parseFloat(e.target.value) || 1)}
            step="0.1"
            min="0.1"
          />
        </div>
      </div>

      {/* Стиль субтитра */}
      {availableStyles.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="style">Стиль субтитра</Label>
          <Select value={styleId} onValueChange={setStyleId}>
            <SelectTrigger id="style">
              <SelectValue placeholder="Выберите стиль" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">По умолчанию</SelectItem>
              {availableStyles.map((style) => (
                <SelectItem key={style.id} value={style.id}>
                  {style.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Позиция */}
      <div className="space-y-2">
        <Label htmlFor="position">Позиция на экране</Label>
        <Select value={position} onValueChange={(value) => setPosition(value as typeof position)}>
          <SelectTrigger id="position">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top-left">Сверху слева</SelectItem>
            <SelectItem value="top-center">Сверху по центру</SelectItem>
            <SelectItem value="top-right">Сверху справа</SelectItem>
            <SelectItem value="middle-left">По центру слева</SelectItem>
            <SelectItem value="middle-center">По центру</SelectItem>
            <SelectItem value="middle-right">По центру справа</SelectItem>
            <SelectItem value="bottom-left">Снизу слева</SelectItem>
            <SelectItem value="bottom-center">Снизу по центру</SelectItem>
            <SelectItem value="bottom-right">Снизу справа</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Анимации */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="animationIn">Анимация появления</Label>
          <Select value={animationIn} onValueChange={(value) => setAnimationIn(value as typeof animationIn)}>
            <SelectTrigger id="animationIn">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без анимации</SelectItem>
              <SelectItem value="fade">Затухание</SelectItem>
              <SelectItem value="slide">Скольжение</SelectItem>
              <SelectItem value="typewriter">Печатная машинка</SelectItem>
              <SelectItem value="scale">Масштабирование</SelectItem>
              <SelectItem value="wave">Волна</SelectItem>
              <SelectItem value="bounce">Отскок</SelectItem>
              <SelectItem value="shake">Встряхивание</SelectItem>
              <SelectItem value="blink">Мигание</SelectItem>
              <SelectItem value="dissolve">Растворение</SelectItem>
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
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="animationOut">Анимация исчезновения</Label>
          <Select value={animationOut} onValueChange={(value) => setAnimationOut(value as typeof animationOut)}>
            <SelectTrigger id="animationOut">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Без анимации</SelectItem>
              <SelectItem value="fade">Затухание</SelectItem>
              <SelectItem value="slide">Скольжение</SelectItem>
              <SelectItem value="scale">Масштабирование</SelectItem>
              <SelectItem value="bounce">Отскок</SelectItem>
              <SelectItem value="shake">Встряхивание</SelectItem>
              <SelectItem value="blink">Мигание</SelectItem>
              <SelectItem value="dissolve">Растворение</SelectItem>
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
            />
          )}
        </div>
      </div>

      {/* Дополнительные настройки */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="wordWrap">Перенос слов</Label>
          <Switch id="wordWrap" checked={wordWrap} onCheckedChange={setWordWrap} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxWidth">Максимальная ширина (%)</Label>
          <Input
            id="maxWidth"
            type="number"
            value={maxWidth}
            onChange={(e) => setMaxWidth(Number.parseInt(e.target.value, 10) || 80)}
            min="20"
            max="100"
            step="5"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={closeModal}>
          Отмена
        </Button>
        <Button onClick={handleSave} disabled={!text.trim()}>
          {subtitle ? "Сохранить" : "Добавить"}
        </Button>
      </div>
    </div>
  )
}
