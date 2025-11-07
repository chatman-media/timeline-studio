import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Palette,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react"
import { type FC, useCallback, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { UnifiedContentAnalysis } from "@/domains/ai-services/services"
import { Emotion, EmotionalTone } from "@/domains/ai-services/services/script-generation"
import { ScriptTemplate } from "@/domains/ai-services/services/script-generation/template-engine"
import { Genre } from "@/domains/shared/types/ai-tools/content-analysis"
import {
  EditingStyle,
  GeneratedScript,
  NarrativeStyle,
  NarrativeType,
  PaceType,
  ScriptStyle,
  TemplateCategory,
  VisualStyle,
} from "@/domains/shared/types/ai-tools/script-generation"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useAIIntelligence } from "../../hooks/use-ai-intelligence"

const logger = createLogger({ module: "GenerationWizard" })

interface GenerationWizardProps {
  className?: string
  analysis?: UnifiedContentAnalysis | null
  onGenerate?: (script: GeneratedScript) => void
  onCancel?: () => void
  onClose?: () => void
}

type WizardStep = "template" | "style" | "narrative" | "characters" | "audio" | "review" | "generating"

interface WizardState {
  currentStep: WizardStep
  template?: ScriptTemplate
  style: ScriptStyle
  genre: Genre[]
  duration?: number
  targetAudience: string
  tone: EmotionalTone
  includeDialogue: boolean
  includeVoiceover: boolean
  narrativeStructure: NarrativeType
  customPrompt: string
  voiceoverStyle: string
  pacing: PaceType
  characterCount: number
  includeNarrator: boolean
}

const defaultWizardState: WizardState = {
  currentStep: "template",
  style: {
    visual: VisualStyle.CINEMATIC,
    narrative: NarrativeStyle.LINEAR,
    editing: EditingStyle.CONTINUITY,
  },
  genre: [Genre.GENERAL],
  targetAudience: "Общая аудитория",
  tone: {
    primary: Emotion.CALM,
    intensity: 0.5,
  },
  includeDialogue: true,
  includeVoiceover: false,
  narrativeStructure: NarrativeType.THREE_ACT,
  customPrompt: "",
  voiceoverStyle: "narrative",
  pacing: PaceType.MODERATE,
  characterCount: 2,
  includeNarrator: false,
}

