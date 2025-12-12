# ESTA: Emergent Structured Thinking Architecture

Запусти архитектуру ESTA (Всплывающего Структурного Мышления) для анализа задачи.

## Инструкция

Используй ruv-swarm MCP для запуска 6 специализированных агентов в цепочке:

### Шаг 1: Инициализация роя
```
Вызови mcp__ruv-swarm__swarm_init с topology: "hierarchical", maxAgents: 6, strategy: "specialized"
```

### Шаг 2: Создай агентов ESTA

1. **Context Decomposer** (analyst):
   - capabilities: ["decomposition", "assumption_detection", "entropy_identification"]
   - cognitivePattern: "divergent"

2. **Entropy Tracker** (analyst):
   - capabilities: ["uncertainty_measurement", "conflict_detection", "gap_analysis"]
   - cognitivePattern: "systems"

3. **Semantic Attractor** (researcher):
   - capabilities: ["pattern_recognition", "invariant_detection", "stability_analysis"]
   - cognitivePattern: "convergent"

4. **Recursive Loop** (optimizer):
   - capabilities: ["solution_refinement", "restructuring", "comparison"]
   - cognitivePattern: "adaptive"

5. **Observer Mode** (analyst):
   - capabilities: ["meta_analysis", "bias_detection", "perspective_finding"]
   - cognitivePattern: "critical"

6. **Final Synthesizer** (coordinator):
   - capabilities: ["synthesis", "entropy_minimization", "final_assembly"]
   - cognitivePattern: "convergent"

### Шаг 3: Запусти workflow

Создай DAA workflow с последовательными шагами:
1. context_decomposition → 2. entropy_tracking → 3. attractor_finding → 4. recursive_refinement → 5. meta_observation → 6. final_synthesis

### Шаг 4: Обработай задачу пользователя

Передай задачу через task_orchestrate со стратегией "sequential".

---

## Формат вывода каждого агента

### Context Decomposer:
```json
{
  "core_question": "центральный вопрос",
  "subquestions": ["подзадача 1", "подзадача 2"],
  "implicit_assumptions": ["скрытое допущение 1"],
  "entropy_sources": ["источник неопределённости 1"]
}
```

### Entropy Tracker:
```json
{
  "entropy_score": 0-100,
  "unstable_fragments": ["нестабильный элемент"],
  "info_gaps": ["информационный пробел"],
  "conflict_map": {"area": "описание конфликта"}
}
```

### Semantic Attractor:
```json
{
  "stable_center": "центральный инвариант",
  "invariant_rule": "устойчивое правило",
  "attractor_map": ["связь 1", "связь 2"]
}
```

### Observer Mode:
```json
{
  "meta_summary": "анализ процесса мышления",
  "biases_detected": ["когнитивное искажение"],
  "missing_perspectives": ["упущенная перспектива"],
  "observer_comment": "комментарий наблюдателя"
}
```

---

## Задача для анализа

$ARGUMENTS
