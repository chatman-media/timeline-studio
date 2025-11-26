import { useTranslation } from "react-i18next"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AIDirectorModal } from "@/features/ai-director"
import { MissingFilesModal } from "@/features/app-state/components/missing-files-modal"
import { CameraCaptureModal } from "@/features/camera-capture"
import { ColorGradingSavePresetModal } from "@/features/color-grading/components/controls/color-grading-save-preset-modal"
import { EffectDetailModal } from "@/features/effects/components/effect-detail-modal"
import { ExportModal } from "@/features/export"
import { MidiConfigurationModalComponent } from "@/features/fairlight-audio/components/midi/midi-configuration-modal-component"
import { MidiLearnModal } from "@/features/fairlight-audio/components/midi/midi-learn-modal"
import { MidiMappingEditorModal } from "@/features/fairlight-audio/components/midi/midi-mapping-editor-modal"
import { KeyboardShortcutsModal } from "@/features/keyboard-shortcuts"
import { CacheSettingsModal } from "@/features/media/components/cache-settings-modal"
import { PersonFormModal } from "@/features/person-identification/components/person-form-modal"
import { ProjectSettingsModal } from "@/features/project-settings"
import { SubtitleAIToolsModal } from "@/features/subtitles/components/subtitle-ai-tools-modal"
import { AIMarkerSettingsModal } from "@/features/timeline/components/ai-markers/ai-marker-settings-modal"
import { AudioEffectsEditorModal } from "@/features/timeline/components/audio-effects-editor-modal"
import { SubtitleEditorModal } from "@/features/timeline/components/subtitle-editor-modal"
import { UserSettingsModal } from "@/features/user-settings"
import { CacheStatisticsModal } from "@/features/video-compiler/components/cache-statistics-modal"
import { VoiceRecordModal } from "@/features/voice-recording"

import { type ModalType, useModal } from "../services"

/**
 * Контейнер для модальных окон
 */
