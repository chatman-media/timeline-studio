import { useState } from "react"

import { Button } from "@timeline-studio/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@timeline-studio/ui/components/dialog"
import { Input } from "@timeline-studio/ui/components/input"
import { Label } from "@timeline-studio/ui/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@timeline-studio/ui/components/select"
import { Switch } from "@timeline-studio/ui/components/switch"
import { Textarea } from "@timeline-studio/ui/components/textarea"

import type { SubtitleClip } from "@/features/subtitles/types"

interface SubtitleEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subtitle?: SubtitleClip | null
  onSave: (subtitle: Partial<SubtitleClip>) => void
  availableStyles?: Array<{ id: string; name: string }>
}

export function SubtitleEditor({ open, onOpenChange, subtitle, onSave, availableStyles = [] }: SubtitleEditorProps) {
  const [text, setText] = useState(subtitle?.text || "")
  const [startTime, setStartTime] = useState(subtitle?.startTime || 0)
  const [duration, setDuration] = useState(subtitle?.duration || 2)
  const [styleId, setStyleId] = useState(subtitle?.subtitleStyleId || "")
  const [animationIn, setAnimationIn] = useState<
    "none" | "fade" | "slide" | "typewriter" | "scale" | "wave" | "bounce" | "shake" | "blink" | "dissolve"
  >(
    (subtitle?.animationIn?.type as
      | "none"
      | "fade"
      | "slide"
      | "typewriter"
      | "scale"
      | "wave"
      | "bounce"
      | "shake"
      | "blink"
      | "dissolve") || "none",
  )
  const [animationOut, setAnimationOut] = useState<
    "none" | "fade" | "slide" | "scale" | "bounce" | "shake" | "blink" | "dissolve"
  >(
    (subtitle?.animationOut?.type as "none" | "fade" | "slide" | "scale" | "bounce" | "shake" | "blink" | "dissolve") ||
      "none",
  )
  const [animationInDuration, setAnimationInDuration] = useState(subtitle?.animationIn?.duration || 0.5)
  const [animationOutDuration, setAnimationOutDuration] = useState(subtitle?.animationOut?.duration || 0.5)
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
  >(subtitle?.subtitlePosition?.alignment || "bottom-center")
  const [wordWrap, setWordWrap] = useState(subtitle?.wordWrap ?? true)
  const [maxWidth, setMaxWidth] = useState(subtitle?.maxWidth || 80)

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

    onSave(updatedSubtitle)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="f_gzvd8">
      <DialogContent className="max-w-2xl" data-oid="bepugtz">
        <DialogHeader data-oid="i6_dm.y">
          <DialogTitle data-oid="zwja27t">{subtitle ? "Редактировать субтитр" : "Добавить субтитр"}</DialogTitle>
          <DialogDescription data-oid="d5i03pd">Введите текст субтитра и настройте его параметры</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4" data-oid=".wj39qf">
          {/* Текст субтитра */}
          <div className="space-y-2" data-oid="f5aff:-">
            <Label htmlFor="text" data-oid="td333.x">
              Текст субтитра
            </Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите текст субтитра..."
              rows={3}
              className="resize-none"
              data-oid="fg2vp0d"
            />
          </div>

          {/* Временные параметры */}
          <div className="grid grid-cols-2 gap-4" data-oid="_8xf8_w">
            <div className="space-y-2" data-oid="s7t.lwi">
              <Label htmlFor="startTime" data-oid=".x12m-m">
                Время начала (сек)
              </Label>
              <Input
                id="startTime"
                type="number"
                value={startTime}
                onChange={(e) => setStartTime(Number.parseFloat(e.target.value) || 0)}
                step="0.1"
                min="0"
                data-oid="qfowwky"
              />
            </div>
            <div className="space-y-2" data-oid="htm8u0f">
              <Label htmlFor="duration" data-oid="_qt9zjf">
                Длительность (сек)
              </Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number.parseFloat(e.target.value) || 1)}
                step="0.1"
                min="0.1"
                data-oid="lzzmtv0"
              />
            </div>
          </div>

          {/* Стиль субтитра */}
          {availableStyles.length > 0 && (
            <div className="space-y-2" data-oid="r7._km_">
              <Label htmlFor="style" data-oid=":v-3n1p">
                Стиль субтитра
              </Label>
              <Select value={styleId} onValueChange={setStyleId} data-oid="l2k0z9-">
                <SelectTrigger id="style" data-oid="6weraik">
                  <SelectValue placeholder="Выберите стиль" data-oid="nhq:6zk" />
                </SelectTrigger>
                <SelectContent data-oid="nspb_wf">
                  <SelectItem value="default" data-oid="8zg.2xc">
                    По умолчанию
                  </SelectItem>
                  {availableStyles.map((style) => (
                    <SelectItem key={style.id} value={style.id} data-oid=":vmxr57">
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Позиция */}
          <div className="space-y-2" data-oid="fd61isn">
            <Label htmlFor="position" data-oid="om-0oq4">
              Позиция на экране
            </Label>
            <Select
              value={position}
              onValueChange={(value) => setPosition(value as typeof position)}
              data-oid="g-j3i8r"
            >
              <SelectTrigger id="position" data-oid="9b6bzk8">
                <SelectValue data-oid="y0v_f2r" />
              </SelectTrigger>
              <SelectContent data-oid="ht3.v4a">
                <SelectItem value="top-left" data-oid="z7cbylw">
                  Сверху слева
                </SelectItem>
                <SelectItem value="top-center" data-oid="u.mb4:4">
                  Сверху по центру
                </SelectItem>
                <SelectItem value="top-right" data-oid=":dwq0vz">
                  Сверху справа
                </SelectItem>
                <SelectItem value="middle-left" data-oid="l_95rj1">
                  По центру слева
                </SelectItem>
                <SelectItem value="middle-center" data-oid="r36dkou">
                  По центру
                </SelectItem>
                <SelectItem value="middle-right" data-oid=":3.jlet">
                  По центру справа
                </SelectItem>
                <SelectItem value="bottom-left" data-oid="s-jtwrn">
                  Снизу слева
                </SelectItem>
                <SelectItem value="bottom-center" data-oid="mqit438">
                  Снизу по центру
                </SelectItem>
                <SelectItem value="bottom-right" data-oid="dgkaee:">
                  Снизу справа
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Анимации */}
          <div className="grid grid-cols-2 gap-4" data-oid="3m5g5ll">
            <div className="space-y-2" data-oid="-pey914">
              <Label htmlFor="animationIn" data-oid="2y.8xf6">
                Анимация появления
              </Label>
              <Select
                value={animationIn}
                onValueChange={(value) => setAnimationIn(value as typeof animationIn)}
                data-oid="v_81btx"
              >
                <SelectTrigger id="animationIn" data-oid="prhf:.2">
                  <SelectValue data-oid="3o:r_ao" />
                </SelectTrigger>
                <SelectContent data-oid="fzbt1e2">
                  <SelectItem value="none" data-oid="csmfi0l">
                    Без анимации
                  </SelectItem>
                  <SelectItem value="fade" data-oid="okcfmq0">
                    Затухание
                  </SelectItem>
                  <SelectItem value="slide" data-oid="3tcvcdy">
                    Скольжение
                  </SelectItem>
                  <SelectItem value="typewriter" data-oid="e45hyn:">
                    Печатная машинка
                  </SelectItem>
                  <SelectItem value="scale" data-oid="w-v8i1g">
                    Масштабирование
                  </SelectItem>
                  <SelectItem value="wave" data-oid="uh4k0kt">
                    Волна
                  </SelectItem>
                  <SelectItem value="bounce" data-oid="9a9:r6:">
                    Отскок
                  </SelectItem>
                  <SelectItem value="shake" data-oid="zi2gizp">
                    Встряхивание
                  </SelectItem>
                  <SelectItem value="blink" data-oid="dd.9uik">
                    Мигание
                  </SelectItem>
                  <SelectItem value="dissolve" data-oid="iewgwe:">
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
                  data-oid="olfsx18"
                />
              )}
            </div>

            <div className="space-y-2" data-oid="86ljreq">
              <Label htmlFor="animationOut" data-oid="ngx1mzv">
                Анимация исчезновения
              </Label>
              <Select
                value={animationOut}
                onValueChange={(value) => setAnimationOut(value as typeof animationOut)}
                data-oid="e46rniz"
              >
                <SelectTrigger id="animationOut" data-oid="oys7hck">
                  <SelectValue data-oid="iyl.hvw" />
                </SelectTrigger>
                <SelectContent data-oid="x.jzu86">
                  <SelectItem value="none" data-oid="e_97wc:">
                    Без анимации
                  </SelectItem>
                  <SelectItem value="fade" data-oid="9jtavv:">
                    Затухание
                  </SelectItem>
                  <SelectItem value="slide" data-oid="b:wmt5w">
                    Скольжение
                  </SelectItem>
                  <SelectItem value="scale" data-oid="eq_yfw-">
                    Масштабирование
                  </SelectItem>
                  <SelectItem value="bounce" data-oid="pqns3cb">
                    Отскок
                  </SelectItem>
                  <SelectItem value="shake" data-oid="bihw7aj">
                    Встряхивание
                  </SelectItem>
                  <SelectItem value="blink" data-oid="0l8dnok">
                    Мигание
                  </SelectItem>
                  <SelectItem value="dissolve" data-oid="ckbz98b">
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
                  data-oid=".3k1u-p"
                />
              )}
            </div>
          </div>

          {/* Дополнительные настройки */}
          <div className="space-y-4" data-oid="_1fwnbz">
            <div className="flex items-center justify-between" data-oid="nfd.kqx">
              <Label htmlFor="wordWrap" data-oid="391cwba">
                Перенос слов
              </Label>
              <Switch id="wordWrap" checked={wordWrap} onCheckedChange={setWordWrap} data-oid="jfch5ae" />
            </div>

            <div className="space-y-2" data-oid="qfs6klm">
              <Label htmlFor="maxWidth" data-oid="xrtzrsg">
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
                data-oid="56-pyuz"
              />
            </div>
          </div>
        </div>

        <DialogFooter data-oid="6jp994w">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-oid="34y1-i.">
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={!text.trim()} data-oid="cxj9g8l">
            {subtitle ? "Сохранить" : "Добавить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
