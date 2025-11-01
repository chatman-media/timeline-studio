#!/usr/bin/env node

import { Command } from 'commander';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.path);
const __dirname = dirname(__filename);

const program = new Command();

// Цвета для консоли
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn('node', [path.join(__dirname, scriptName), ...args], {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..')
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

// Главное меню
program
  .command('menu')
  .description('Показать интерактивное меню')
  .action(() => {
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
    log(`🎬 Timeline Studio CLI - Главное меню`, 'bold');
    log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
    log('');
    log(`📹 ОБРАБОТКА ВИДЕО`, 'yellow');
    log(`   timeline-cli analyze     - Анализ всех видео в ./videos/`, 'dim');
    log(`   timeline-cli montage     - Создание автоматического монтажа`, 'dim');
    log(`   timeline-cli status      - Статус операций`, 'dim');
    log(`   timeline-cli clean       - Очистка временных файлов`, 'dim');
    log('');
    log(`🤖 ИИ АССИСТЕНТ`, 'yellow');
    log(`   timeline-cli chat        - Интерактивный чат с ИИ`, 'dim');
    log(`   timeline-cli ask "вопрос" - Задать быстрый вопрос`, 'dim');
    log(`   timeline-cli ai-analyze  - Анализ видео с советами ИИ`, 'dim');
    log(`   timeline-cli ai-history  - История чата с ИИ`, 'dim');
    log('');
    log(`🚀 БЫСТРЫЕ КОМАНДЫ`, 'yellow');
    log(`   timeline-cli quick-start - Полный workflow: анализ + монтаж`, 'dim');
    log(`   timeline-cli phuket      - Специально для видео с Пхукета`, 'dim');
    log('');
    log(`💡 ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:`, 'green');
    log(`   # Анализ всех видео`, 'dim');
    log(`   timeline-cli analyze --yolo --audio --faces`, 'cyan');
    log('');
    log(`   # Создание 2-минутного монтажа в стиле путешествий`, 'dim');
    log(`   timeline-cli montage --duration 120 --style travel --music`, 'cyan');
    log('');
    log(`   # Чат с ИИ для планирования обработки`, 'dim');
    log(`   timeline-cli chat`, 'cyan');
    log('');
    log(`   # Быстрый вопрос ИИ`, 'dim');
    log(`   timeline-cli ask "Как лучше обработать видео с дрона?"`, 'cyan');
    log('');
  });

// Анализ видео
program
  .command('analyze')
  .description('Анализ видео файлов')
  .option('-d, --dir <directory>', 'Директория с видео', './videos')
  .option('--yolo', 'Включить YOLO анализ')
  .option('--audio', 'Включить анализ аудио')
  .option('--faces', 'Включить распознавание лиц')
  .action(async (options) => {
    const args = ['analyze'];
    if (options.dir !== './videos') args.push('-d', options.dir);
    if (options.yolo) args.push('--yolo');
    if (options.audio) args.push('--audio');
    if (options.faces) args.push('--faces');
    
    await runScript('cli-video-processor.js', args);
  });

// Создание монтажа
program
  .command('montage')
  .description('Создание монтажа')
  .option('-d, --dir <directory>', 'Директория с видео', './videos')
  .option('-t, --duration <duration>', 'Длительность в секундах', '120')
  .option('-s, --style <style>', 'Стиль монтажа', 'travel')
  .option('--music', 'Включить фоновую музыку')
  .action(async (options) => {
    const args = ['montage'];
    if (options.dir !== './videos') args.push('-d', options.dir);
    if (options.duration !== '120') args.push('-t', options.duration);
    if (options.style !== 'travel') args.push('-s', options.style);
    if (options.music) args.push('--music');
    
    await runScript('cli-video-processor.js', args);
  });

// Статус
program
  .command('status')
  .description('Статус операций')
  .action(async () => {
    await runScript('cli-video-processor.js', ['status']);
  });

// Очистка
program
  .command('clean')
  .description('Очистка временных файлов')
  .option('--analysis', 'Удалить результаты анализа')
  .option('--cache', 'Очистить кэш')
  .option('--all', 'Очистить все')
  .action(async (options) => {
    const args = ['clean'];
    if (options.analysis) args.push('--analysis');
    if (options.cache) args.push('--cache');
    if (options.all) args.push('--all');
    
    await runScript('cli-video-processor.js', args);
  });

// ИИ чат
program
  .command('chat')
  .description('Интерактивный чат с ИИ')
  .option('-p, --provider <provider>', 'Провайдер ИИ (claude|openai|llama|local)', 'llama')
  .option('-m, --model <model>', 'Модель для локального провайдера', 'llama3.2:latest')
  .action(async (options) => {
    const args = ['chat'];
    if (options.provider !== 'llama') args.push('-p', options.provider);
    if (options.model !== 'llama3.2:latest') args.push('-m', options.model);
    
    await runScript('cli-ai-chat.js', args);
  });

// Быстрый вопрос ИИ
program
  .command('ask')
  .description('Задать вопрос ИИ')
  .argument('<question>', 'Вопрос для ИИ')
  .option('-p, --provider <provider>', 'Провайдер ИИ', 'llama')
  .option('-m, --model <model>', 'Модель для локального провайдера', 'llama3.2:latest')
  .action(async (question, options) => {
    const args = ['ask', question];
    if (options.provider !== 'llama') args.push('-p', options.provider);
    if (options.model !== 'llama3.2:latest') args.push('-m', options.model);
    
    await runScript('cli-ai-chat.js', args);
  });

// ИИ анализ
program
  .command('ai-analyze')
  .description('Анализ видео с советами ИИ')
  .option('-d, --dir <directory>', 'Директория с видео', './videos')
  .option('-p, --provider <provider>', 'Провайдер ИИ', 'claude')
  .action(async (options) => {
    const args = ['analyze-with-ai'];
    if (options.dir !== './videos') args.push('-d', options.dir);
    if (options.provider !== 'claude') args.push('-p', options.provider);
    
    await runScript('cli-ai-chat.js', args);
  });

// История ИИ
program
  .command('ai-history')
  .description('История чата с ИИ')
  .option('-n, --number <count>', 'Количество сообщений', '10')
  .action(async (options) => {
    const args = ['history'];
    if (options.number !== '10') args.push('-n', options.number);
    
    await runScript('cli-ai-chat.js', args);
  });

// Быстрый старт
program
  .command('quick-start')
  .description('Полный workflow: анализ + монтаж')
  .option('-d, --dir <directory>', 'Директория с видео', './videos')
  .action(async (options) => {
    try {
      log(`🚀 Запуск полного workflow для директории: ${options.dir}`, 'green');
      
      // Сначала анализ
      log(`\n🔬 Этап 1: Анализ видео`, 'yellow');
      await runScript('cli-video-processor.js', ['analyze', '-d', options.dir, '--yolo', '--audio']);
      
      // Потом монтаж
      log(`\n🎬 Этап 2: Создание монтажа`, 'yellow');
      await runScript('cli-video-processor.js', ['montage', '-d', options.dir, '--music']);
      
      log(`\n🎉 Workflow завершен!`, 'green');
      
    } catch (error) {
      log(`❌ Ошибка workflow: ${error.message}`, 'red');
    }
  });

// Специально для Пхукета
program
  .command('phuket')
  .description('Оптимизированный workflow для видео с Пхукета')
  .option('-d, --dir <directory>', 'Директория с видео', './videos')
  .action(async (options) => {
    try {
      log(`🏝️  Обработка видео с Пхукета`, 'green');
      log(`📁 Директория: ${options.dir}`, 'cyan');
      
      // Спрашиваем ИИ совет
      log(`\n🤖 Получаем рекомендации от ИИ...`, 'blue');
      await runScript('cli-ai-chat.js', ['ask', 'Как лучше обработать видео с отпуска на Пхукете? У меня есть видео с дрона DJI и iPhone']);
      
      // Анализ с оптимизацией для пляжных видео
      log(`\n🔬 Анализ видео (оптимизация для пляжа)...`, 'yellow');
      await runScript('cli-video-processor.js', ['analyze', '-d', options.dir, '--yolo', '--audio']);
      
      // Монтаж в стиле путешествий
      log(`\n🎬 Создание монтажа в стиле путешествий...`, 'yellow');
      await runScript('cli-video-processor.js', ['montage', '-d', options.dir, '-s', 'travel', '-t', '180', '--music']);
      
      log(`\n🎉 Ваше видео с Пхукета готово!`, 'green');
      
    } catch (error) {
      log(`❌ Ошибка обработки: ${error.message}`, 'red');
    }
  });

program
  .name('timeline-cli')
  .description('Timeline Studio CLI - Полный инструмент для обработки видео')
  .version('1.0.0');

// Если запущен без команд, показываем меню
if (process.argv.length === 2) {
  program.commands.find(cmd => cmd.name() === 'menu').action();
} else {
  program.parse();
}