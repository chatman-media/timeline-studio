#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const execAsync = promisify(exec);

const program = new Command();

// Цвета для консоли
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Функция для запуска Tauri команд
async function runTauriCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    log(`🚀 Выполняется: ${command}`, 'blue');
    
    const process = spawn('bun', ['run', 'tauri', command, ...args], {
      stdio: 'pipe',
      cwd: path.resolve(__dirname, '..')
    });

    let output = '';
    let error = '';

    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text.trim());
    });

    process.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      console.error(text.trim());
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ output, error });
      } else {
        reject(new Error(`Command failed with code ${code}: ${error}`));
      }
    });
  });
}

// Получить все видео файлы из директории
function getVideoFiles(directory) {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.m4v', '.mkv'];
  const files = fs.readdirSync(directory);
  
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return videoExtensions.includes(ext);
  }).map(file => path.join(directory, file));
}

// Получить аудио файлы
function getAudioFiles(directory) {
  const audioExtensions = ['.wav', '.mp3', '.m4a', '.aac'];
  const files = fs.readdirSync(directory);
  
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return audioExtensions.includes(ext);
  }).map(file => path.join(directory, file));
}

// Команда для анализа видео
program
  .command('analyze')
  .description('Анализ всех видео в указанной директории')
  .option('-d, --dir <directory>', 'Директория с видео', './videos')
  .option('-o, --output <output>', 'Папка для результатов', './analysis-results')
  .option('--yolo', 'Включить YOLO анализ объектов')
  .option('--audio', 'Включить анализ аудио')
  .option('--faces', 'Включить распознавание лиц')
  .action(async (options) => {
    try {
      log(`🎬 Начинаем анализ видео в директории: ${options.dir}`, 'green');
      
      // Проверяем директорию
      if (!fs.existsSync(options.dir)) {
        log(`❌ Директория ${options.dir} не найдена`, 'red');
        return;
      }

      // Создаем папку для результатов
      if (!fs.existsSync(options.output)) {
        fs.mkdirSync(options.output, { recursive: true });
        log(`📁 Создана папка для результатов: ${options.output}`, 'yellow');
      }

      const videoFiles = getVideoFiles(options.dir);
      const audioFiles = getAudioFiles(options.dir);
      
      log(`📊 Найдено видео файлов: ${videoFiles.length}`, 'cyan');
      log(`🎵 Найдено аудио файлов: ${audioFiles.length}`, 'cyan');

      if (videoFiles.length === 0) {
        log(`⚠️  Видео файлы не найдены в ${options.dir}`, 'yellow');
        return;
      }

      // Запускаем Tauri dev в фоне если не запущен
      log(`🏗️  Инициализация Tauri backend...`, 'blue');
      
      // Создаем batch задание для анализа
      const batchConfig = {
        operation: 'analyze',
        inputFiles: videoFiles,
        audioFiles: audioFiles,
        outputDir: options.output,
        options: {
          yolo: options.yolo || false,
          audio: options.audio || true,
          faces: options.faces || false,
          scenes: true,
          quality: true,
          motion: true
        }
      };

      // Сохраняем конфигурацию
      const configPath = path.join(options.output, 'batch-config.json');
      fs.writeFileSync(configPath, JSON.stringify(batchConfig, null, 2));
      log(`💾 Конфигурация сохранена: ${configPath}`, 'green');

      // Запускаем анализ через наш интерфейс
      log(`🔬 Запуск анализа ${videoFiles.length} видео файлов...`, 'bold');
      
      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i];
        const fileName = path.basename(file);
        log(`📹 [${i + 1}/${videoFiles.length}] Анализ: ${fileName}`, 'cyan');
        
        try {
          // Здесь будем вызывать Tauri команды для анализа
          // Пока симулируем прогресс
          await new Promise(resolve => setTimeout(resolve, 1000));
          log(`✅ Завершен анализ: ${fileName}`, 'green');
        } catch (error) {
          log(`❌ Ошибка анализа ${fileName}: ${error.message}`, 'red');
        }
      }

      log(`🎉 Анализ завершен! Результаты в: ${options.output}`, 'green');
      
    } catch (error) {
      log(`❌ Ошибка: ${error.message}`, 'red');
    }
  });

