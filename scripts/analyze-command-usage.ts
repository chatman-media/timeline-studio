#!/usr/bin/env bun

/**
 * Скрипт для анализа использования Tauri команд
 *
 * Сопоставляет:
 * - Зарегистрированные backend команды (app_builder.rs)
 * - Frontend invoke вызовы (src/domains/)
 *
 * Показывает:
 * - Используемые команды
 * - Неиспользуемые команды
 * - Соответствие по модулям
 */

import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

interface CommandInfo {
  name: string
  module?: string
  usedIn: string[]
}

interface ModuleMapping {
  domain: string
  backendModules: string[]
  commands: string[]
}

// Извлечь все зарегистрированные команды из app_builder.rs
function extractRegisteredCommands(): Map<string, CommandInfo> {
  const appBuilderPath = join(process.cwd(), 'src-tauri/src/app_builder.rs')
  const content = readFileSync(appBuilderPath, 'utf-8')

  const commands = new Map<string, CommandInfo>()

  // Найти блок generate_handler!
  const handlerMatch = content.match(/tauri::generate_handler!\[([\s\S]*?)\]/m)
  if (!handlerMatch) {
    console.error('Не найден блок generate_handler!')
    return commands
  }

  // Извлечь все crate::module::command
  const commandRegex = /crate::([^:]+)::(?:commands::)?([a-z_]+)/g
  let match

  while ((match = commandRegex.exec(handlerMatch[1])) !== null) {
    const module = match[1]
    const commandName = match[2]

    commands.set(commandName, {
      name: commandName,
      module,
      usedIn: []
    })
  }

  return commands
}

// Рекурсивно найти все .ts файлы в директории
function findTsFiles(dir: string): string[] {
  const files: string[] = []

  try {
    const items = readdirSync(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = join(dir, item.name)

      if (item.isDirectory() && item.name !== 'node_modules' && item.name !== '.next') {
        files.push(...findTsFiles(fullPath))
      } else if (item.isFile() && item.name.endsWith('.ts')) {
        files.push(fullPath)
      }
    }
  } catch (error) {
    // Игнорируем ошибки доступа
  }

  return files
}

