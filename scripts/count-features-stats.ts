#!/usr/bin/env bun
import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface FeatureStats {
  name: string;
  path: string;
  files: {
    components: number;
    hooks: number;
    services: number;
    types: number;
    machines: number;
    tests: number;
    total: number;
  };
  readiness?: number;
  status?: string;
}

const EXCLUDED_FEATURES = ['camera-capture', 'voice-recording'];

function countFiles(dir: string, pattern: RegExp): number {
  try {
    const items = readdirSync(dir);
    let count = 0;

    for (const item of items) {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        count += countFiles(fullPath, pattern);
      } else if (pattern.test(item)) {
        count++;
      }
    }

    return count;
  } catch {
    return 0;
  }
}

function getReadinessFromReadme(featurePath: string): { readiness?: number; status?: string } {
  const readmePath = join(featurePath, 'README.md');

  if (!existsSync(readmePath)) {
    return {};
  }

  try {
    const content = readFileSync(readmePath, 'utf-8');

    // Ищем статус готовности (разные форматы)
    const readinessPatterns = [
      /Готовность[:\s]+(\d+)%/i,
      /Readiness[:\s]+(\d+)%/i,
      /Progress[:\s]+(\d+)%/i,
      /\*\*Готовность[:\s]+(\d+)%/i,
      /Status[:\s]+.*?(\d+)%/i,
    ];

    for (const pattern of readinessPatterns) {
      const match = content.match(pattern);
      if (match) {
        return { readiness: parseInt(match[1], 10) };
      }
    }

    // Ищем текстовый статус
    const statusPatterns = [
      /Status[:\s]+(.*?)(?:\n|$)/i,
      /Статус[:\s]+(.*?)(?:\n|$)/i,
    ];

    for (const pattern of statusPatterns) {
      const match = content.match(pattern);
      if (match) {
        return { status: match[1].trim() };
      }
    }
  } catch {
    // Ignore errors
  }

  return {};
}

function analyzeFeature(featurePath: string, featureName: string): FeatureStats {
  const stats: FeatureStats = {
    name: featureName,
    path: featurePath,
    files: {
      components: 0,
      hooks: 0,
      services: 0,
      types: 0,
      machines: 0,
      tests: 0,
      total: 0,
    },
  };

  // Компоненты (.tsx файлы в components/)
  const componentsDir = join(featurePath, 'components');
  if (existsSync(componentsDir)) {
    stats.files.components = countFiles(componentsDir, /\.tsx$/);
  }

  // Хуки (use-*.ts файлы в hooks/)
  const hooksDir = join(featurePath, 'hooks');
  if (existsSync(hooksDir)) {
    stats.files.hooks = countFiles(hooksDir, /^use-.*\.tsx?$/);
  }

  // Сервисы (*-service.ts, *-machine.ts в services/)
  const servicesDir = join(featurePath, 'services');
  if (existsSync(servicesDir)) {
    stats.files.services = countFiles(servicesDir, /-(service|client|api)\.tsx?$/);
    stats.files.machines = countFiles(servicesDir, /-machine\.tsx?$/);
  }

  // Типы (файлы в types/)
  const typesDir = join(featurePath, 'types');
  if (existsSync(typesDir)) {
    stats.files.types = countFiles(typesDir, /\.tsx?$/);
  }

  // Тесты (__tests__/)
  const testsDir = join(featurePath, '__tests__');
  if (existsSync(testsDir)) {
    stats.files.tests = countFiles(testsDir, /\.test\.tsx?$/);
  }

  // Общее количество файлов
  stats.files.total = countFiles(featurePath, /\.tsx?$/);

  // Готовность из README
  const { readiness, status } = getReadinessFromReadme(featurePath);
  stats.readiness = readiness;
  stats.status = status;

  return stats;
}

