import { useTranslation } from "react-i18next"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { ModalType } from "@timeline-studio/core/types/modals"
import { CameraCaptureModal } from "@/features/camera-capture"
import { ColorGradingSavePresetModal } from "@/features/color-grading/components/controls/color-grading-save-preset-modal"
import { EffectDetailModal } from "@/features/effects/components/effect-detail-modal"
import { ExportModal } from "@/features/export"
import { MidiConfigurationModalComponent } from "@/features/fairlight-audio/components/midi/midi-configuration-modal-component"
import { MidiLearnModal } from "@/features/fairlight-audio/components/midi/midi-learn-modal"
import { MidiMappingEditorModal } from "@/features/fairlight-audio/components/midi/midi-mapping-editor-modal"
import { CacheSettingsModal } from "@/features/media/components/cache-settings-modal"
import { MissingFilesModal } from "@/features/media/components/missing-files-modal"
import { PersonFormModal } from "@/features/person-identification/components/person-form-modal"
import { ProjectSettingsModal } from "@/features/project-settings"
import { SubtitleAIToolsModal } from "@/features/subtitles/components/subtitle-ai-tools-modal"
import { AIMarkerSettingsModal, AudioEffectsEditorModal, SubtitleEditorModal } from "@/features/timeline"
import { UserSettingsModal } from "@/features/user-settings"
import { CacheStatisticsModal } from "@/features/video-compiler/components/cache-statistics-modal"
import { VoiceRecordModal } from "@/features/voice-recording"
import { AboutModal } from "./about-modal"
import { useModals } from "../services"

/**
 * Контейнер для модальных окон
 */
export function ModalContainer() {
  const { activeModal, modalData, isModalOpen, closeModal } = useModals()
  const { t } = useTranslation() // Получаем функцию перевода

  // Рендерим только активное модальное окно с помощью switch
  const renderAllModals = () => {
    switch (activeModal) {
      case "project-settings":
        return <ProjectSettingsModal onClose={closeModal} data-oid="57:eax3" />
      // Temporarily disabled - keyboard-shortcuts feature needs review
      // case "keyboard-shortcuts":
      //   return <KeyboardShortcutsModal />
      case "user-settings":
        return <UserSettingsModal data-oid="rv00w9b" />
      case "about":
        return <AboutModal />
      case "camera-capture":
        return <CameraCaptureModal isOpen={isModalOpen} onClose={closeModal} data-oid="f2i6s-a" />
      case "voice-recording":
        return <VoiceRecordModal isOpen={isModalOpen} onClose={closeModal} data-oid="f7i.sio" />
      case "export":
        return <ExportModal onClose={closeModal} data-oid="ass50fv" />
      case "cache-settings":
        return <CacheSettingsModal data-oid=".2vovbs" />
      case "cache-statistics":
        return <CacheStatisticsModal data-oid="89l_m7_" />
      case "subtitle-editor":
        return <SubtitleEditorModal data-oid="zs37a38" />
      case "person-form":
        return <PersonFormModal data-oid="82qoklk" />
      case "missing-files":
        return <MissingFilesModal data-oid="p:57.f0" />
      case "ai-marker-settings":
        return <AIMarkerSettingsModal data-oid="16ehakn" />
      case "subtitle-ai-tools":
        return <SubtitleAIToolsModal data-oid="i0duie8" />
      case "audio-effects":
        return <AudioEffectsEditorModal data-oid="15vhjo." />
      case "midi-learn":
        return <MidiLearnModal data-oid=":wd32_n" />
      case "midi-mapping":
        return <MidiMappingEditorModal data-oid="ejdwqiz" />
      case "midi-configuration":
        return <MidiConfigurationModalComponent data-oid=":yb14pb" />
      case "effect-detail":
        return <EffectDetailModal data-oid="a96j87q" />
      case "color-grading":
        return <ColorGradingSavePresetModal data-oid="o08d-s0" />
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
      case "about":
        return "h-[max(400px,min(50vh,500px))] w-[max(400px,min(50vw,500px))]"
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
      default:
        return "h-[max(600px,min(50vh,800px))]"
    }
  }

  // Функция для получения заголовка модального окна с использованием i18n
  const getModalTitle = () => {
    switch (activeModal) {
      case "project-settings":
        return t("modals.projectSettings.title", "Настройки проекта")
      case "keyboard-shortcuts":
        return t("modals.keyboardShortcuts.title", "Горячие клавиши")
      case "user-settings":
        return t("modals.userSettings.title", "Настройки пользователя")
      case "about":
        return t("modals.about.title", "О программе")
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
      case "none":
        return ""
      default:
        return ""
    }
  }

  const dialogClass = modalData?.dialogClass ?? getDialogClassForType(activeModal)

  return (
    <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()} data-oid="wbiilah">
      <DialogContent
        aria-describedby="modal"
        className={`${dialogClass} bg-[#dfdfdf] dark:bg-[#1e1e1e] [&>button]:cursor-pointer p-4 flex flex-col`}
        data-oid="u6zm4ok"
      >
        <DialogHeader className="shrink-0 h-[50px] flex items-center justify-center" data-oid="cs7sojv">
          <DialogTitle className="text-center" data-oid="k.:5t8m">
            {getModalTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto" data-oid="-ulq5d:">
          {renderAllModals()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