// Извлечь все invoke вызовы из TypeScript файлов
function extractInvokeCalls(domainsPath: string): Map<string, string[]> {
  const invokeCalls = new Map<string, string[]>()
  const tsFiles = findTsFiles(domainsPath)

  for (const filePath of tsFiles) {
    const content = readFileSync(filePath, 'utf-8')

    // Паттерн для поиска invoke вызовов
    // invoke<ReturnType>("command_name")
    // invoke("command_name")
    const invokeRegex = /invoke(?:<[^>]+>)?\s*\(\s*["']([a-z_]+)["']/g
    let match

    while ((match = invokeRegex.exec(content)) !== null) {
      const commandName = match[1]
      const relativePath = filePath.replace(process.cwd(), '')

      if (!invokeCalls.has(commandName)) {
        invokeCalls.set(commandName, [])
      }
      invokeCalls.get(commandName)!.push(relativePath)
    }
  }

  return invokeCalls
}

// Сопоставить домены с backend модулями
function mapDomainsToModules(registeredCommands: Map<string, CommandInfo>): ModuleMapping[] {
  const mappings: ModuleMapping[] = [
    {
      domain: 'ai-services',
      backendModules: ['analysis', 'ai_director_v2', 'recognition'],
      commands: []
    },
    {
      domain: 'media-management',
      backendModules: ['media'],
      commands: []
    },
    {
      domain: 'video-editing',
      backendModules: ['video_compiler', 'compiler'],
      commands: []
    },
    {
      domain: 'subtitles',
      backendModules: ['subtitles'],
      commands: []
    },
    {
      domain: 'system-integration',
      backendModules: ['language', 'update_checker', 'plugin_system'],
      commands: []
    },
    {
      domain: 'project-management',
      backendModules: ['state'],
      commands: []
    },
    {
      domain: 'ai-director',
      backendModules: ['ai_director_v2'],
      commands: []
    },
    {
      domain: 'ai-tools',
      backendModules: ['analysis', 'ai_api_proxy'],
      commands: []
    }
  ]

  // Распределить команды по доменам
  for (const [commandName, info] of registeredCommands) {
    for (const mapping of mappings) {
      if (info.module && mapping.backendModules.includes(info.module)) {
        mapping.commands.push(commandName)
        break
      }
    }
  }

  return mappings
}

// Основная функция
function main() {
  console.log('🔍 Анализ использования Tauri команд...\n')

  // 1. Извлечь зарегистрированные команды
  console.log('📋 Извлечение зарегистрированных команд из app_builder.rs...')
  const registeredCommands = extractRegisteredCommands()
  console.log(`   Найдено: ${registeredCommands.size} команд\n`)

  // 2. Извлечь invoke вызовы
  console.log('🔎 Поиск invoke вызовов в src/domains/...')
  const domainsPath = join(process.cwd(), 'src/domains')
  const invokeCalls = extractInvokeCalls(domainsPath)
  console.log(`   Найдено: ${invokeCalls.size} уникальных команд в invoke вызовах\n`)

  // 3. Сопоставить использование
  console.log('🔗 Сопоставление команд...\n')

  let usedCount = 0
  let unusedCount = 0

  for (const [commandName, info] of registeredCommands) {
    if (invokeCalls.has(commandName)) {
      info.usedIn = invokeCalls.get(commandName)!
      usedCount++
    } else {
      unusedCount++
    }
  }

  // 4. Вывести статистику
  console.log('📊 СТАТИСТИКА:')
  console.log(`   Зарегистрировано команд: ${registeredCommands.size}`)
  console.log(`   Используется на фронтенде: ${usedCount}`)
  console.log(`   Не используется: ${unusedCount}`)
  console.log(`   Покрытие: ${((usedCount / registeredCommands.size) * 100).toFixed(1)}%\n`)

  // 5. Команды вызываемые, но не зарегистрированные
  const notRegistered: string[] = []
  for (const commandName of invokeCalls.keys()) {
    if (!registeredCommands.has(commandName)) {
      notRegistered.push(commandName)
    }
  }

  if (notRegistered.length > 0) {
    console.log('⚠️  КОМАНДЫ ВЫЗЫВАЕМЫЕ, НО НЕ ЗАРЕГИСТРИРОВАННЫЕ:')
    for (const cmd of notRegistered) {
      console.log(`   - ${cmd}`)
      console.log(`     Вызывается в: ${invokeCalls.get(cmd)!.join(', ')}`)
    }
    console.log()
  }

  // 6. Соответствие по модулям
  console.log('🗂️  СООТВЕТСТВИЕ ДОМЕНОВ И МОДУЛЕЙ:\n')
  const moduleMappings = mapDomainsToModules(registeredCommands)

  for (const mapping of moduleMappings) {
    const usedInDomain = mapping.commands.filter(cmd =>
      registeredCommands.get(cmd)?.usedIn.length ?? 0 > 0
    )

    console.log(`   ${mapping.domain}:`)
    console.log(`      Backend модули: ${mapping.backendModules.join(', ')}`)
    console.log(`      Всего команд: ${mapping.commands.length}`)
    console.log(`      Используется: ${usedInDomain.length}`)
    console.log(`      Покрытие: ${mapping.commands.length > 0 ? ((usedInDomain.length / mapping.commands.length) * 100).toFixed(1) : 0}%`)
    console.log()
  }

  // 7. Детальный список неиспользуемых команд по модулям
  console.log('🗑️  НЕИСПОЛЬЗУЕМЫЕ КОМАНДЫ ПО МОДУЛЯМ:\n')

  const unusedByModule = new Map<string, string[]>()

  for (const [commandName, info] of registeredCommands) {
    if (info.usedIn.length === 0 && info.module) {
      if (!unusedByModule.has(info.module)) {
        unusedByModule.set(info.module, [])
      }
      unusedByModule.get(info.module)!.push(commandName)
    }
  }

  for (const [module, commands] of unusedByModule) {
    console.log(`   ${module} (${commands.length} команд):`)
    for (const cmd of commands.slice(0, 10)) {
      console.log(`      - ${cmd}`)
    }
    if (commands.length > 10) {
      console.log(`      ... и ещё ${commands.length - 10} команд`)
    }
    console.log()
  }
}

main()
