#!/bin/bash
# scripts/find-duplicates.sh
# Скрипт для поиска дублированного кода в AI модулях

echo "🔍 Поиск дублированных AI провайдеров..."
echo "================================================"
find src -name "*.ts" -exec grep -l "ClaudeProvider\|OpenAIProvider\|DeepSeekProvider\|OllamaProvider\|GrokProvider" {} \;
echo ""

echo "🔍 Поиск дублированных типов анализа..."
echo "================================================"
find src -name "*.ts" -exec grep -l "UnifiedContentAnalysis\|VideoAnalysisResult\|AudioAnalysisResult" {} \;
echo ""

echo "🔍 Поиск дублированных Whisper сервисов..."
echo "================================================"
find src -name "*.ts" -exec grep -l "WhisperService\|TranscriptionService" {} \;
echo ""

echo "🔍 Поиск дублированных интерфейсов анализа..."
echo "================================================"
find src -name "*.ts" -exec grep -l "IVisionService\|IFFmpegAnalysisService\|IContentAnalysisService" {} \;
echo ""

echo "🔍 Поиск циклических импортов..."
echo "================================================"
find src/features -name "*.ts" -exec grep -l "from.*domains/ai-" {} \;
echo ""

echo "🔍 Поиск устаревших импортов AI Chat..."
echo "================================================"
find src -name "*.ts" -exec grep -l "from.*ai-chat.*services" {} \;
echo ""

echo "🔍 Поиск устаревших импортов AI Content Intelligence..."
echo "================================================"
find src -name "*.ts" -exec grep -l "from.*ai-content-intelligence.*shared" {} \;
echo ""

echo "📊 Статистика дублирования:"
echo "================================================"
echo "AI провайдеры: $(find src -name "*.ts" -exec grep -l "ClaudeProvider\|OpenAIProvider" {} \; | wc -l) файлов"
echo "Типы анализа: $(find src -name "*.ts" -exec grep -l "UnifiedContentAnalysis\|VideoAnalysisResult" {} \; | wc -l) файлов"
echo "Whisper сервисы: $(find src -name "*.ts" -exec grep -l "WhisperService\|TranscriptionService" {} \; | wc -l) файлов"
echo "Интерфейсы анализа: $(find src -name "*.ts" -exec grep -l "IVisionService\|IFFmpegAnalysisService" {} \; | wc -l) файлов"
echo ""

echo "✅ Анализ завершен!"
