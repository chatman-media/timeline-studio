#!/usr/bin/env node

/**
 * Современный скрипт синхронизации версий для Tauri приложения
 * Поддерживает различные стратегии и интеграцию с CI/CD
 */

import { execSync } from "child_process"
import { existsSync, readFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, "..", "..")

// Конфигурация
const config = {
  strategy: process.env.VERSION_STRATEGY || "manual", // manual, cargo, package
  files: {
    package: "package.json",
    cargo: "src-tauri/Cargo.toml",
    tauri: "src-tauri/tauri.conf.json",
    version: "version.json",
    mock: "src/test/mocks/tauri/api/app.ts",
    promoProject: "promo/src/pages/Project.tsx",
  },
}

/**
 * Получить версию из источника
 */
function getSourceVersion() {
  switch (config.strategy) {
    case "cargo":
      return getCargoVersion()
    case "package":
      return getPackageVersion()
    default:
      return process.argv[2]
  }
}

/**
 * Получить версию из Cargo.toml
 */
function getCargoVersion() {
  const cargoPath = join(rootDir, config.files.cargo)
  const content = readFileSync(cargoPath, "utf8")
  const match = content.match(/^version = "(.+)"$/m)
  return match ? match[1] : null
}

/**
 * Получить версию из package.json
 */
function getPackageVersion() {
  const packagePath = join(rootDir, config.files.package)
  const pkg = JSON.parse(readFileSync(packagePath, "utf8"))
  return pkg.version
}

/**
 * Обновить версию в файле
 */
function updateVersion(filePath, version, updater) {
  const fullPath = join(rootDir, filePath)

  if (!existsSync(fullPath)) {
    console.warn(`⚠️  Файл не найден: ${filePath}`)
    return false
  }

  try {
    updater(fullPath, version)
    console.log(`✅ Обновлен: ${filePath} → ${version}`)
    return true
  } catch (error) {
    console.error(`❌ Ошибка в ${filePath}: ${error.message}`)
    return false
  }
}

/**
 * Обновители для разных типов файлов
 */
const updaters = {
  json: (path, version) => {
    const data = JSON.parse(readFileSync(path, "utf8"))
    data.version = version
    writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`)
  },

  toml: (path, version) => {
    let content = readFileSync(path, "utf8")
    content = content.replace(/^version = ".*"$/m, `version = "${version}"`)
    writeFileSync(path, content)
  },

  typescript: (path, version) => {
    let content = readFileSync(path, "utf8")
    content = content.replace(
      /return Promise\.resolve\("[\d.]+(?:-[a-zA-Z0-9-.]+)?"\)/,
      `return Promise.resolve("${version}")`,
    )
    writeFileSync(path, content)
  },

  promoVersion: (path, version) => {
    let content = readFileSync(path, "utf8")
    // Обновляем версию в формате "Версия X.X.X" и "Version X.X.X"
    content = content.replace(
      /language === "ru" \? "Версия [\d.]+" : "Version [\d.]+"/,
      `language === "ru" ? "Версия ${version}" : "Version ${version}"`,
    )
    writeFileSync(path, content)
  },
}

/**
 * Основная функция
 */
async function main() {
  console.log("🔄 Timeline Studio Version Sync\n")

  // Получаем версию
  const version = getSourceVersion()

  if (!version) {
    console.error("❌ Версия не указана")
    console.log("\nИспользование:")
    console.log("  npm run version:sync <version>")
    console.log("  VERSION_STRATEGY=cargo npm run version:sync")
    console.log("  VERSION_STRATEGY=package npm run version:sync")
    process.exit(1)
  }

  // Валидация версии
  if (!/^\d+\.\d+\.\d+(-[a-zA-Z0-9-.]+)?$/.test(version)) {
    console.error("❌ Неверный формат версии:", version)
    process.exit(1)
  }

  console.log(`📌 Версия: ${version}`)
  console.log(`📋 Стратегия: ${config.strategy}\n`)

  // Обновляем файлы
  let success = 0
  let failed = 0

  // package.json
  if (config.strategy !== "package") {
    const result = updateVersion(config.files.package, version, updaters.json)
    result ? success++ : failed++
  }

  // Cargo.toml
  if (config.strategy !== "cargo") {
    const result = updateVersion(config.files.cargo, version, updaters.toml)
    result ? success++ : failed++
  }

  // tauri.conf.json (опционально - можно удалить version для автоопределения)
  const tauriPath = join(rootDir, config.files.tauri)
  if (existsSync(tauriPath)) {
    const tauriConfig = JSON.parse(readFileSync(tauriPath, "utf8"))
    if (tauriConfig.version !== undefined) {
      const result = updateVersion(config.files.tauri, version, updaters.json)
      result ? success++ : failed++
    } else {
      console.log("ℹ️  tauri.conf.json использует версию из Cargo.toml")
    }
  }

  // version.json
  const versionResult = updateVersion(config.files.version, version, updaters.json)
  versionResult ? success++ : failed++

  // Тестовый мок
  const mockResult = updateVersion(config.files.mock, version, updaters.typescript)
  mockResult ? success++ : failed++

  // Promo сайт - страница проекта
  const promoResult = updateVersion(config.files.promoProject, version, updaters.promoVersion)
  promoResult ? success++ : failed++

  // Итоги
  console.log(`\n✅ Обновлено: ${success}`)
  if (failed > 0) console.log(`❌ Ошибок: ${failed}`)

  // Git операции (если не в CI)
  if (!process.env.CI) {
    console.log("\n🔍 Git статус:")
    try {
      console.log(execSync("git diff --stat", { encoding: "utf8" }))

      console.log("\n💡 Следующие шаги:")
      console.log("1. git add -A")
      console.log(`2. git commit -m "chore: bump version to ${version}"`)
      console.log(`3. git tag v${version}`)
      console.log("4. git push && git push --tags")
    } catch (e) {
      // Не в git репозитории
    }
  }

  process.exit(failed > 0 ? 1 : 0)
}

// Запуск
main().catch(console.error)