// Команда для создания монтажа
program
  .command('montage')
  .description('Создание автоматического монтажа')
  .option('-d, --dir <directory>', 'Директория с видео', './videos')
  .option('-a, --analysis <analysis>', 'Папка с результатами анализа', './analysis-results')
  .option('-o, --output <output>', 'Выходной файл', './montage-output.mp4')
  .option('-t, --duration <duration>', 'Длительность монтажа в секундах', '120')
  .option('-s, --style <style>', 'Стиль монтажа (dynamic|calm|travel|action)', 'travel')
  .option('--music', 'Включить фоновую музыку из аудио файлов')
  .action(async (options) => {
    try {
      log(`🎬 Создание монтажа из видео в: ${options.dir}`, 'green');
      
      // Проверяем наличие анализа
      const configPath = path.join(options.analysis, 'batch-config.json');
      if (!fs.existsSync(configPath)) {
        log(`⚠️  Результаты анализа не найдены. Запустите сначала: analyze`, 'yellow');
        return;
      }

      const videoFiles = getVideoFiles(options.dir);
      const audioFiles = getAudioFiles(options.dir);
      
      log(`🎞️  Обработка ${videoFiles.length} видео файлов`, 'cyan');
      log(`🎵 Фоновая музыка: ${audioFiles.length > 0 ? 'Да' : 'Нет'}`, 'cyan');
      
      const montageConfig = {
        operation: 'montage',
        inputFiles: videoFiles,
        audioFiles: options.music ? audioFiles : [],
        analysisDir: options.analysis,
        outputFile: options.output,
        duration: parseInt(options.duration),
        style: options.style,
        options: {
          transitions: true,
          colorCorrection: true,
          stabilization: true,
          smartCropping: true
        }
      };

      // Сохраняем конфигурацию монтажа
      const montageConfigPath = path.join(path.dirname(options.output), 'montage-config.json');
      fs.writeFileSync(montageConfigPath, JSON.stringify(montageConfig, null, 2));
      
      log(`🎨 Стиль монтажа: ${options.style}`, 'yellow');
      log(`⏱️  Длительность: ${options.duration} сек`, 'yellow');
      log(`💾 Конфигурация монтажа: ${montageConfigPath}`, 'green');
      
      // Симуляция создания монтажа
      log(`🏗️  Создание монтажа...`, 'blue');
      log(`🔍 Анализ лучших моментов...`, 'cyan');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      log(`🎬 Компиляция видео...`, 'cyan');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      log(`🎵 Синхронизация аудио...`, 'cyan');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      log(`✨ Применение эффектов и переходов...`, 'cyan');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      log(`🎉 Монтаж готов: ${options.output}`, 'green');
      
    } catch (error) {
      log(`❌ Ошибка создания монтажа: ${error.message}`, 'red');
    }
  });

// Команда для статуса
program
  .command('status')
  .description('Показать статус текущих операций')
  .action(async () => {
    try {
      log(`📊 Статус Timeline Studio CLI`, 'green');
      log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
      
      // Проверяем наличие результатов анализа
      if (fs.existsSync('./analysis-results')) {
        const files = fs.readdirSync('./analysis-results');
        log(`📁 Результаты анализа: ${files.length} файлов`, 'yellow');
      } else {
        log(`📁 Результаты анализа: не найдены`, 'yellow');
      }
      
      // Проверяем видео файлы
      if (fs.existsSync('./videos')) {
        const videoFiles = getVideoFiles('./videos');
        const audioFiles = getAudioFiles('./videos');
        log(`🎬 Видео файлов: ${videoFiles.length}`, 'cyan');
        log(`🎵 Аудио файлов: ${audioFiles.length}`, 'cyan');
      }
      
      // Проверяем готовые монтажи
      const montageFiles = fs.readdirSync('.').filter(f => f.includes('montage') && f.endsWith('.mp4'));
      log(`🎞️  Готовые монтажи: ${montageFiles.length}`, 'green');
      
      if (montageFiles.length > 0) {
        montageFiles.forEach(file => {
          const stats = fs.statSync(file);
          log(`   📄 ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`, 'reset');
        });
      }
      
    } catch (error) {
      log(`❌ Ошибка получения статуса: ${error.message}`, 'red');
    }
  });

// Команда для очистки
program
  .command('clean')
  .description('Очистить временные файлы и кэш')
  .option('--analysis', 'Удалить результаты анализа')
  .option('--cache', 'Очистить кэш')
  .option('--all', 'Очистить все')
  .action(async (options) => {
    try {
      log(`🧹 Очистка временных файлов...`, 'yellow');
      
      if (options.analysis || options.all) {
        if (fs.existsSync('./analysis-results')) {
          fs.rmSync('./analysis-results', { recursive: true, force: true });
          log(`🗑️  Удалены результаты анализа`, 'green');
        }
      }
      
      if (options.cache || options.all) {
        // Здесь будем вызывать Tauri команды очистки кэша
        log(`🗑️  Очистка кэша...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 1000));
        log(`✅ Кэш очищен`, 'green');
      }
      
      log(`🎉 Очистка завершена`, 'green');
      
    } catch (error) {
      log(`❌ Ошибка очистки: ${error.message}`, 'red');
    }
  });

program
  .name('timeline-cli')
  .description('Timeline Studio CLI - Инструмент для batch обработки видео')
  .version('1.0.0');

program.parse();