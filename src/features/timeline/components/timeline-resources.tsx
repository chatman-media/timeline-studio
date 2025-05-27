import {
  Music,
  Package,
  Palette,
  Scissors,
  Subtitles,
  Video,
  Sticker,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { useResources } from "@/features/resources";
import { TimelineResource } from "@/types/resources";

/**
 * Компонент для отображения ресурсов таймлайна в левой панели
 */
export function TimelineResources() {
  const { t } = useTranslation();

  // Полностью отключаем логирование
  const {
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    styleTemplateResources,
    musicResources,
    subtitleResources,
  } = useResources();

  // Полностью отключаем логирование

  // Категории ресурсов с их данными
  const categories = [
    {
      id: "music",
      name: t("browser.tabs.music"),
      icon: <Music className="h-3.5 w-3.5 text-gray-400" />,
      resources: musicResources,
    },
    {
      id: "subtitles",
      name: t("browser.tabs.subtitles"),
      icon: <Subtitles className="h-3.5 w-3.5 text-gray-400" />,
      resources: subtitleResources,
    },
    {
      id: "effects",
      name: t("browser.tabs.effects"),
      icon: <Package className="h-3.5 w-3.5 text-gray-400" />,
      resources: effectResources,
    },
    {
      id: "filters",
      name: t("browser.tabs.filters"),
      icon: <Palette className="h-3.5 w-3.5 text-gray-400" />,
      resources: filterResources,
    },
    {
      id: "transitions",
      name: t("browser.tabs.transitions"),
      icon: <Scissors className="h-3.5 w-3.5 text-gray-400" />,
      resources: transitionResources,
    },
    {
      id: "templates",
      name: t("browser.tabs.templates"),
      icon: <Video className="h-3.5 w-3.5 text-gray-400" />,
      resources: templateResources,
    },
    {
      id: "style-templates",
      name: t("browser.tabs.styleTemplates"),
      icon: <Sticker className="h-3.5 w-3.5 text-gray-400" />,
      resources: styleTemplateResources,
    },
  ];

  // Функция для отображения списка ресурсов
  const renderResourceList = (resources: TimelineResource[]) => {
    if (resources.length === 0) {
      return null; // Если ресурсов нет, не показываем ничего
    }

    return (
      <div>
        <div className="flex flex-wrap gap-1 px-1 py-1">
          {resources.map((resource) => (
            <div
              key={resource.id}
              className="relative mb-1 flex h-[26px] w-[110px] flex-shrink-0 cursor-pointer items-center gap-2 rounded-sm border border-[#333] bg-[#2a2a2a] px-2 hover:bg-[#333]"
            >
              {/* Иконка ресурса (слева) */}
              <div className="flex-shrink-0">
                {resource.type === "effect" && <Package className="h-4 w-4" />}
                {resource.type === "filter" && <Palette className="h-4 w-4" />}
                {resource.type === "transition" && (
                  <Scissors className="h-4 w-4" />
                )}
                {resource.type === "template" && <Video className="h-4 w-4" />}
                {resource.type === "style-template" && (
                  <Sticker className="h-4 w-4" />
                )}
                {resource.type === "music" && <Music className="h-4 w-4" />}
                {resource.type === "subtitle" && (
                  <Subtitles className="h-4 w-4" />
                )}
              </div>

              {/* Название ресурса (справа) */}
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-[10px] text-gray-300">
                  {resource.type === "template"
                    ? t(
                        `templates.templateLabels.${resource.name}`,
                        resource.name,
                      )
                    : resource.type === "style-template"
                      ? t(`styleTemplates.${resource.name}`, resource.name)
                      : resource.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-background text-white">
      <div className="border-b border-[#333] p-1.5">
        <h3 className="text-xs font-medium">
          {t("timeline.resources.title", "Ресурсы")}
        </h3>
      </div>

      {/* Прокручиваемый контейнер для всех категорий */}
      <div className="scrollbar-thin scrollbar-thumb-[#444] scrollbar-track-transparent flex-1 overflow-y-auto">
        <div className="space-y-2 p-1.5">
          {categories.map((category) => (
            <div key={category.id} className="space-y-1">
              {/* Заголовок категории */}
              <div className="flex items-center gap-1.5 border-b border-[#333] pb-1 text-[11px] font-medium text-gray-300">
                {category.icon}
                {category.name}
                {category.resources.length > 0 && (
                  <span className="ml-1 text-[9px] text-gray-500">
                    ({category.resources.length})
                  </span>
                )}
              </div>

              {/* Список ресурсов категории */}
              {renderResourceList(category.resources)}

              {/* Сообщение, если нет ресурсов */}
              {category.resources.length === 0 && (
                <div className="pl-1 text-[10px] text-gray-500">
                  {t(
                    "timeline.resources.noResources",
                    "Нет добавленных ресурсов",
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
