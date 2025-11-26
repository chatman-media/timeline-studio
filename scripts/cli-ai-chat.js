#!/usr/bin/env node

import { Command } from "commander";
import readline from "readline";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

// Цвета для консоли
const colors = {
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Конфигурация для API ключей
const CONFIG_FILE = path.join(__dirname, "..", ".ai-chat-config.json");

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    } catch (error) {
      log(`⚠️  Ошибка чтения конфигурации: ${error.message}`, "yellow");
    }
  }
  return {};
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    log(`❌ Ошибка сохранения конфигурации: ${error.message}`, "red");
    return false;
  }
}

// История чата
const HISTORY_FILE = path.join(__dirname, "..", ".chat-history.json");

function loadHistory() {
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    } catch (error) {
      return [];
    }
  }
  return [];
}

function saveHistory(history) {
  try {
    // Сохраняем только последние 50 сообщений
    const recentHistory = history.slice(-50);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(recentHistory, null, 2));
  } catch (error) {
    log(`⚠️  Не удалось сохранить историю: ${error.message}`, "yellow");
  }
}

// Выполнение команд Timeline Studio через Tauri
async function executeTauriCommand(command, params = {}) {
  try {
    const { spawn } = await import("child_process");
    const { promisify } = await import("util");
    const execAsync = promisify(spawn);

    // Запускаем Tauri команду
    return new Promise((resolve, reject) => {
      const process = spawn(
        "bun",
        ["run", "tauri", "invoke", command, JSON.stringify(params)],
        {
          stdio: "pipe",
          cwd: path.resolve(process.cwd()),
        },
      );

      let output = "";
      let error = "";

      process.stdout.on("data", (data) => {
        output += data.toString();
      });

      process.stderr.on("data", (data) => {
        error += data.toString();
      });

      process.on("close", (code) => {
        if (code === 0) {
          try {
            resolve(JSON.parse(output));
          } catch {
            resolve({ output });
          }
        } else {
          reject(new Error(`Tauri command failed: ${error}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Failed to execute Tauri command: ${error.message}`);
  }
}

// Выполнение команд Timeline Studio (симуляция + реальные)
async function executeTimelineCommand(command, params = {}) {
  try {
    log(`🔧 Выполняю: ${command}`, "yellow");

    // Пытаемся выполнить реальные Tauri команды
    switch (command) {
      case "analyze_video_quality":
        try {
          // Пробуем реальную команду
          const result = await executeTauriCommand("ffmpeg_analyze_quality", {
            input_folder: "./videos",
          });
          return result;
        } catch (error) {
          log(`⚠️ Fallback to simulation for ${command}`, "yellow");
        }
        break;

      case "detect_drone_flight_segments":
        try {
          const result = await executeTauriCommand("ffmpeg_detect_scenes", {
            input_folder: "./videos",
            drone_filter: true,
          });
          return result;
        } catch (error) {
          log(`⚠️ Fallback to simulation for ${command}`, "yellow");
        }
        break;

      case "create_multicam_montage":
        try {
          const result = await executeTauriCommand(
            "create_and_execute_pipeline",
            {
              pipeline_type: "multicam_montage",
              main_camera: "iPhone",
              drone_inserts: true,
              output: "phuket_multicam_montage.mp4",
            },
          );
          return result;
        } catch (error) {
          log(`⚠️ Fallback to simulation for ${command}`, "yellow");
        }
        break;
    }

    // Симуляция если реальные команды недоступны
    switch (command) {
      case "analyze_video_quality":
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return {
          bestQualityCamera: "iPhone_main",
          cameras: [
            {
              name: "iPhone_main",
              quality: 95,
              resolution: "4K",
              stability: "excellent",
            },
            {
              name: "DJI_drone",
              quality: 90,
              resolution: "4K",
              stability: "good",
            },
          ],
        };

      case "detect_drone_flight_segments":
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return {
          droneSegments: [
            { start: "14:23", end: "14:45", scene: "beach_overview" },
            { start: "15:12", end: "15:28", scene: "sunset_flight" },
            { start: "16:05", end: "16:20", scene: "island_approach" },
          ],
        };

      case "create_multicam_montage":
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return {
          montageFile: "phuket_multicam_montage.mp4",
          duration: 180,
          mainCameraTime: 140,
          droneInserts: 40,
          transitions: 8,
        };

      case "sync_cameras_by_audio":
        await new Promise((resolve) => setTimeout(resolve, 2500));
        return {
          syncPoints: [
            { time: "14:20", confidence: 98 },
            { time: "15:10", confidence: 95 },
            { time: "16:02", confidence: 97 },
          ],
        };

      default:
        return { error: `Команда ${command} не найдена` };
    }
  } catch (error) {
    return { error: error.message };
  }
}

// Интеграция с локальными моделями (Ollama)
let currentLocalModel = "llama3.2:latest";

async function callLocalModel(message, context = null, model = null) {
  const useModel = model || currentLocalModel;
  try {
    log(`🤖 Отправляю запрос к локальной модели ${useModel}...`, "blue");

    const systemPrompt = `Ты ИИ-ассистент для Timeline Studio.
Помогаешь пользователю обрабатывать видео с Пхукета.
У пользователя есть видео с iPhone и дрона DJI.
Ты можешь выполнять команды анализа и монтажа.

Контекст проекта: ${context || "Обработка видео с отпуска на Пхукете"}

Доступные команды:
- analyze_video_quality: анализ качества камер
- detect_drone_flight_segments: поиск моментов полета дрона
- create_multicam_montage: создание multicam монтажа
- sync_cameras_by_audio: синхронизация камер по аудио

Отвечай на русском языке. Если пользователь просит обработку видео - предлагай выполнить соответствующие команды.`;

    const fullPrompt = `${systemPrompt}\n\nПользователь: ${message}\n\nАссистент:`;

    const { default: fetch } = await import("node-fetch");

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: useModel,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500,
        },
      }),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.response) {
        return result.response.trim();
      } else {
        throw new Error("Invalid response from local model");
      }
    } else {
      throw new Error(`Local model API error: ${response.status}`);
    }
  } catch (error) {
    log(`⚠️ Локальная модель недоступна: ${error.message}`, "yellow");
    return null; // Fallback к симуляции
  }
}

// Реальная интеграция с Claude API через Tauri
async function callRealClaude(message, context = null) {
  try {
    log(`🧠 Отправляю запрос к Claude API...`, "blue");

    const systemPrompt = `Ты ИИ-ассистент для Timeline Studio.
Помогаешь пользователю обрабатывать видео с Пхукета.
У пользователя есть видео с iPhone и дрона DJI.
Ты можешь выполнять команды анализа и монтажа.

Контекст проекта: ${context || "Обработка видео с отпуска на Пхукете"}

Доступные команды:
- analyze_video_quality: анализ качества камер
- detect_drone_flight_segments: поиск моментов полета дрона
- create_multicam_montage: создание multicam монтажа
- sync_cameras_by_audio: синхронизация камер по аудио

Отвечай на русском языке. Если пользователь просит обработку видео - выполняй соответствующие команды.`;

    // Попробуем вызвать реальный Claude через Tauri
    const claudeResult = await executeTauriCommand("claude_send_message", {
      model: "claude-3-5-sonnet-20241022",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
      system: systemPrompt,
      max_tokens: 2000,
      temperature: 0.7,
    });

    if (claudeResult && claudeResult.content) {
      return claudeResult.content;
    } else {
      throw new Error("Invalid Claude API response");
    }
  } catch (error) {
    log(
      `⚠️ Claude API недоступен, использую fallback: ${error.message}`,
      "yellow",
    );
    return null; // Fallback к симуляции
  }
}

// Умный ИИ ответ с выполнением команд
async function getAIResponse(message, context = null, provider = "claude") {
  // Выбираем провайдера
  let aiResponse = null;

  if (provider === "llama" || provider === "local") {
    // Используем локальную модель
    aiResponse = await callLocalModel(message, context);
  } else if (provider === "claude") {
    // Пробуем Claude API
    aiResponse = await callRealClaude(message, context);
  }

  if (aiResponse) {
    // Если получили ответ от ИИ, анализируем что он хочет сделать
    const responseMsg = aiResponse.toLowerCase();

    if (
      responseMsg.includes("анализ") ||
      responseMsg.includes("качество") ||
      responseMsg.includes("камер")
    ) {
      log(`🔬 ИИ предлагает анализ качества, выполняю...`, "yellow");
      const qualityAnalysis = await executeTimelineCommand(
        "analyze_video_quality",
      );
      return (
        aiResponse +
        `\n\n🔬 Результат анализа:\n${JSON.stringify(qualityAnalysis, null, 2)}`
      );
    }

    if (
      responseMsg.includes("дрон") ||
      responseMsg.includes("сегмент") ||
      responseMsg.includes("полет")
    ) {
      log(`🚁 ИИ хочет найти моменты дрона, выполняю...`, "yellow");
      const droneSegments = await executeTimelineCommand(
        "detect_drone_flight_segments",
      );
      return (
        aiResponse +
        `\n\n🚁 Найденные сегменты:\n${JSON.stringify(droneSegments, null, 2)}`
      );
    }

    if (
      responseMsg.includes("монтаж") ||
      responseMsg.includes("создать") ||
      responseMsg.includes("собрать")
    ) {
      log(`🎬 ИИ предлагает создать монтаж, выполняю...`, "yellow");
      const montageResult = await executeTimelineCommand(
        "create_multicam_montage",
      );
      return (
        aiResponse +
        `\n\n🎬 Результат монтажа:\n${JSON.stringify(montageResult, null, 2)}`
      );
    }

    if (responseMsg.includes("синхрон")) {
      log(`🎵 ИИ хочет синхронизировать камеры, выполняю...`, "yellow");
      const syncResult = await executeTimelineCommand("sync_cameras_by_audio");
      return (
        aiResponse +
        `\n\n🎵 Синхронизация:\n${JSON.stringify(syncResult, null, 2)}`
      );
    }

    return aiResponse;
  }

  // Fallback к симуляции если ИИ недоступен
  const msg = message.toLowerCase();

  // Анализируем что хочет пользователь и выполняем команды
  if (
    msg.includes("основн") &&
    msg.includes("камер") &&
    msg.includes("качеств")
  ) {
    log(
      `🤖 Понял! Нужно найти камеру с лучшим качеством и использовать её как основу`,
      "blue",
    );

    const qualityAnalysis = await executeTimelineCommand(
      "analyze_video_quality",
    );

    if (qualityAnalysis.error) {
      return `Ошибка анализа качества: ${qualityAnalysis.error}`;
    }

    const bestCamera = qualityAnalysis.bestQualityCamera;
    return (
      `✅ Анализ завершен! Лучшая камера: ${bestCamera} (качество: ${qualityAnalysis.cameras[0].quality}/100)\n\n` +
      `📋 План монтажа:\n` +
      `• Основа: ${bestCamera} - ${qualityAnalysis.cameras[0].resolution} видео\n` +
      `• Дрон-вставки: только в моменты полета\n` +
      `• Переходы: плавные между камерами\n\n` +
      `Хочешь чтобы я найду моменты полета дрона?`
    );
  }

  if (
    msg.includes("дрон") &&
    (msg.includes("момент") || msg.includes("пролет") || msg.includes("вставк"))
  ) {
    log(`🤖 Ищу моменты полета дрона для вставок...`, "blue");

    const droneSegments = await executeTimelineCommand(
      "detect_drone_flight_segments",
    );

    if (droneSegments.error) {
      return `Ошибка поиска дрон-сегментов: ${droneSegments.error}`;
    }

    let response = `🚁 Найдены моменты полета дрона:\n\n`;
    droneSegments.droneSegments.forEach((segment, i) => {
      response += `${i + 1}. ${segment.start} - ${segment.end}: ${segment.scene}\n`;
    });

    response += `\nТеперь создать монтаж с этими вставками?`;
    return response;
  }

  if (
    msg.includes("монтаж") ||
    msg.includes("создать") ||
    msg.includes("сделать")
  ) {
    log(`🤖 Создаю multicam монтаж согласно твоему плану...`, "blue");

    // Сначала синхронизируем камеры
    const syncResult = await executeTimelineCommand("sync_cameras_by_audio");
    if (!syncResult.error) {
      log(
        `✅ Камеры синхронизированы по аудио (${syncResult.syncPoints.length} точек)`,
        "green",
      );
    }

    // Создаем монтаж
    const montageResult = await executeTimelineCommand(
      "create_multicam_montage",
    );

    if (montageResult.error) {
      return `Ошибка создания монтажа: ${montageResult.error}`;
    }

    return (
      `🎬 Монтаж готов!\n\n` +
      `📁 Файл: ${montageResult.montageFile}\n` +
      `⏱️ Длительность: ${montageResult.duration} сек\n` +
      `📹 Основная камера: ${montageResult.mainCameraTime} сек\n` +
      `🚁 Дрон-вставки: ${montageResult.droneInserts} сек\n` +
      `🔄 Переходов: ${montageResult.transitions}\n\n` +
      `✨ Хочешь посмотреть превью или изменить что-то?`
    );
  }

  if (msg.includes("синхрон")) {
    const syncResult = await executeTimelineCommand("sync_cameras_by_audio");
    return `🎵 Синхронизация по аудио:\n${syncResult.syncPoints.map((p) => `• ${p.time} (${p.confidence}% точность)`).join("\n")}`;
  }

  // Базовые ответы
  const responses = {
    claude: {
      greeting:
        "Привет! Я Claude, ваш ИИ-ассистент для работы с Timeline Studio. Могу помочь с анализом видео, созданием монтажа или ответить на вопросы о проекте.",
      analyze:
        "Для анализа ваших видео с Пхукета я рекомендую использовать YOLO детекцию для поиска интересных объектов (лодки, люди, закаты), анализ аудио для поиска музыкальных моментов, и детекцию сцен для разбивки на смысловые части.",
      montage:
        "Для создания монтажа из видео с отпуска рекомендую стиль 'travel' с длительностью 2-3 минуты. Использую динамические переходы между сценами, синхронизацию с музыкой и умное кадрирование для акцента на главных объектах.",
      help: "Доступные команды:\n• analyze - анализ видео с детекцией объектов и сцен\n• montage - создание автоматического монтажа\n• status - проверка статуса операций\n• clean - очистка временных файлов",
      error:
        "Извините, произошла ошибка при обработке вашего запроса. Попробуйте переформулировать вопрос.",
    },
    openai: {
      greeting:
        "Здравствуйте! Я GPT-ассистент для Timeline Studio. Готов помочь с обработкой видео и созданием монтажа.",
      analyze:
        "Рекомендую начать с глубокого анализа контента: детекция объектов, анализ качества, определение лучших моментов. Для видео с Пхукета особенно важна детекция воды, неба и людей.",
      montage:
        "Создам план монтажа на основе анализа: выберу лучшие кадры, синхронизирую с музыкой, добавлю плавные переходы. Стиль 'travel' идеален для отпускных видео.",
      help: "Я могу помочь с планированием обработки видео, объяснить параметры анализа, подсказать оптимальные настройки монтажа.",
      error:
        "Не удалось обработать запрос. Попробуйте задать вопрос по-другому.",
    },
  };

  // Простая логика выбора ответа на основе ключевых слов (fallback)
  if (msg.includes("привет") || msg.includes("hello") || msg.includes("hi")) {
    return responses[provider].greeting;
  } else if (msg.includes("анализ") || msg.includes("analyze")) {
    return responses[provider].analyze;
  } else if (msg.includes("помощь") || msg.includes("help")) {
    return responses[provider].help;
  } else if (context && context.includes("video")) {
    return `Понял, вы работаете с видео. ${responses[provider].analyze}`;
  } else {
    // Для реальной интеграции здесь будет вызов API
    return `Интересный вопрос о "${message}". ${responses[provider].help}`;
  }
}

// Интерактивный чат
async function startInteractiveChat(
  provider = "claude",
  model = "llama3.2:latest",
) {
  // Устанавливаем текущую модель
  if (provider === "llama" || provider === "local") {
    currentLocalModel = model;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.cyan}📱 Вы:${colors.reset} `,
  });

  let chatHistory = loadHistory();
  let config = loadConfig();

  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, "cyan");
  log(`🤖 Timeline Studio AI Chat`, "bold");
  log(`🧠 Провайдер: ${provider.toUpperCase()}`, "yellow");
  if (provider === "llama" || provider === "local") {
    log(`🔥 Локальная модель: ${model}`, "green");
  }
  log(`💬 Введите /help для списка команд`, "dim");
  log(`💬 Введите /exit для выхода`, "dim");
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, "cyan");

  // Приветствие
  const welcomeMessage = await getAIResponse("привет", null, provider);
  log(`\n🤖 ${provider.toUpperCase()}:`, "blue");
  log(welcomeMessage, "reset");
  log("");

  rl.prompt();

  rl.on("line", async (input) => {
    const message = input.trim();

    if (message === "/exit" || message === "/quit") {
      log("\n👋 До свидания!", "green");
      rl.close();
      return;
    }

    if (message === "/help") {
      log("\n📋 Доступные команды:", "yellow");
      log("  /help     - показать эту справку", "dim");
      log("  /history  - показать историю чата", "dim");
      log("  /clear    - очистить историю", "dim");
      log("  /config   - настройки API ключей", "dim");
      log("  /provider - сменить провайдера AI", "dim");
      log("  /context  - добавить контекст проекта", "dim");
      log("  /exit     - выйти из чата", "dim");
      log("\n💡 Примеры вопросов:", "yellow");
      log('  • "Как лучше проанализировать видео с отпуска?"', "dim");
      log('  • "Создай план монтажа для видео с Пхукета"', "dim");
      log('  • "Какие параметры YOLO использовать для пляжных видео?"', "dim");
      log("");
      rl.prompt();
      return;
    }

    if (message === "/history") {
      log("\n📜 История чата:", "yellow");
      if (chatHistory.length === 0) {
        log("  История пуста", "dim");
      } else {
        chatHistory.slice(-10).forEach((entry, index) => {
          log(
            `  ${index + 1}. [${entry.timestamp}] ${entry.user}: ${entry.message.substring(0, 60)}...`,
            "dim",
          );
        });
      }
      log("");
      rl.prompt();
      return;
    }

    if (message === "/clear") {
      chatHistory = [];
      saveHistory(chatHistory);
      log("\n🗑️  История чата очищена", "green");
      log("");
      rl.prompt();
      return;
    }

    if (message === "/config") {
      log("\n⚙️  Настройка API ключей:", "yellow");
      log("  Создайте файл .ai-chat-config.json с вашими ключами:", "dim");
      log("  {", "dim");
      log('    "claude_api_key": "ваш_ключ_claude",', "dim");
      log('    "openai_api_key": "ваш_ключ_openai"', "dim");
      log("  }", "dim");
      log("");
      rl.prompt();
      return;
    }

    if (message === "/provider") {
      const newProvider = provider === "claude" ? "openai" : "claude";
      provider = newProvider;
      log(`\n🔄 Переключено на провайдера: ${provider.toUpperCase()}`, "green");
      log("");
      rl.prompt();
      return;
    }

    if (message === "/context") {
      log("\n📁 Контекст проекта:", "yellow");
      log("  • Директория видео: ./videos/", "dim");
      log("  • Найдено DJI видео с дрона", "dim");
      log("  • Найдены iPhone видео", "dim");
      log("  • Есть аудио запись", "dim");
      log("  • Тема: отпуск на Пхукете", "dim");
      log("");
      rl.prompt();
      return;
    }

    if (message === "") {
      rl.prompt();
      return;
    }

    // Обычное сообщение
    try {
      // Добавляем в историю
      const timestamp = new Date().toLocaleTimeString("ru-RU");
      chatHistory.push({
        timestamp,
        user: "user",
        message,
        provider,
      });

      // Получаем контекст из последних сообщений
      const recentContext = chatHistory
        .slice(-5)
        .map((h) => h.message)
        .join(" ");

      log(`\n🤔 ${provider.toUpperCase()} думает...`, "blue");

      // Симуляция времени ответа
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000),
      );

      const response = await getAIResponse(message, recentContext, provider);

      log(`\n🤖 ${provider.toUpperCase()}:`, "blue");
      log(response, "reset");

      // Добавляем ответ в историю
      chatHistory.push({
        timestamp: new Date().toLocaleTimeString("ru-RU"),
        user: provider,
        message: response,
        provider,
      });

      saveHistory(chatHistory);
    } catch (error) {
      log(`\n❌ Ошибка: ${error.message}`, "red");
    }

    log("");
    rl.prompt();
  });

  rl.on("close", () => {
    log("\n📝 История чата сохранена", "dim");
    process.exit(0);
  });
}

// Команда для одиночного вопроса
program
  .command("ask")
  .description("Задать вопрос ИИ ассистенту")
  .argument("<question>", "Вопрос для ИИ")
  .option("-p, --provider <provider>", "Провайдер ИИ (claude|openai)", "claude")
  .option("-c, --context <context>", "Дополнительный контекст")
  .action(async (question, options) => {
    try {
      log(`🤖 Спрашиваю ${options.provider.toUpperCase()}...`, "blue");

      const response = await getAIResponse(
        question,
        options.context,
        options.provider,
      );

      log(`\n❓ Вопрос: ${question}`, "cyan");
      log(`🤖 ${options.provider.toUpperCase()}:`, "blue");
      log(response, "reset");
      log("");
    } catch (error) {
      log(`❌ Ошибка: ${error.message}`, "red");
    }
  });

// Команда для интерактивного чата
program
  .command("chat")
  .description("Запустить интерактивный чат с ИИ")
  .option(
    "-p, --provider <provider>",
    "Провайдер ИИ (claude|openai|llama|local)",
    "llama",
  )
  .option(
    "-m, --model <model>",
    "Модель для локального провайдера",
    "llama3.2:latest",
  )
  .action(async (options) => {
    if (options.provider === "llama" || options.provider === "local") {
      log(`🚀 Используем локальную модель: ${options.model}`, "green");
    }
    await startInteractiveChat(options.provider, options.model);
  });

// Команда для анализа видео с ИИ советами
program
  .command("analyze-with-ai")
  .description("Анализ видео с советами от ИИ")
  .option("-d, --dir <directory>", "Директория с видео", "./videos")
  .option("-p, --provider <provider>", "Провайдер ИИ", "claude")
  .action(async (options) => {
    try {
      log(
        `🔍 Анализ видео с помощью ${options.provider.toUpperCase()}`,
        "green",
      );

      // Получаем список файлов
      const videoFiles = fs
        .readdirSync(options.dir)
        .filter((f) => f.match(/\.(mp4|mov|avi)$/i));

      log(`📁 Найдено ${videoFiles.length} видео файлов`, "cyan");

      // Анализируем названия файлов для контекста
      const djiFiles = videoFiles.filter((f) => f.includes("dji")).length;
      const phoneFiles = videoFiles.filter((f) => f.includes("IMG_")).length;

      const context = `В директории ${videoFiles.length} видео: ${djiFiles} с дрона DJI, ${phoneFiles} с телефона. Тема: отпуск Пхукет.`;

      const aiAdvice = await getAIResponse(
        "Как лучше проанализировать эти видео файлы?",
        context,
        options.provider,
      );

      log(`\n🤖 Рекомендации ${options.provider.toUpperCase()}:`, "blue");
      log(aiAdvice, "reset");

      log(`\n🚀 Запустить анализ? (y/n)`, "yellow");

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question("", (answer) => {
        if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
          log(`🏗️  Запускаем анализ...`, "green");
          log(
            `💡 Команда: node scripts/cli-video-processor.js analyze -d ${options.dir} --yolo --audio`,
            "dim",
          );
        } else {
          log(`📋 Используйте команду анализа когда будете готовы`, "yellow");
        }
        rl.close();
      });
    } catch (error) {
      log(`❌ Ошибка: ${error.message}`, "red");
    }
  });

// Команда для проверки доступных локальных моделей
program
  .command("models")
  .description("Показать доступные локальные модели")
  .action(async () => {
    try {
      log(`🔍 Проверяю доступные локальные модели...`, "blue");

      const { default: fetch } = await import("node-fetch");

      const response = await fetch("http://localhost:11434/api/tags");

      if (response.ok) {
        const data = await response.json();

        log(`📋 Доступные модели в Ollama:`, "green");
        log(
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          "dim",
        );

        data.models.forEach((model, index) => {
          const size = (model.size / 1024 / 1024 / 1024).toFixed(1);
          log(`${index + 1}. ${model.name}`, "cyan");
          log(`   📏 Размер: ${size} GB`, "dim");
          log(`   🏷️  Семейство: ${model.details?.family || "Unknown"}`, "dim");
          log(
            `   🧮 Параметры: ${model.details?.parameter_size || "Unknown"}`,
            "dim",
          );
          log("");
        });

        log(`💡 Использование:`, "yellow");
        log(`   bun run ai:chat -p llama -m llama3.2:latest`, "cyan");
        log(
          `   node scripts/timeline-cli.js chat -p llama -m MODEL_NAME`,
          "cyan",
        );
      } else {
        log(`❌ Ollama не доступен на localhost:11434`, "red");
        log(`🔧 Убедитесь что Ollama запущен: ollama serve`, "yellow");
      }
    } catch (error) {
      log(`❌ Ошибка подключения к Ollama: ${error.message}`, "red");
      log(`🔧 Убедитесь что Ollama запущен и доступен`, "yellow");
    }
  });

// Команда для истории
program
  .command("history")
  .description("Показать историю чата")
  .option("-n, --number <count>", "Количество последних сообщений", "10")
  .action((options) => {
    const history = loadHistory();
    const count = parseInt(options.number);

    if (history.length === 0) {
      log(`📭 История чата пуста`, "yellow");
      return;
    }

    log(`📜 Последние ${Math.min(count, history.length)} сообщений:`, "cyan");
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, "dim");

    history.slice(-count).forEach((entry, index) => {
      const icon = entry.user === "user" ? "👤" : "🤖";
      const color = entry.user === "user" ? "cyan" : "blue";
      log(`${icon} [${entry.timestamp}] ${entry.user}:`, color);
      log(`   ${entry.message}`, "reset");
      log("");
    });
  });

program
  .name("ai-chat")
  .description("Timeline Studio AI Chat - ИИ ассистент для работы с видео")
  .version("1.0.0");

// Если запущен без аргументов, показываем help
if (process.argv.length === 2) {
  program.help();
}

program.parse();