export function ModalContainer() {
  const { modalType, modalData, isOpen, closeModal } = useModal()
  const { t } = useTranslation() // Получаем функцию перевода

  // Рендерим только активное модальное окно с помощью switch
  const renderAllModals = () => {
    switch (modalType) {
      case "project-settings":
        return <ProjectSettingsModal />
      case "keyboard-shortcuts":
        return <KeyboardShortcutsModal />
      case "user-settings":
        return <UserSettingsModal />
      case "camera-capture":
        return <CameraCaptureModal />
      case "voice-recording":
        return <VoiceRecordModal />
      case "export":
        return <ExportModal />
      case "cache-settings":
        return <CacheSettingsModal />
      case "cache-statistics":
        return <CacheStatisticsModal />
      case "subtitle-editor":
        return <SubtitleEditorModal />
      case "person-form":
        return <PersonFormModal />
      case "missing-files":
        return <MissingFilesModal />
      case "ai-marker-settings":
        return <AIMarkerSettingsModal />
      case "subtitle-ai-tools":
        return <SubtitleAIToolsModal />
      case "audio-effects":
        return <AudioEffectsEditorModal />
      case "midi-learn":
        return <MidiLearnModal />
      case "midi-mapping":
        return <MidiMappingEditorModal />
      case "midi-configuration":
        return <MidiConfigurationModalComponent />
      case "effect-detail":
        return <EffectDetailModal />
      case "color-grading":
        return <ColorGradingSavePresetModal />
      case "ai-director":
        return <AIDirectorModal />
      default:
        return null
    }
  }

  const getDialogClassForType = (modalType: ModalType): string => {
    switch (modalType) {
      case "camera-capture":
        return "h-[max(600px,min(70vh,800px))] w-[max(700px,min(80vw,900px))]"
      case "voice-recording":
        return "h-[max(500px,min(60vh,700px))] w-[max(600px,min(70vw,800px))]"
      case "export":
        return "h-[max(700px,min(80vh,900px))] w-[max(800px,min(90vw,1200px))]"
      case "project-settings":
        return "h-[450px] w-[500px]"
      case "user-settings":
        return "h-[800px] w-[600px]"
      case "keyboard-shortcuts":
        return "h-[max(600px,min(70vh,1000px))] w-[1200px]"
      case "cache-settings":
        return "h-[max(700px,min(80vh,900px))] w-[666px]"
      case "cache-statistics":
        return "h-[max(600px,min(70vh,800px))] w-[666px]"
      case "subtitle-editor":
        return "h-[max(600px,min(70vh,800px))] w-[max(600px,min(70vw,800px))]"
      case "person-form":
        return "h-[max(500px,min(60vh,700px))] w-[max(500px,min(60vw,600px))]"
      case "missing-files":
        return "h-[max(600px,min(70vh,800px))] w-[max(700px,min(80vw,900px))]"
      case "ai-marker-settings":
        return "h-[max(600px,min(70vh,700px))] w-[max(500px,min(60vw,600px))]"
      case "subtitle-ai-tools":
        return "h-[max(500px,min(60vh,600px))] w-[max(500px,min(60vw,600px))]"
      case "audio-effects":
        return "max-w-3xl max-h-[80vh] overflow-y-auto"
      case "midi-learn":
        return "sm:max-w-md"
      case "midi-mapping":
        return "sm:max-w-md"
      case "midi-configuration":
        return "max-w-2xl max-h-[80vh] overflow-hidden"
      case "effect-detail":
        return "max-w-4xl max-h-[90vh] overflow-y-auto"
      case "color-grading":
        return "h-[max(400px,min(50vh,500px))] w-[max(500px,min(60vw,600px))]"
      case "ai-director":
        return "h-[max(800px,min(90vh,1000px))] w-[max(1200px,min(95vw,1400px))]"
      default:
        return "h-[max(600px,min(50vh,800px))]"
    }
  }

  // Функция для получения заголовка модального окна с использованием i18n
  const getModalTitle = () => {
    switch (modalType) {
      case "project-settings":
        return t("modals.projectSettings.title", "Настройки проекта")
      case "keyboard-shortcuts":
        return t("modals.keyboardShortcuts.title", "Горячие клавиши")
      case "user-settings":
        return t("modals.userSettings.title", "Настройки пользователя")
      case "camera-capture":
        return t("modals.cameraCapture.title", "Запись с камеры")
      case "voice-recording":
        return t("modals.voiceRecording.title", "Запись голоса")
      case "export":
        return t("modals.export.title", "Экспорт")
      case "cache-settings":
        return t("modals.cacheSettings.title", "Настройки кэша")
      case "cache-statistics":
        return t("modals.cacheStatistics.title", "Статистика кэша")
      case "subtitle-editor":
        return modalData?.subtitle
          ? t("modals.subtitleEditor.titleEdit", "Редактировать субтитр")
          : t("modals.subtitleEditor.titleAdd", "Добавить субтитр")
      case "person-form":
        return modalData?.person
          ? t("modals.personForm.titleEdit", "Редактировать персону")
          : t("modals.personForm.titleAdd", "Создать персону")
      case "missing-files":
        return t("modals.missingFiles.title", "Отсутствующие медиафайлы")
      case "ai-marker-settings":
        return t("modals.aiMarkerSettings.title", "Настройки AI маркеров")
      case "subtitle-ai-tools":
        return t("modals.subtitleAITools.title", "Автоматическая транскрипция")
      case "audio-effects":
        return t("modals.audioEffects.title", "Аудио эффекты")
      case "midi-learn":
        return t("modals.midiLearn.title", "Обучение MIDI")
      case "midi-mapping":
        return t("modals.midiMapping.title", "Редактор MIDI маппинга")
      case "midi-configuration":
        return t("modals.midiConfiguration.title", "Настройки MIDI")
      case "effect-detail":
        return t("modals.effectDetail.title", "Детали эффекта")
      case "color-grading":
        return t("modals.colorGrading.title", "Сохранить пресет цветокоррекции")
      case "ai-director":
        return t("modals.aiDirector.title", "AI Директор анализа")
      case "none":
        return ""
      default:
        return ""
    }
  }

  const dialogClass = modalData?.dialogClass ?? getDialogClassForType(modalType)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent
        aria-describedby="modal"
        className={`${dialogClass} bg-[#dfdfdf] dark:bg-[#1e1e1e] [&>button]:cursor-pointer p-4 flex flex-col`}
      >
        <DialogHeader className="shrink-0 h-[50px] flex items-center justify-center">
          <DialogTitle className="text-center">{getModalTitle()}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto">{renderAllModals()}</div>
      </DialogContent>
    </Dialog>
  )
}
