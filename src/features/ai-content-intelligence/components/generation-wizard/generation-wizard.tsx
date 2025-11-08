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
import type {
  EmotionalTone,
  GeneratedScript,
  ScriptGenerationParams,
} from "@/domains/ai-services/services/script-generation/types"
import { Emotion, NarrativeType, PaceType } from "@/domains/ai-services/services/script-generation/types"
import type { UnifiedContentAnalysis } from "@/domains/ai-services/types/unified-analysis"
import { Genre } from "@/domains/shared/types/ai-tools/content-analysis"
import {
  EditingStyle,
  NarrativeStyle,
  ScriptStyle,
  VisualStyle,
} from "@/domains/shared/types/ai-tools/script-generation"
import { createLogger } from "@/lib/tauri-logger"
import { cn } from "@/lib/utils"
import { useAIIntelligence } from "../../hooks/use-ai-intelligence"

const logger = createLogger({ module: "GenerationWizard" })

// Local ScriptTemplate definition for wizard
interface ScriptTemplate {
  id: string
  name: string
  description: string
  narrativeType: NarrativeType
  defaultStyle: {
    narrative: string
    visual: string
    pacing: string
  }
  structure: {
    acts: Array<{
      name: string
      description: string
      percentageOfTotal: number
      requiredElements: string[]
    }>
    requiredScenes: Array<{
      type: string
      purpose: string
      suggestedPlacement: string
      duration: { min: number; max: number }
    }>
    pacing: {
      pattern: string
      keyMoments: Array<{
        percentage: number
        intensity: number
        description: string
      }>
    }
  }
}

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
    narrativeType: NarrativeType.THREE_ACT,
    defaultStyle: {
      narrative: "dramatic",
      visual: "cinematic",
      pacing: "medium",
    },
    structure: {
      acts: [
        {
          name: "Завязка",
          description: "Установка персонажей и конфликта",
          percentageOfTotal: 25,
          requiredElements: ["exposition", "inciting_incident"],
        },
        {
          name: "Развитие",
          description: "Развитие конфликта и препятствия",
          percentageOfTotal: 50,
          requiredElements: ["obstacles", "midpoint"],
        },
        {
          name: "Развязка",
          description: "Разрешение конфликта",
          percentageOfTotal: 25,
          requiredElements: ["climax", "resolution"],
        },
      ],
      requiredScenes: [
        {
          type: "opening",
          purpose: "Hook the audience",
          suggestedPlacement: "beginning",
          duration: { min: 30, max: 120 },
        },
      ],
      pacing: {
        pattern: "building",
        keyMoments: [
          { percentage: 10, intensity: 0.3, description: "Hook" },
          { percentage: 75, intensity: 0.9, description: "Climax" },
        ],
      },
    },
  },
  {
    id: "documentary",
    name: "Документальный",
    description: "Информационный документальный формат с закадровым голосом",
    narrativeType: NarrativeType.THREE_ACT,
    defaultStyle: {
      narrative: "documentary",
      visual: "cinematic",
      pacing: "medium",
    },
    structure: {
      acts: [
        {
          name: "Введение",
          description: "Представление темы",
          percentageOfTotal: 20,
          requiredElements: ["introduction"],
        },
        {
          name: "Исследование",
          description: "Раскрытие темы",
          percentageOfTotal: 60,
          requiredElements: ["exploration"],
        },
        { name: "Заключение", description: "Выводы", percentageOfTotal: 20, requiredElements: ["conclusion"] },
      ],
      requiredScenes: [
        {
          type: "introduction",
          purpose: "Introduce topic",
          suggestedPlacement: "beginning",
          duration: { min: 20, max: 60 },
        },
      ],
      pacing: {
        pattern: "steady",
        keyMoments: [
          { percentage: 10, intensity: 0.3, description: "Introduction" },
          { percentage: 90, intensity: 0.5, description: "Conclusion" },
        ],
      },
    },
  },
  {
    id: "social-media",
    name: "Социальные сети",
    description: "Короткий динамичный контент для соцсетей",
    narrativeType: NarrativeType.NONLINEAR,
    defaultStyle: {
      narrative: "informative",
      visual: "dynamic",
      pacing: "fast",
    },
    structure: {
      acts: [
        { name: "Хук", description: "Привлечение внимания", percentageOfTotal: 15, requiredElements: ["hook"] },
        { name: "Контент", description: "Основное сообщение", percentageOfTotal: 70, requiredElements: ["content"] },
        { name: "CTA", description: "Призыв к действию", percentageOfTotal: 15, requiredElements: ["cta"] },
      ],
      requiredScenes: [
        { type: "hook", purpose: "Grab attention", suggestedPlacement: "beginning", duration: { min: 3, max: 10 } },
      ],
      pacing: {
        pattern: "episodic",
        keyMoments: [
          { percentage: 5, intensity: 0.9, description: "Hook" },
          { percentage: 95, intensity: 0.7, description: "CTA" },
        ],
      },
    },
  },
  {
    id: "commercial",
    name: "Коммерческий",
    description: "Рекламный ролик с фокусом на продукт",
    narrativeType: NarrativeType.THREE_ACT,
    defaultStyle: {
      narrative: "dramatic",
      visual: "dynamic",
      pacing: "fast",
    },
    structure: {
      acts: [
        {
          name: "Проблема",
          description: "Представление потребности",
          percentageOfTotal: 30,
          requiredElements: ["problem"],
        },
        {
          name: "Решение",
          description: "Демонстрация продукта",
          percentageOfTotal: 50,
          requiredElements: ["solution"],
        },
        { name: "Результат", description: "Призыв к покупке", percentageOfTotal: 20, requiredElements: ["cta"] },
      ],
      requiredScenes: [
        { type: "problem", purpose: "Show pain point", suggestedPlacement: "beginning", duration: { min: 5, max: 15 } },
      ],
      pacing: {
        pattern: "building",
        keyMoments: [
          { percentage: 30, intensity: 0.5, description: "Problem" },
          { percentage: 90, intensity: 0.9, description: "CTA" },
        ],
      },
    },
  },
  {
    id: "vlog",
    name: "Видеоблог",
    description: "Личный видеоблог с естественным повествованием",
    narrativeType: NarrativeType.EPISODIC,
    defaultStyle: {
      narrative: "informative",
      visual: "minimal",
      pacing: "medium",
    },
    structure: {
      acts: [
        { name: "Введение", description: "Приветствие и планы", percentageOfTotal: 15, requiredElements: ["greeting"] },
        {
          name: "Активность",
          description: "Основные события",
          percentageOfTotal: 70,
          requiredElements: ["activities"],
        },
        { name: "Заключение", description: "Выводы и прощание", percentageOfTotal: 15, requiredElements: ["outro"] },
      ],
      requiredScenes: [
        {
          type: "greeting",
          purpose: "Introduce vlog",
          suggestedPlacement: "beginning",
          duration: { min: 10, max: 30 },
        },
      ],
      pacing: {
        pattern: "episodic",
        keyMoments: [
          { percentage: 10, intensity: 0.5, description: "Greeting" },
          { percentage: 90, intensity: 0.4, description: "Outro" },
        ],
      },
    },
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
        // Выбираем новый шаблон и применяем его настройки по умолчанию
        updateState({
          template,
          narrativeStructure: template.narrativeType,
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
        narrativeStructure: state.narrativeStructure,
        genre: state.genre.map((g) => g as string),
        tone: state.tone,
        style: {
          narrative:
            state.style.narrative === NarrativeStyle.LINEAR
              ? "documentary"
              : state.style.narrative === NarrativeStyle.NONLINEAR
                ? "artistic"
                : "dramatic",
          visual:
            state.style.visual === VisualStyle.CINEMATIC
              ? "cinematic"
              : state.style.visual === VisualStyle.MINIMALIST
                ? "minimal"
                : "dynamic",
          pacing:
            state.pacing === PaceType.SLOW
              ? "slow"
              : state.pacing === PaceType.FAST
                ? "fast"
                : state.pacing === PaceType.VARIABLE
                  ? "variable"
                  : "medium",
        },
        includeDialogue: state.includeDialogue,
        includeVoiceover: state.includeVoiceover,
        targetDuration: state.duration || analysis.mediaFile.duration,
        adaptToContent: true,
      }

      const script = await generateScript(analysis, params)
      onGenerate?.(script)
      onClose?.()
    } catch (error) {
      logger.error("Script generation failed:", error as any)
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
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
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
    { value: Emotion.INSPIRATIONAL, label: "Вдохновляющий" },
    { value: Emotion.SAD, label: "Грустный" },
    { value: Emotion.ANGRY, label: "Гневный" },
    { value: Emotion.SURPRISED, label: "Удивлённый" },
    { value: Emotion.NOSTALGIC, label: "Ностальгический" },
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
      value: NarrativeType.NONLINEAR,
      label: "Нелинейное повествование",
      description: "Фрагментарная структура с переходами во времени",
    },
    {
      value: NarrativeType.CIRCULAR,
      label: "Циклическое повествование",
      description: "История возвращается к начальной точке",
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
