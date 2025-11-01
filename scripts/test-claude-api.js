#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

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

async function testClaudeAPI() {
  log(`🧪 Тестирование Claude API интеграции...`, 'blue');
  
  try {
    // Проверяем доступность Tauri dev
    log(`🔧 Запускаем Tauri backend...`, 'yellow');
    
    const tauriProcess = spawn('bun', ['run', 'tauri', 'dev'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: path.resolve(process.cwd())
    });

    let backendReady = false;
    
    // Ждем когда backend будет готов
    tauriProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('App listening') || output.includes('Ready')) {
        backendReady = true;
        log(`✅ Tauri backend готов`, 'green');
        testClaudeCommands();
      }
    });

    tauriProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Claude') || error.includes('API')) {
        log(`🔍 Backend info: ${error.trim()}`, 'cyan');
      }
    });

    // Таймаут для запуска
    setTimeout(() => {
      if (!backendReady) {
        log(`⚠️ Backend не готов, тестируем Claude API напрямую...`, 'yellow');
        testClaudeDirectly();
      }
    }, 10000);

  } catch (error) {
    log(`❌ Ошибка запуска Tauri: ${error.message}`, 'red');
    testClaudeDirectly();
  }
}

async function testClaudeCommands() {
  log(`\n🧠 Тестирование Claude API команд...`, 'blue');
  
  try {
    // Тест валидации API ключа
    log(`🔑 Проверяем API ключ...`, 'yellow');
    
    const validateProcess = spawn('bun', ['run', 'tauri', 'invoke', 'claude_validate_api_key'], {
      stdio: 'pipe',
      cwd: path.resolve(process.cwd())
    });

    let validateOutput = '';
    validateProcess.stdout.on('data', (data) => {
      validateOutput += data.toString();
    });

    validateProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(validateOutput);
          if (result.valid) {
            log(`✅ Claude API ключ валиден!`, 'green');
            testClaudeMessage();
          } else {
            log(`❌ Claude API ключ невалиден`, 'red');
          }
        } catch {
          log(`⚠️ Не удалось проверить API ключ`, 'yellow');
        }
      } else {
        log(`❌ Ошибка проверки API ключа`, 'red');
      }
    });

  } catch (error) {
    log(`❌ Ошибка тестирования команд: ${error.message}`, 'red');
  }
}

async function testClaudeMessage() {
  log(`\n💬 Отправляем тестовое сообщение Claude...`, 'blue');
  
  try {
    const messageProcess = spawn('bun', ['run', 'tauri', 'invoke', 'claude_send_message', JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      messages: [
        {
          role: 'user',
          content: 'Привет! Это тест интеграции с Timeline Studio. Ответь коротко что ты готов помогать с обработкой видео.'
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })], {
      stdio: 'pipe',
      cwd: path.resolve(process.cwd())
    });

    let messageOutput = '';
    messageProcess.stdout.on('data', (data) => {
      messageOutput += data.toString();
    });

    messageProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(messageOutput);
          if (result.content) {
            log(`✅ Claude ответил:`, 'green');
            log(`💬 "${result.content}"`, 'cyan');
            log(`\n🎉 Claude API полностью работает!`, 'green');
          } else {
            log(`⚠️ Получен неожиданный ответ от Claude`, 'yellow');
            log(`📄 ${messageOutput}`, 'dim');
          }
        } catch {
          log(`⚠️ Не удалось парсить ответ Claude`, 'yellow');
          log(`📄 ${messageOutput}`, 'dim');
        }
      } else {
        log(`❌ Ошибка отправки сообщения Claude`, 'red');
      }
      
      process.exit(0);
    });

  } catch (error) {
    log(`❌ Ошибка тестирования сообщения: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function testClaudeDirectly() {
  log(`\n🔧 Тестирование прямого доступа к Claude API...`, 'blue');
  
  // Проверяем есть ли API ключ в .env.local
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('ANTHROPIC_API_KEY')) {
        log(`✅ Найден ANTHROPIC_API_KEY в .env.local`, 'green');
        
        // Попробуем прямой HTTP запрос к Claude API
        log(`🌐 Тестируем прямой HTTP запрос...`, 'yellow');
        
        const { default: fetch } = await import('node-fetch');
        
        const apiKey = envContent.match(/ANTHROPIC_API_KEY=(.+)/)?.[1]?.trim();
        if (!apiKey) {
          log(`❌ API ключ пустой`, 'red');
          return;
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 200,
            messages: [
              {
                role: 'user',
                content: 'Привет! Это тест Claude API для Timeline Studio. Ответь коротко что готов помогать с видео.'
              }
            ]
          })
        });

        if (response.ok) {
          const result = await response.json();
          log(`✅ Прямой API запрос успешен!`, 'green');
          log(`💬 Claude: "${result.content[0].text}"`, 'cyan');
          log(`\n🎉 Claude API работает! Можно использовать в CLI чате.`, 'green');
        } else {
          const error = await response.text();
          log(`❌ Ошибка API: ${response.status} ${response.statusText}`, 'red');
          log(`📄 ${error}`, 'dim');
        }
        
      } else {
        log(`❌ ANTHROPIC_API_KEY не найден в .env.local`, 'red');
      }
    } else {
      log(`❌ Файл .env.local не найден`, 'red');
    }
  } catch (error) {
    log(`❌ Ошибка прямого тестирования: ${error.message}`, 'red');
  }
  
  process.exit(0);
}

// Импортируем fs
import fs from 'fs';

// Запускаем тест
log(`🚀 Запуск теста Claude API интеграции`, 'bold');
log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');

testClaudeAPI();