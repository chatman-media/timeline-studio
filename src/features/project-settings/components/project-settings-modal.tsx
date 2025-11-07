import { Lock, Unlock } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useModal } from "@/features/modals/services/modal-provider"
import {
  ASPECT_RATIOS,
  COLOR_SPACES,
  type ColorSpace,
  FRAME_RATES,
  type FrameRate,
  getDefaultResolutionForAspectRatio,
  getResolutionsForAspectRatio,
  type ResolutionOption,
} from "@/features/project-settings/types/project"
import { createLogger } from "@/lib/tauri-logger"
import { useProjectSettings } from "../hooks/use-project-settings"
import { getAspectRatioLabel, getAspectRatioString } from "../utils"

const logger = createLogger({ module: "ProjectSettingsModal" })

/**
 * Модальное окно настроек проекта
 * Позволяет пользователю настраивать параметры проекта, такие как:
 * - Соотношение сторон
 * - Разрешение
 * - Частота кадров
 * - Цветовое пространство
 *
 * @returns {JSX.Element} Компонент модального окна настроек проекта
 */
export function ProjectSettingsModal() {
  const { t } = useTranslation() // Хук для интернационализации
  const { closeModal } = useModal() // Хук для управления модальными окнами
  const { settings, updateSettings } = useProjectSettings() // Хук для доступа к настройкам проекта

  // Состояние для хранения доступных разрешений для выбранного соотношения сторон
  const [availableResolutions, setAvailableResolutions] = useState<ResolutionOption[]>([])

  // Состояние для пользовательских значений ширины и высоты
  const [customWidth, setCustomWidth] = useState<number>(1920)
  const [customHeight, setCustomHeight] = useState<number>(1080)

  // Флаг блокировки соотношения сторон (при изменении ширины/высоты)
  const [aspectRatioLocked, setAspectRatioLocked] = useState<boolean>(true)

  /**
   * Эффект для обновления доступных разрешений при изменении соотношения сторон
   * Загружает список разрешений, соответствующих выбранному соотношению сторон
   */
  useEffect(() => {
    // Получаем список доступных разрешений для текущего соотношения сторон
    const resolutions = getResolutionsForAspectRatio(settings.aspectRatio.label)
    setAvailableResolutions(resolutions)

    // Обновляем значения пользовательской ширины и высоты
    // в соответствии с текущими настройками проекта
    setCustomWidth(settings.aspectRatio.value.width)
    setCustomHeight(settings.aspectRatio.value.height)

    logger.info("[ProjectSettingsDialog] Доступные разрешения обновлены:", resolutions)
  }, [settings.aspectRatio]) // Зависимость от соотношения сторон

  /**
   * Функция для обновления соотношения сторон и автоматического обновления разрешения
   * Вызывается при выборе нового соотношения сторон в выпадающем списке
   *
   * @param {string} value - Выбранное соотношение сторон (например, "16:9", "1:1", "custom")
   */
  const handleAspectRatioChange = (value: string) => {
    // Находим объект соотношения сторон по выбранному значению
    const newAspectRatio = ASPECT_RATIOS.find((item) => item.label === value)
    if (newAspectRatio) {
      // Сохраняем текущее состояние блокировки соотношения сторон
      // даже для пользовательского соотношения

      // Получаем рекомендуемое разрешение для нового соотношения сторон
      const recommendedResolution = getDefaultResolutionForAspectRatio(value)

      // Создаем новый объект настроек с обновленным соотношением сторон и разрешением
      const newSettings = {
        ...settings,
        aspectRatio: newAspectRatio,
        // Для пользовательского соотношения используем "custom", иначе рекомендуемое разрешение
        resolution: value === "custom" ? "custom" : recommendedResolution.value,
      }

      // Обновляем размеры в соответствии с выбранным соотношением сторон
      if (value === "custom") {
        // Для пользовательского соотношения используем текущие значения ширины и высоты
        newSettings.aspectRatio = {
          ...newSettings.aspectRatio,
          value: {
            ...newSettings.aspectRatio.value,
            width: customWidth,
            height: customHeight,
          },
        }
      } else {
        // Для стандартных соотношений используем рекомендуемое разрешение
        newSettings.aspectRatio = {
          ...newSettings.aspectRatio,
          value: {
            ...newSettings.aspectRatio.value,
            width: recommendedResolution.width,
            height: recommendedResolution.height,
          },
        }

        // Обновляем значения пользовательской ширины и высоты
        // для отображения в полях ввода
        setCustomWidth(recommendedResolution.width)
        setCustomHeight(recommendedResolution.height)
      }

      // Применяем новые настройки через контекст
      void updateSettings(newSettings)

      // Отладочный вывод
      logger.info("[ProjectSettingsDialog] Соотношение сторон изменено:", {
        aspectRatio: newAspectRatio.label,
        resolution: newSettings.resolution,
        width: newSettings.aspectRatio.value.width,
        height: newSettings.aspectRatio.value.height,
      })

      // Принудительно обновляем компоненты, зависящие от размеров
      // через событие изменения размера окна
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("resize"))
        }
      }, 50)
    }
  }

  return (
    <div className="flex h-full flex-col justify-between items-stretch py-1">
      {/* Выбор соотношения сторон */}
      <div className="flex items-center justify-end">
        <Label className="mr-2 text-xs">{t("dialogs.projectSettings.aspectRatio")}</Label>
        <Select value={settings.aspectRatio.label} onValueChange={handleAspectRatioChange}>
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="">
            {/* Отображение списка доступных соотношений сторон */}
            {ASPECT_RATIOS.map((item) => (
              <SelectItem key={item.label} value={item.label} className="">
                {/* Для пользовательского соотношения показываем специальную метку */}
                {item.label === "custom"
                  ? t("dialogs.projectSettings.aspectRatioLabels.custom")
                  : `${item.label} ${item.textLabel ? `(${getAspectRatioLabel(item.textLabel, t)})` : ""}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Выбор разрешения */}
      <div className="flex items-center justify-end">
        <Label className="mr-2 text-xs">{t("dialogs.projectSettings.resolution")}</Label>
        <Select
          value={
            // Для пользовательского соотношения сторон всегда показываем "custom"
            settings.aspectRatio.label === "custom" ? "custom" : settings.resolution
          }
          onValueChange={(value: string) => {
            // Для пользовательского соотношения сторон блокируем изменение разрешения
            if (settings.aspectRatio.label === "custom") {
              // Для пользовательского соотношения сторон всегда используем пользовательское разрешение
              return
            }

            // Находим выбранное разрешение в списке доступных
            const selectedResolution = availableResolutions.find((res) => res.value === value)

            if (selectedResolution) {
              // Создаем новые настройки с обновленным разрешением и размерами
              const newSettings = {
                ...settings,
                resolution: value,
                aspectRatio: {
                  ...settings.aspectRatio,
                  value: {
                    ...settings.aspectRatio.value,
                    width: selectedResolution.width,
                    height: selectedResolution.height,
                  },
                },
              }

              // Применяем новые настройки
              void updateSettings(newSettings)

              // Обновляем значения пользовательской ширины и высоты
              setCustomWidth(selectedResolution.width)
              setCustomHeight(selectedResolution.height)
            } else {
              // Если разрешение не найдено, просто обновляем значение
              void updateSettings({
                ...settings,
                resolution: value,
              })
            }
          }}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="">
            {/* Для пользовательского соотношения сторон показываем только "custom" */}
            {settings.aspectRatio.label === "custom" ? (
              <SelectItem value="custom" className="">
                {t("dialogs.projectSettings.aspectRatioLabels.custom")}
              </SelectItem>
            ) : (
              // Для стандартных соотношений показываем список доступных разрешений
              availableResolutions.map((option) => (
                <SelectItem key={option.value} value={option.value} className="">
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Поля для ввода пользовательских размеров (ширина и высота) */}
      <div className="flex items-center justify-end">
        <Label className="mr-2 text-xs">{t("dialogs.projectSettings.customSize")}</Label>
        <div className="flex items-center">
          {/* Поле ввода ширины */}
          <Input
            type="number"
            value={customWidth}
            onChange={(e) => {
              const width = Number.parseInt(e.target.value, 10)
              if (!Number.isNaN(width) && width > 0) {
                setCustomWidth(width)

                // Если соотношение сторон заблокировано, обновляем высоту пропорционально
                // для сохранения выбранного соотношения сторон
                if (aspectRatioLocked) {
                  // Вычисляем текущее соотношение сторон
                  const aspectRatio = settings.aspectRatio.value.width / settings.aspectRatio.value.height

                  // Вычисляем новую высоту на основе соотношения сторон
                  const newHeight = Math.round(width / aspectRatio)
                  setCustomHeight(newHeight)

                  // Обновляем настройки проекта с новыми размерами,
                  // сохраняя соотношение сторон
                  const newSettings = {
                    ...settings,
                    aspectRatio: {
                      ...settings.aspectRatio,
                      value: {
                        ...settings.aspectRatio.value,
                        width,
                        height: newHeight,
                      },
                    },
                    resolution: `${width}x${newHeight}`,
                  }
                  void updateSettings(newSettings)
                } else {
                  // Если соотношение сторон не заблокировано или пользовательское,
                  // просто обновляем ширину без изменения высоты
                  const newSettings = {
                    ...settings,
                    aspectRatio: {
                      ...settings.aspectRatio,
                      value: {
                        ...settings.aspectRatio.value,
                        width,
                      },
                    },
                    resolution: `${width}x${customHeight}`,
                  }
                  void updateSettings(newSettings)
                }
              }
            }}
            className="w-20 text-center"
            min={320} // Минимальная ширина
            max={7680} // Максимальная ширина (8K)
          />

          {/* Разделитель между полями ширины и высоты */}
          <span className="mx-2 text-sm">x</span>

          {/* Поле ввода высоты */}
          <Input
            type="number"
            value={customHeight}
            onChange={(e) => {
              const height = Number.parseInt(e.target.value, 10)
              if (!Number.isNaN(height) && height > 0) {
                setCustomHeight(height)

                // Если соотношение сторон заблокировано, обновляем ширину пропорционально
                // для сохранения выбранного соотношения сторон
                if (aspectRatioLocked) {
                  // Вычисляем текущее соотношение сторон
                  const aspectRatio = settings.aspectRatio.value.width / settings.aspectRatio.value.height

                  // Вычисляем новую ширину на основе соотношения сторон
                  const newWidth = Math.round(height * aspectRatio)
                  setCustomWidth(newWidth)

                  // Обновляем настройки проекта с новыми размерами,
                  // сохраняя соотношение сторон
                  const newSettings = {
                    ...settings,
                    aspectRatio: {
                      ...settings.aspectRatio,
                      value: {
                        ...settings.aspectRatio.value,
                        width: newWidth,
                        height,
                      },
                    },
                    resolution: `${newWidth}x${height}`,
                  }
                  void updateSettings(newSettings)
                } else {
                  // Если соотношение сторон не заблокировано или пользовательское,
                  // просто обновляем высоту без изменения ширины
                  const newSettings = {
                    ...settings,
                    aspectRatio: {
                      ...settings.aspectRatio,
                      value: {
                        ...settings.aspectRatio.value,
                        height,
                      },
                    },
                    resolution: `${customWidth}x${height}`,
                  }
                  void updateSettings(newSettings)
                }
              }
            }}
            className="w-20 text-center"
            min={240} // Минимальная высота
            max={4320} // Максимальная высота (4K)
          />

          {/* Кнопка блокировки/разблокировки соотношения сторон */}
          {/* Отображается для всех соотношений сторон */}
          <Button
            variant="ghost"
            size="icon"
            className={`ml-2 h-7 w-7 cursor-pointer p-0 ${
              // Подсвечиваем кнопку, если соотношение сторон заблокировано
              aspectRatioLocked ? "text-[#00CCC0]" : "text-gray-400 hover:text-gray-200"
            }`}
            onClick={() => setAspectRatioLocked(!aspectRatioLocked)}
            title={
              // Подсказка при наведении
              aspectRatioLocked
                ? t("dialogs.projectSettings.unlockAspectRatio")
                : t("dialogs.projectSettings.lockAspectRatio")
            }
          >
            {/* Иконка в зависимости от состояния блокировки */}
            {aspectRatioLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Информация о текущем соотношении сторон */}
      <div className="flex items-center justify-center">
        <div className="flex items-center text-xs text-gray-400">
          {aspectRatioLocked ? (
            // Заблокированное соотношение сторон
            <>
              <Lock className="mr-1 h-3 w-3 text-[#00CCC0]" />
              <span className="text-[#00CCC0]">
                {settings.aspectRatio.label !== "custom"
                  ? t("dialogs.projectSettings.aspectRatioLocked", {
                      ratio: settings.aspectRatio.label,
                    })
                  : t("dialogs.projectSettings.aspectRatioLocked", {
                      ratio: getAspectRatioString(customWidth, customHeight),
                    })}
              </span>
            </>
          ) : (
            // Разблокированное соотношение сторон
            <>
              <Unlock className="mr-1 h-3 w-3" />
              {settings.aspectRatio.label !== "custom"
                ? t("dialogs.projectSettings.aspectRatioUnlocked", {
                    ratio: settings.aspectRatio.label,
                  })
                : t("dialogs.projectSettings.aspectRatioUnlocked", {
                    ratio: getAspectRatioString(customWidth, customHeight),
                  })}
            </>
          )}
        </div>
      </div>

      {/* Выбор частоты кадров */}
      <div className="flex items-center justify-end">
        <Label className="mr-2 text-xs">{t("dialogs.projectSettings.frameRate")}</Label>
        <Select
          value={settings.frameRate}
          onValueChange={(value: FrameRate) =>
            // Обновляем настройки с новой частотой кадров
            updateSettings({
              ...settings,
              frameRate: value,
            })
          }
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="">
            {/* Отображение списка доступных частот кадров */}
            {FRAME_RATES.map((frameRate) => (
              <SelectItem key={frameRate.value} value={frameRate.value} className="">
                {frameRate.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Выбор цветового пространства */}
      <div className="flex items-center justify-end">
        <Label className="mr-2 text-xs">{t("dialogs.projectSettings.colorSpace")}</Label>
        <Select
          value={settings.colorSpace}
          onValueChange={(value: ColorSpace) =>
            // Обновляем настройки с новым цветовым пространством
            updateSettings({
              ...settings,
              colorSpace: value,
            })
          }
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="">
            {/* Отображение списка доступных цветовых пространств */}
            {COLOR_SPACES.map((colorSpace) => (
              <SelectItem key={colorSpace.value} value={colorSpace.value} className="">
                {colorSpace.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Кнопки действий в нижней части модального окна */}
      <DialogFooter className="flex justify-between space-x-4 h-[50px]">
        {/* Кнопка отмены */}
        <Button
          variant="default"
          className="flex-1 cursor-pointer"
          onClick={() => closeModal()} // Закрываем модальное окно без сохранения
        >
          {t("dialogs.projectSettings.cancel")}
        </Button>

        {/* Кнопка сохранения */}
        <Button
          variant="default"
          className="flex-1 cursor-pointer bg-[#00CCC0] text-black hover:bg-[#00AAA0]"
          onClick={() => {
            // Создаем копию текущих настроек для обновления
            // Это обеспечивает обновление всех компонентов, зависящих от настроек
            const currentSettings = { ...settings }

            // Обновляем размеры в соответствии с текущим разрешением
            // Это гарантирует, что шаблоны будут правильно отображаться
            if (currentSettings.resolution === "custom") {
              // Для пользовательского разрешения используем текущие значения ширины и высоты
              currentSettings.aspectRatio = {
                ...currentSettings.aspectRatio,
                value: {
                  ...currentSettings.aspectRatio.value,
                  width: customWidth,
                  height: customHeight,
                },
              }
              // Устанавливаем разрешение в формате "ширинаxвысота"
              currentSettings.resolution = `${customWidth}x${customHeight}`
            } else if (currentSettings.resolution) {
              // Для стандартных разрешений парсим значения из строки
              const resolutionParts = currentSettings.resolution.split("x")
              if (resolutionParts.length === 2) {
                const width = Number.parseInt(resolutionParts[0], 10)
                const height = Number.parseInt(resolutionParts[1], 10)

                if (!Number.isNaN(width) && !Number.isNaN(height)) {
                  // Обновляем размеры в соответствии с выбранным разрешением
                  currentSettings.aspectRatio = {
                    ...currentSettings.aspectRatio,
                    value: {
                      ...currentSettings.aspectRatio.value,
                      width,
                      height,
                    },
                  }
                }
              }
            }

            // Применяем обновленные настройки
            void updateSettings(currentSettings)

            // Отладочный вывод
            logger.info("[ProjectSettingsDialog] Applied settings:", currentSettings)

            // Закрываем диалог с небольшой задержкой, чтобы дать время обновиться всем компонентам
            setTimeout(() => {
              closeModal()

              // Принудительно вызываем событие изменения размера окна,
              // чтобы обновить все компоненты, которые зависят от размеров
              if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("resize"))
              }
            }, 100)
          }}
        >
          {t("dialogs.projectSettings.save")}
        </Button>
      </DialogFooter>
    </div>
  )
}