function main() {
  const featuresDir = '/Users/aleksandrkireev/Apps/timeline-studio/src/features';
  const features = readdirSync(featuresDir)
    .filter(name => {
      const fullPath = join(featuresDir, name);
      return statSync(fullPath).isDirectory() && !EXCLUDED_FEATURES.includes(name);
    })
    .sort();

  console.log(`\n📊 Статистика проекта Timeline Studio`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Исключены модули: ${EXCLUDED_FEATURES.join(', ')}\n`);

  const allStats: FeatureStats[] = [];

  for (const featureName of features) {
    const featurePath = join(featuresDir, featureName);
    const stats = analyzeFeature(featurePath, featureName);
    allStats.push(stats);
  }

  // Сортировка по готовности (сначала с готовностью, потом без)
  allStats.sort((a, b) => {
    if (a.readiness !== undefined && b.readiness !== undefined) {
      return b.readiness - a.readiness;
    }
    if (a.readiness !== undefined) return -1;
    if (b.readiness !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });

  // Вывод по каждой фиче
  console.log(`\n📦 Детальная статистика по фичам:\n`);

  for (const stats of allStats) {
    const readinessStr = stats.readiness !== undefined
      ? `${stats.readiness}%`
      : stats.status || 'нет данных';

    console.log(`${stats.name.padEnd(30)} | Готовность: ${readinessStr.padEnd(12)} | Файлы: ${stats.files.total.toString().padStart(3)} | Тесты: ${stats.files.tests.toString().padStart(3)}`);
  }

  // Общая статистика
  const totalFeatures = allStats.length;
  const totalFiles = allStats.reduce((sum, s) => sum + s.files.total, 0);
  const totalTests = allStats.reduce((sum, s) => sum + s.files.tests, 0);
  const totalComponents = allStats.reduce((sum, s) => sum + s.files.components, 0);
  const totalHooks = allStats.reduce((sum, s) => sum + s.files.hooks, 0);
  const totalServices = allStats.reduce((sum, s) => sum + s.files.services, 0);
  const totalMachines = allStats.reduce((sum, s) => sum + s.files.machines, 0);
  const totalTypes = allStats.reduce((sum, s) => sum + s.files.types, 0);

  const featuresWithReadiness = allStats.filter(s => s.readiness !== undefined);
  const avgReadiness = featuresWithReadiness.length > 0
    ? Math.round(featuresWithReadiness.reduce((sum, s) => sum + (s.readiness || 0), 0) / featuresWithReadiness.length)
    : 0;

  // Группировка по готовности
  const ready100 = allStats.filter(s => s.readiness === 100);
  const ready75_99 = allStats.filter(s => s.readiness !== undefined && s.readiness >= 75 && s.readiness < 100);
  const ready50_74 = allStats.filter(s => s.readiness !== undefined && s.readiness >= 50 && s.readiness < 75);
  const readyLess50 = allStats.filter(s => s.readiness !== undefined && s.readiness < 50);
  const noData = allStats.filter(s => s.readiness === undefined);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`📈 Общая статистика:\n`);
  console.log(`Всего фич:              ${totalFeatures}`);
  console.log(`Средняя готовность:     ${avgReadiness}% (${featuresWithReadiness.length} фич с данными)`);
  console.log(`Всего файлов:           ${totalFiles}`);
  console.log(`Всего тестов:           ${totalTests}`);
  console.log(`  - Компоненты (.tsx):  ${totalComponents}`);
  console.log(`  - Хуки (use-*.ts):    ${totalHooks}`);
  console.log(`  - Сервисы:            ${totalServices}`);
  console.log(`  - State машины:       ${totalMachines}`);
  console.log(`  - Типы:               ${totalTypes}`);

  console.log(`\n📊 Распределение по готовности:\n`);
  console.log(`  100%:         ${ready100.length} фич`);
  console.log(`  75-99%:       ${ready75_99.length} фич`);
  console.log(`  50-74%:       ${ready50_74.length} фич`);
  console.log(`  <50%:         ${readyLess50.length} фич`);
  console.log(`  Без данных:   ${noData.length} фич`);

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // JSON для дальнейшего использования
  const output = {
    excludedFeatures: EXCLUDED_FEATURES,
    totalFeatures,
    avgReadiness,
    totalFiles,
    totalTests,
    breakdown: {
      components: totalComponents,
      hooks: totalHooks,
      services: totalServices,
      machines: totalMachines,
      types: totalTypes,
    },
    readinessDistribution: {
      ready100: ready100.length,
      ready75_99: ready75_99.length,
      ready50_74: ready50_74.length,
      readyLess50: readyLess50.length,
      noData: noData.length,
    },
    features: allStats,
  };

  console.log(`💾 JSON данные для обновления документации:\n`);
  console.log(JSON.stringify(output, null, 2));
}

main();
