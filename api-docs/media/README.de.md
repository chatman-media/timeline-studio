# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![Frontend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=frontend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=backend)](https://codecov.io/gh/chatman-media/timeline-studio)

[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## Projektübersicht

Timeline Studio ist eine professionelle Videobearbeitungsanwendung, die mit modernen Webtechnologien und nativer Leistung entwickelt wurde. Unser Ziel ist es, einen Editor auf DaVinci Resolve-Niveau zu schaffen, der für jeden zugänglich ist.

![Timeline-Oberfläche #1](/public/screen2.png)

![Timeline-Oberfläche #2](/public/screen4.png)

### Projektstatus (Juni 2025)

**Gesamte Fertigstellung: 86.2%** ⬆️ (aktualisiert nach OAuth-Integration und Export-Fertigstellung)
- ✅ Kernfunktionen der Bearbeitung vollständig
- ✅ Video Compiler mit GPU-Beschleunigung
- ✅ Erkennungsmodul (YOLO v11) - ORT behoben
- ✅ Effekte, Filter und Übergänge (75-80%)
- ✅ Export - vollständige Social Media Integration! (98%) 🎉
- ✅ OAuth-Integration - Unterstützung für YouTube/TikTok/Vimeo/Telegram
- ✅ Einheitliches Vorschausystem mit Preview Manager
- ✅ Medienpersistenz und temporäre Projekte
- ✅ Template-System - konfigurationsbasiert (95% fertig)
- ✅ Timeline zu 90% fertiggestellt
- ⚠️ Ressourcen-Panel in Entwicklung (85%)
- 🎯 Ziel-MVP-Release: Ende Juni 2025

## Hauptfunktionen

- 🎬 Professionelle Videobearbeitung mit Multi-Track-Timeline
- 🖥️ Plattformübergreifend (Windows, macOS, Linux)
- 🚀 GPU-beschleunigte Videoverarbeitung (NVENC, QuickSync, VideoToolbox)
- 🤖 KI-gestützte Objekt-/Gesichtserkennung (YOLO v11 - ORT behoben)
- 🎨 30+ Übergänge, visuelle Effekte und Filter
- 📝 Erweiterte Untertitelsystem mit 12 Stilen und Animationen
- 🎵 Multi-Track-Audiobearbeitung mit Effekten
- 📤 Export zu MP4/MOV/WebM mit Social Media OAuth-Integration
- 🔐 OAuth-Unterstützung für YouTube/TikTok/Vimeo/Telegram mit sicherer Token-Speicherung
- 📱 Geräte-Presets (iPhone, iPad, Android) für optimierte Exporte
- 🧠 Zustandsverwaltung mit XState v5
- 🌐 Internationalisierung-Support (11 Sprachen)
- 💾 Intelligente Zwischenspeicherung und einheitliches Vorschausystem
- 🎨 Moderne UI mit Tailwind CSS v4, shadcn-ui
- 📚 Vollständige Dokumentation mit 2400+ Tests (98.8% Erfolgsrate)
- 🌐 Internationalisierungsunterstützung (i18n)
- 🎨 Moderne UI mit Tailwind CSS v4
- 🔍 Strenge Codequalitätskontrolle mit ESLint, Stylelint und Clippy
- 📚 Vollständige Dokumentation für alle Komponenten

## Erste Schritte

### Voraussetzungen

- [Node.js](https://nodejs.org/) (v18 oder höher)
- [Rust](https://www.rust-lang.org/tools/install) (neueste stabile Version)
- [bun](https://bun.sh/) (neueste stabile Version)

### Installation

1. Repository klonen:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Abhängigkeiten installieren:

```bash
bun install
```

### Entwicklungsmodus

```bash
bun tauri dev
```

### Produktions-Build

```bash
bun tauri build
```

## Dokumentation

### 📚 Hauptdokumentation

- 📚 [Dokumentationsübersicht](docs-ru/MAP.md) - Vollständige Dokumentationsübersicht
- 🏗️ [Architektur-Leitfaden](docs-ru/ARCHITECTURE.md) - Systemarchitektur
- 🧪 [Test-Leitfaden](docs-ru/testing/TESTING.md) - Teststrategien
- 📡 [API-Referenz](docs-ru/API.md) - Tauri-Befehle Referenz
- 🚀 [Deployment-Leitfaden](docs-ru/deployment/DEPLOYMENT.md) - Build und Deployment
- 🛣️ [Roadmap](docs-ru/ROADMAP.md) - Entwicklungs-Roadmap

### 📋 Projektdokumentation

- **`src/features/README.md`** - Übersicht aller Features mit Prioritäten und Status
- **Sprachversionen**: Verfügbar in 13 Sprachen über den Wechsler oben

## Entwicklung

### Verfügbare Skripte

- `bun dev` - Next.js im Entwicklungsmodus ausführen
- `bun tauri dev` - Tauri im Entwicklungsmodus ausführen
- `bun build` - Next.js erstellen
- `bun tauri build` - Tauri-Anwendung erstellen

#### Linting und Formatierung

- `bun lint` - JavaScript/TypeScript-Code mit ESLint überprüfen
- `bun lint:fix` - ESLint-Fehler beheben
- `bun lint:css` - CSS-Code mit Stylelint überprüfen
- `bun lint:css:fix` - Stylelint-Fehler beheben
- `bun format:imports` - Importe formatieren
- `bun lint:rust` - Rust-Code mit Clippy überprüfen
- `bun format:rust` - Rust-Code mit rustfmt formatieren
- `bun check:all` - Alle Überprüfungen und Tests ausführen
- `bun fix:all` - Alle Linting-Fehler beheben

#### Tests

- `bun test` - Tests ausführen
- `bun test:app` - Tests nur für Anwendungskomponenten ausführen
- `bun test:coverage` - Tests mit Coverage-Bericht ausführen
- `bun test:ui` - Tests mit UI-Oberfläche ausführen
- `bun test:e2e` - End-to-End-Tests mit Playwright ausführen

### Tests

Das Projekt verwendet Vitest für Unit-Tests. Tests befinden sich neben den getesteten Dateien mit den Erweiterungen `.test.ts` oder `.test.tsx`.

```bash
# Alle Tests ausführen
bun test

# Tests mit Coverage-Bericht ausführen
bun test:coverage
```

## Lizenz

Dieses Projekt wird unter der MIT-Lizenz mit Commons Clause verteilt.

**Hauptbedingungen:**

- **Open Source**: Sie können den Code frei verwenden, modifizieren und verteilen gemäß den Bedingungen der MIT-Lizenz.
- **Kommerzielle Nutzungsbeschränkung**: Commons Clause verbietet das "Verkaufen" der Software ohne separate Vereinbarung mit dem Autor.
- **"Verkaufen"** bedeutet die Nutzung der Software-Funktionalität zur Bereitstellung eines Produkts oder einer Dienstleistung für Dritte gegen Gebühr.

Diese Lizenz erlaubt:

- Verwendung des Codes für persönliche und nicht-kommerzielle Projekte
- Studium und Modifikation des Codes
- Verteilung von Modifikationen unter derselben Lizenz

Aber verbietet:

- Erstellung kommerzieller Produkte oder Dienstleistungen basierend auf dem Code ohne Lizenz

Für eine kommerzielle Lizenz kontaktieren Sie bitte den Autor: ak.chatman.media@gmail.com

Der vollständige Lizenztext ist in der Datei [LICENSE](./LICENSE) verfügbar.

## Zusätzliche Ressourcen

- [Next.js-Dokumentation](https://nextjs.org/docs)
- [Tauri-Dokumentation](https://v2.tauri.app/start/)
- [XState-Dokumentation](https://xstate.js.org/docs/)
- [Vitest-Dokumentation](https://vitest.dev/guide/)
- [Tailwind CSS-Dokumentation](https://tailwindcss.com/docs)
- [Stylelint-Dokumentation](https://stylelint.io/)
- [ESLint-Dokumentation](https://eslint.org/docs/latest/)
- [Playwright-Dokumentation](https://playwright.dev/docs/intro)
- [TypeDoc-Dokumentation](https://typedoc.org/)

## GitHub Pages

Das Projekt verwendet GitHub Pages zum Hosten der API-Dokumentation und der Werbeseite:

- **Werbeseite**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API-Dokumentation**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Beide Seiten werden automatisch aktualisiert, wenn entsprechende Dateien im `main`-Branch über GitHub Actions-Workflows geändert werden.