const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: "cinematic-narrative",
    name: "Кинематографический рассказ",
    description: "Классический трёхактный фильм с драматической структурой",
    category: TemplateCategory.FILM,
    structure: {
      type: NarrativeType.THREE_ACT,
      acts: [
        { number: 1, title: "Завязка", description: "Установка персонажей и конфликта", scenes: [], duration: 30 },
        { number: 2, title: "Развитие", description: "Развитие конфликта и препятствия", scenes: [], duration: 60 },
        { number: 3, title: "Развязка", description: "Разрешение конфликта", scenes: [], duration: 30 },
      ],
      turningPoints: [],
    },
    defaultParams: {
      style: {
        visual: VisualStyle.CINEMATIC,
        narrative: NarrativeStyle.LINEAR,
        editing: EditingStyle.CONTINUITY,
      },
      genre: [Genre.DRAMA],
      includeDialogue: true,
      includeVoiceover: false,
      narrativeStructure: NarrativeType.THREE_ACT,
    },
    examples: ["Драма", "Короткометражка", "Художественный фильм"],
  },
  {
    id: "documentary",
    name: "Документальный",
    description: "Информационный документальный формат с закадровым голосом",
    category: TemplateCategory.DOCUMENTARY,
    structure: {
      type: NarrativeType.LINEAR,
      acts: [
        { number: 1, title: "Введение", description: "Представление темы", scenes: [], duration: 20 },
        { number: 2, title: "Исследование", description: "Раскрытие темы", scenes: [], duration: 80 },
        { number: 3, title: "Заключение", description: "Выводы", scenes: [], duration: 20 },
      ],
      turningPoints: [],
    },
    defaultParams: {
      style: {
        visual: VisualStyle.DOCUMENTARY,
        narrative: NarrativeStyle.LINEAR,
        editing: EditingStyle.CONTINUITY,
      },
      genre: [Genre.DOCUMENTARY],
      includeDialogue: false,
      includeVoiceover: true,
      narrativeStructure: NarrativeType.LINEAR,
    },
    examples: ["Обучающее видео", "Репортаж", "Образовательный контент"],
  },
  {
    id: "social-media",
    name: "Социальные сети",
    description: "Короткий динамичный контент для соцсетей",
    category: TemplateCategory.SOCIAL_MEDIA,
    structure: {
      type: NarrativeType.NONLINEAR,
      acts: [
        { number: 1, title: "Хук", description: "Привлечение внимания", scenes: [], duration: 5 },
        { number: 2, title: "Контент", description: "Основное сообщение", scenes: [], duration: 20 },
        { number: 3, title: "CTA", description: "Призыв к действию", scenes: [], duration: 5 },
      ],
      turningPoints: [],
    },
    defaultParams: {
      style: {
        visual: VisualStyle.DYNAMIC,
        narrative: NarrativeStyle.MONTAGE,
        editing: EditingStyle.JUMP_CUT,
      },
      genre: [Genre.GENERAL],
      includeDialogue: false,
      includeVoiceover: true,
      narrativeStructure: NarrativeType.NONLINEAR,
    },
    examples: ["TikTok", "Instagram Reels", "YouTube Shorts"],
  },
  {
    id: "commercial",
    name: "Коммерческий",
    description: "Рекламный ролик с фокусом на продукт",
    category: TemplateCategory.COMMERCIAL,
    structure: {
      type: NarrativeType.THREE_ACT,
      acts: [
        { number: 1, title: "Проблема", description: "Представление потребности", scenes: [], duration: 10 },
        { number: 2, title: "Решение", description: "Демонстрация продукта", scenes: [], duration: 15 },
        { number: 3, title: "Результат", description: "Призыв к покупке", scenes: [], duration: 5 },
      ],
      turningPoints: [],
    },
    defaultParams: {
      style: {
        visual: VisualStyle.DYNAMIC,
        narrative: NarrativeStyle.LINEAR,
        editing: EditingStyle.MONTAGE,
      },
      genre: [Genre.GENERAL],
      includeDialogue: true,
      includeVoiceover: true,
      narrativeStructure: NarrativeType.THREE_ACT,
    },
    examples: ["Продающий ролик", "Презентация продукта", "Реклама услуг"],
  },
  {
    id: "vlog",
    name: "Видеоблог",
    description: "Личный видеоблог с естественным повествованием",
    category: TemplateCategory.VLOG,
    structure: {
      type: NarrativeType.EPISODIC,
      acts: [
        { number: 1, title: "Введение", description: "Приветствие и планы", scenes: [], duration: 15 },
        { number: 2, title: "Активность", description: "Основные события", scenes: [], duration: 70 },
        { number: 3, title: "Заключение", description: "Выводы и прощание", scenes: [], duration: 15 },
      ],
      turningPoints: [],
    },
    defaultParams: {
      style: {
        visual: VisualStyle.REALISTIC,
        narrative: NarrativeStyle.STREAM_OF_CONSCIOUSNESS,
        editing: EditingStyle.JUMP_CUT,
      },
      genre: [Genre.LIFESTYLE],
      includeDialogue: true,
      includeVoiceover: false,
      narrativeStructure: NarrativeType.EPISODIC,
    },
    examples: ["Влог путешествий", "Ежедневная жизнь", "Обзор дня"],
  },
]

const STEP_ORDER: WizardStep[] = ["template", "style", "narrative", "characters", "audio", "review", "generating"]

export const GenerationWizard: FC<GenerationWizardProps> = ({ className, analysis, onGenerate, onCancel, onClose }) => {
  const [state, setState] = useState<WizardState>(defaultWizardState)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { generateScript } = useAIIntelligence({
    onProgress: (progress) => {
      setGenerationProgress(progress.overall)
    },
    onError: (err) => {
      setError(err.message)
      setIsGenerating(false)
    },
  })

  const currentStepIndex = STEP_ORDER.indexOf(state.currentStep)
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === STEP_ORDER.length - 1
  const canProceed = useMemo(() => {
    switch (state.currentStep) {
      case "template":
        return state.template !== undefined
      case "style":
        return state.genre.length > 0
      case "narrative":
        return true
      case "characters":
        return true
      case "audio":
        return true
      case "review":
        return true
      default:
        return false
    }
  }, [state])

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }))
  }, [])

  const goToStep = useCallback(
    (step: WizardStep) => {
      updateState({ currentStep: step })
    },
    [updateState],
  )

  const goNext = useCallback(() => {
    if (!isLastStep && canProceed) {
      const nextIndex = currentStepIndex + 1
      goToStep(STEP_ORDER[nextIndex])
    }
  }, [currentStepIndex, isLastStep, canProceed, goToStep])

  const goBack = useCallback(() => {
    if (!isFirstStep) {
      const prevIndex = currentStepIndex - 1
      goToStep(STEP_ORDER[prevIndex])
    }
  }, [currentStepIndex, isFirstStep, goToStep])

  const handleTemplateSelect = useCallback(
    (template: ScriptTemplate) => {
      // Если кликнули на уже выбранный шаблон, отменяем выбор
      if (state.template?.id === template.id) {
        updateState({
          template: undefined,
          // Сбрасываем на значения по умолчанию
          style: defaultWizardState.style,
          genre: defaultWizardState.genre,
          includeDialogue: defaultWizardState.includeDialogue,
          includeVoiceover: defaultWizardState.includeVoiceover,
          narrativeStructure: defaultWizardState.narrativeStructure,
        })
      } else {
        // Выбираем новый шаблон
        updateState({
          template,
          style: template.defaultParams.style || state.style,
          genre: template.defaultParams.genre || state.genre,
          includeDialogue: template.defaultParams.includeDialogue ?? state.includeDialogue,
          includeVoiceover: template.defaultParams.includeVoiceover ?? state.includeVoiceover,
          narrativeStructure: template.defaultParams.narrativeStructure || state.narrativeStructure,
        })
      }
    },
    [state, updateState],
  )

  const handleGenerate = useCallback(async () => {
    if (!analysis) {
      setError("Нет данных анализа для генерации скрипта")
      return
    }

    try {
      setIsGenerating(true)
      setError(null)
      updateState({ currentStep: "generating" })
      setGenerationProgress(0)

      const params: ScriptGenerationParams = {
        style: state.style,
        genre: state.genre,
        duration: state.duration || analysis.mediaFile.duration,
        targetAudience: state.targetAudience,
        tone: state.tone,
        includeDialogue: state.includeDialogue,
        includeVoiceover: state.includeVoiceover,
        narrativeStructure: state.narrativeStructure,
        customPrompt: state.customPrompt,
      }

      const script = await generateScript(analysis, params)
      onGenerate?.(script)
      onClose?.()
    } catch (error) {
      logger.error("Script generation failed:", error)
      setError(error instanceof Error ? error.message : "Ошибка генерации скрипта")
    } finally {
      setIsGenerating(false)
    }
  }, [analysis, state, generateScript, onGenerate, onClose, updateState])

  const renderStepContent = () => {
    switch (state.currentStep) {
      case "template":
        return (
          <TemplateStep
            templates={SCRIPT_TEMPLATES}
            selectedTemplate={state.template}
            onSelect={handleTemplateSelect}
          />
        )
      case "style":
        return <StyleStep state={state} onUpdate={updateState} />
      case "narrative":
        return <NarrativeStep state={state} onUpdate={updateState} />
      case "characters":
        return <CharactersStep state={state} onUpdate={updateState} />
      case "audio":
        return <AudioStep state={state} onUpdate={updateState} />
      case "review":
        return <ReviewStep state={state} analysis={analysis} />
      case "generating":
        return <GeneratingStep progress={generationProgress} error={error} />
      default:
        return null
    }
  }

  const getStepTitle = () => {
    switch (state.currentStep) {
      case "template":
        return "Выбор шаблона"
      case "style":
        return "Стиль и жанр"
      case "narrative":
        return "Структура повествования"
      case "characters":
        return "Персонажи и диалоги"
      case "audio":
        return "Аудио и озвучка"
      case "review":
        return "Проверка параметров"
      case "generating":
        return "Генерация скрипта"
      default:
        return "Мастер генерации"
    }
  }

  return (
    <div className={cn("generation-wizard h-full flex flex-col", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <Wand2 className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Мастер генерации скрипта</h1>
            <p className="text-sm text-muted-foreground">{getStepTitle()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state.currentStep !== "generating" && (
            <Button variant="ghost" onClick={onCancel || onClose}>
              Отмена
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      {state.currentStep !== "generating" && (
        <div className="px-6 py-4 border-b bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Шаг {currentStepIndex + 1} из {STEP_ORDER.length - 1}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStepIndex / (STEP_ORDER.length - 2)) * 100)}%
            </span>
          </div>
          <Progress value={(currentStepIndex / (STEP_ORDER.length - 2)) * 100} className="h-2" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">{renderStepContent()}</div>

      {/* Navigation */}
      {state.currentStep !== "generating" && (
        <div className="flex items-center justify-between p-6 border-t">
          <Button variant="outline" onClick={goBack} disabled={isFirstStep}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>

          <div className="flex items-center gap-2">
            {state.currentStep === "review" ? (
              <Button onClick={handleGenerate} disabled={!canProceed || !analysis}>
                <Sparkles className="w-4 h-4 mr-2" />
                Создать скрипт
              </Button>
            ) : (
              <Button onClick={goNext} disabled={!canProceed}>
                Далее
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Step Components
interface TemplateStepProps {
  templates: ScriptTemplate[]
  selectedTemplate?: ScriptTemplate
  onSelect: (template: ScriptTemplate) => void
}

const TemplateStep: FC<TemplateStepProps> = ({ templates, selectedTemplate, onSelect }) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Выберите тип скрипта</h2>
          <p className="text-sm text-muted-foreground">
            Выберите подходящий шаблон для вашего видео. Каждый шаблон настроен под определённый тип контента.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                selectedTemplate?.id === template.id && "ring-2 ring-primary border-primary",
              )}
              onClick={() => onSelect(template)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                <div className="flex flex-wrap gap-1">
                  {template.examples?.map((example) => (
                    <Badge key={example} variant="secondary" className="text-xs">
                      {example}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

interface StyleStepProps {
  state: WizardState
  onUpdate: (updates: Partial<WizardState>) => void
}

const StyleStep: FC<StyleStepProps> = ({ state, onUpdate }) => {
  const genreOptions = [
    { value: Genre.ACTION, label: "Экшен" },
    { value: Genre.COMEDY, label: "Комедия" },
    { value: Genre.DRAMA, label: "Драма" },
    { value: Genre.DOCUMENTARY, label: "Документальный" },
    { value: Genre.EDUCATIONAL, label: "Образовательный" },
    { value: Genre.LIFESTYLE, label: "Лайфстайл" },
    { value: Genre.TRAVEL, label: "Путешествия" },
    { value: Genre.TECH, label: "Технологии" },
    { value: Genre.FOOD, label: "Еда" },
    { value: Genre.FITNESS, label: "Фитнес" },
    { value: Genre.GENERAL, label: "Общий" },
  ]

  const visualStyleOptions = [
    { value: VisualStyle.CINEMATIC, label: "Кинематографический" },
    { value: VisualStyle.DOCUMENTARY, label: "Документальный" },
    { value: VisualStyle.DYNAMIC, label: "Динамичный" },
    { value: VisualStyle.MINIMALIST, label: "Минималистичный" },
    { value: VisualStyle.ARTISTIC, label: "Художественный" },
    { value: VisualStyle.REALISTIC, label: "Реалистичный" },
  ]

  const emotionOptions = [
    { value: Emotion.HAPPY, label: "Радостный" },
    { value: Emotion.CALM, label: "Спокойный" },
    { value: Emotion.EXCITED, label: "Возбуждённый" },
    { value: Emotion.INSPIRING, label: "Вдохновляющий" },
    { value: Emotion.DRAMATIC, label: "Драматичный" },
    { value: Emotion.COMEDIC, label: "Комичный" },
    { value: Emotion.MYSTERIOUS, label: "Таинственный" },
    { value: Emotion.ROMANTIC, label: "Романтичный" },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Стиль и настроение</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Настройте визуальный стиль и эмоциональный тон вашего видео.
          </p>
        </div>

        {/* Genre Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Жанр</Label>
          <div className="flex flex-wrap gap-2">
            {genreOptions.map((option) => (
              <Badge
                key={option.value}
                variant={state.genre.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  const newGenres = state.genre.includes(option.value)
                    ? state.genre.filter((g) => g !== option.value)
                    : [...state.genre, option.value]
                  onUpdate({ genre: newGenres })
                }}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Visual Style */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Визуальный стиль</Label>
          <Select
            value={state.style.visual}
            onValueChange={(value) =>
              onUpdate({
                style: {
                  ...state.style,
                  visual: value as VisualStyle,
                },
              })
            }
          >
            <SelectTrigger data-testid="visual-style-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visualStyleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Emotional Tone */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Эмоциональный тон</Label>
          <Select
            value={state.tone.primary}
            onValueChange={(value) =>
              onUpdate({
                tone: {
                  ...state.tone,
                  primary: value as Emotion,
                },
              })
            }
          >
            <SelectTrigger data-testid="emotional-tone-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {emotionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tone Intensity */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Интенсивность тона</Label>
          <div className="px-3">
            <Slider
              value={[state.tone.intensity * 100]}
              onValueChange={([value]) =>
                onUpdate({
                  tone: {
                    ...state.tone,
                    intensity: value / 100,
                  },
                })
              }
              max={100}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Слабая</span>
              <span>Сильная</span>
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="space-y-3">
          <Label htmlFor="audience" className="text-sm font-medium">
            Целевая аудитория
          </Label>
          <Input
            id="audience"
            value={state.targetAudience}
            onChange={(e) => onUpdate({ targetAudience: e.target.value })}
            placeholder="Например: Молодые люди 18-25 лет"
          />
        </div>
      </div>
    </ScrollArea>
  )
}

const NarrativeStep: FC<StyleStepProps> = ({ state, onUpdate }) => {
  const narrativeTypeOptions = [
    {
      value: NarrativeType.THREE_ACT,
      label: "Трёхактная структура",
      description: "Классическая структура: завязка, развитие, развязка",
    },
    {
      value: NarrativeType.FIVE_ACT,
      label: "Пятиактная структура",
      description: "Расширенная структура для сложных историй",
    },
    {
      value: NarrativeType.HEROS_JOURNEY,
      label: "Путешествие героя",
      description: "Мономиф: вызов, путешествие, возвращение",
    },
    {
      value: NarrativeType.LINEAR,
      label: "Линейное повествование",
      description: "Прямая хронологическая последовательность",
    },
    {
      value: NarrativeType.NONLINEAR,
      label: "Нелинейное повествование",
      description: "Фрагментарная структура с переходами во времени",
    },
    { value: NarrativeType.EPISODIC, label: "Эпизодическая структура", description: "Серия связанных эпизодов" },
  ]

  const narrativeStyleOptions = [
    { value: NarrativeStyle.LINEAR, label: "Линейный" },
    { value: NarrativeStyle.NONLINEAR, label: "Нелинейный" },
    { value: NarrativeStyle.MONTAGE, label: "Монтажный" },
    { value: NarrativeStyle.PARALLEL, label: "Параллельный" },
    { value: NarrativeStyle.STREAM_OF_CONSCIOUSNESS, label: "Поток сознания" },
  ]

  const pacingOptions = [
    { value: PaceType.SLOW, label: "Медленный", description: "Спокойное, размеренное повествование" },
    { value: PaceType.MODERATE, label: "Умеренный", description: "Сбалансированный темп" },
    { value: PaceType.FAST, label: "Быстрый", description: "Динамичное, энергичное повествование" },
    { value: PaceType.VARIABLE, label: "Переменный", description: "Изменяющийся темп в зависимости от сцены" },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Структура повествования</h2>
          <p className="text-sm text-muted-foreground mb-6">Выберите, как будет организована ваша история.</p>
        </div>

        {/* Narrative Structure */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Тип структуры</Label>
          <div className="grid gap-3">
            {narrativeTypeOptions.map((option) => (
              <Card
                key={option.value}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-sm p-4",
                  state.narrativeStructure === option.value && "ring-2 ring-primary border-primary",
                )}
                onClick={() => onUpdate({ narrativeStructure: option.value })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {state.narrativeStructure === option.value && <CheckCircle className="w-4 h-4 text-primary" />}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Narrative Style */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Стиль повествования</Label>
          <Select
            value={state.style.narrative}
            onValueChange={(value) =>
              onUpdate({
                style: {
                  ...state.style,
                  narrative: value as NarrativeStyle,
                },
              })
            }
          >
            <SelectTrigger data-testid="narrative-style-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {narrativeStyleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Pacing */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Темп повествования</Label>
          <div className="grid gap-2">
            {pacingOptions.map((option) => (
              <Card
                key={option.value}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-sm p-3",
                  state.pacing === option.value && "ring-2 ring-primary border-primary",
                )}
                onClick={() => onUpdate({ pacing: option.value })}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {state.pacing === option.value && <CheckCircle className="w-4 h-4 text-primary" />}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

const CharactersStep: FC<StyleStepProps> = ({ state, onUpdate }) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Персонажи и диалоги</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Настройте параметры персонажей и диалогов в вашем скрипте.
          </p>
        </div>

        {/* Include Dialogue */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Включить диалоги</Label>
            <p className="text-xs text-muted-foreground">Добавить разговоры между персонажами</p>
          </div>
          <Switch
            checked={state.includeDialogue}
            onCheckedChange={(checked) => onUpdate({ includeDialogue: checked })}
          />
        </div>

        {/* Character Count */}
        {state.includeDialogue && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Количество персонажей</Label>
            <div className="px-3">
              <Slider
                value={[state.characterCount]}
                onValueChange={([value]) => onUpdate({ characterCount: value })}
                min={1}
                max={8}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="font-medium">{state.characterCount}</span>
                <span>8</span>
              </div>
            </div>
          </div>
        )}

        {/* Include Narrator */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Включить рассказчика</Label>
            <p className="text-xs text-muted-foreground">Добавить голос повествователя</p>
          </div>
          <Switch
            checked={state.includeNarrator}
            onCheckedChange={(checked) => onUpdate({ includeNarrator: checked })}
          />
        </div>

        {/* Custom Prompt */}
        <div className="space-y-3">
          <Label htmlFor="prompt" className="text-sm font-medium">
            Дополнительные указания (необязательно)
          </Label>
          <Textarea
            id="prompt"
            value={state.customPrompt}
            onChange={(e) => onUpdate({ customPrompt: e.target.value })}
            placeholder="Опишите особые требования к персонажам, их характеры, отношения..."
            rows={4}
          />
        </div>
      </div>
    </ScrollArea>
  )
}

const AudioStep: FC<StyleStepProps> = ({ state, onUpdate }) => {
  const voiceoverStyleOptions = [
    { value: "narrative", label: "Повествовательный" },
    { value: "documentary", label: "Документальный" },
    { value: "conversational", label: "Разговорный" },
    { value: "dramatic", label: "Драматичный" },
    { value: "instructional", label: "Обучающий" },
    { value: "poetic", label: "Поэтический" },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Аудио и озвучка</h2>
          <p className="text-sm text-muted-foreground mb-6">Настройте параметры звукового сопровождения.</p>
        </div>

        {/* Include Voiceover */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">Включить закадровый голос</Label>
            <p className="text-xs text-muted-foreground">Добавить голос за кадром для повествования</p>
          </div>
          <Switch
            checked={state.includeVoiceover}
            onCheckedChange={(checked) => onUpdate({ includeVoiceover: checked })}
          />
        </div>

        {/* Voiceover Style */}
        {state.includeVoiceover && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Стиль озвучки</Label>
            <Select value={state.voiceoverStyle} onValueChange={(value) => onUpdate({ voiceoverStyle: value })}>
              <SelectTrigger data-testid="voiceover-style-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {voiceoverStyleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Duration */}
        <div className="space-y-3">
          <Label htmlFor="duration" className="text-sm font-medium">
            Целевая длительность (секунды)
          </Label>
          <Input
            id="duration"
            type="number"
            value={state.duration || ""}
            onChange={(e) => onUpdate({ duration: e.target.value ? Number.parseInt(e.target.value, 10) : undefined })}
            placeholder="Оставьте пустым для автоматического определения"
            min="10"
            max="3600"
          />
        </div>
      </div>
    </ScrollArea>
  )
}

interface ReviewStepProps {
  state: WizardState
  analysis?: UnifiedContentAnalysis | null
}

const ReviewStep: FC<ReviewStepProps> = ({ state, analysis }) => {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Проверка параметров</h2>
          <p className="text-sm text-muted-foreground mb-6">Проверьте все настройки перед генерацией скрипта.</p>
        </div>

        {/* Template */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Шаблон
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{state.template?.name || "Не выбран"}</p>
            <p className="text-sm text-muted-foreground">{state.template?.description}</p>
          </CardContent>
        </Card>

        {/* Style & Genre */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Стиль и жанр
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Визуальный стиль:</span>
              <span className="text-sm font-medium">{state.style.visual}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Жанр:</span>
              <div className="flex flex-wrap gap-1">
                {state.genre.map((g) => (
                  <Badge key={g} variant="secondary" className="text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Тон:</span>
              <span className="text-sm font-medium">{state.tone.primary}</span>
            </div>
          </CardContent>
        </Card>

        {/* Characters & Audio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Персонажи и аудио
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Диалоги:</span>
              <Badge variant={state.includeDialogue ? "default" : "secondary"}>
                {state.includeDialogue ? "Включены" : "Отключены"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Закадровый голос:</span>
              <Badge variant={state.includeVoiceover ? "default" : "secondary"}>
                {state.includeVoiceover ? "Включён" : "Отключён"}
              </Badge>
            </div>
            {state.includeDialogue && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Персонажей:</span>
                <span className="text-sm font-medium">{state.characterCount}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Duration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Длительность
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Целевая длительность:</span>
              <span className="text-sm font-medium">{state.duration ? `${state.duration} сек` : "Авто"}</span>
            </div>
            {analysis && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Длительность медиа:</span>
                <span className="text-sm font-medium">{Math.round(analysis.mediaFile.duration)} сек</span>
              </div>
            )}
          </CardContent>
        </Card>

        {state.customPrompt && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Дополнительные указания</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{state.customPrompt}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}

interface GeneratingStepProps {
  progress: number
  error?: string | null
}

const GeneratingStep: FC<GeneratingStepProps> = ({ progress, error }) => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        {error ? (
          <>
            <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ошибка генерации</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Генерация скрипта</h3>
            <p className="text-sm text-muted-foreground mb-4">
              ИИ создаёт ваш скрипт на основе анализа и параметров...
            </p>
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">{progress}% завершено</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
