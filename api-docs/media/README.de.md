# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=for-the-badge&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=for-the-badge&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Lint CSS](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-css.yml?style=for-the-badge&label=lint%20css)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=for-the-badge&label=lint%20ts)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=for-the-badge&label=lint%20rust)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)

[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=for-the-badge&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=for-the-badge&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## Projektübersicht

Timeline Studio ist ein moderner Video-Editor, der auf der Tauri-Architektur (Rust + React) basiert.

**Unser Ziel**: einen Editor zu schaffen, der Folgendes vereint:
- **Professionelle Leistung von DaVinci Resolve** - vollständige Kontrolle über Schnitt, Farbkorrektur, Audio-Mixing, visuelle Effekte, Motion Graphics und erweiterte Komposition
- **Umfangreiche Kreativ-Bibliothek** - Effekte, Filter, Übergänge, Mehrkamera-Vorlagen, animierte Titel, Stilvorlagen und Untertitel-Presets vergleichbar mit beliebten Editoren wie Filmora
- **KI-Scripting und Automatisierung** - automatische Inhaltsgenerierung in verschiedenen Sprachen und für verschiedene Plattformen

**Schlüsselinnovation**: Es genügt, wenn Nutzer Videos, Musik und andere Ressourcen hochladen, und die KI erstellt automatisch eine Reihe von Videos in verschiedenen Sprachen und optimiert für verschiedene Plattformen (YouTube, TikTok, Vimeo, Telegram).

![Timeline-Oberfläche #1](/public/screen2.png)

![Timeline-Oberfläche #2](/public/screen4.png)

### Projektstatus (Juni 2025)

**Gesamte Fertigstellung: 53.8%** ⬆️ (neu berechnet mit realem Modulstatus und 14 neuen geplanten Modulen)
- **Abgeschlossen**: 11 Module (100% bereit) 
- **In Entwicklung**: 8 Module (45-85% bereit)
- **Geplant**: 5 Module (30-85% bereit)
- **Neu geplant**: 14 Module (0% bereit) - [Details in planned/](docs-ru/08-roadmap/planned/)

### Wichtige Errungenschaften:
- ✅ **Video Compiler** - vollständig implementiert mit GPU-Beschleunigung (100%)
- ✅ **Timeline** - Haupteditor vollständig funktional (100%)
- ✅ **Medienverwaltung** - Dateiverwaltung bereit (100%)
- ✅ **Kernarchitektur** - app-state, browser, modals, user/project settings (100%)
- ✅ **Erkennung** - YOLO v11 Objekt- und Gesichtserkennung (100%)
- 🔄 **Effekte/Filter/Übergänge** - reiche Effektbibliothek im Filmora-Stil (75-80%)
- 🔄 **Export** - fast fertig, Parameterdetails bleiben (85%)
- 🔄 **Ressourcen-Panel** - Haupt-UI bereit, Drag & Drop fehlt (80%)
- ❗ **AI Chat** - erfordert echte API-Integration (30%)
- 📋 **14 neue geplante Module** - [siehe planned/](docs-ru/08-roadmap/planned/) um DaVinci + Filmora-Level zu erreichen
- 🎯 **Ziel** - DaVinci-Power und Filmora-Bibliothek mit AI-Automatisierung kombinieren

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

## Erste Schritte

### Voraussetzungen

- [Node.js](https://nodejs.org/) (v18 oder höher)
- [Rust](https://www.rust-lang.org/tools/install) (neueste stabile Version)
- [bun](https://bun.sh/) (neueste stabile Version)
- [ffmpeg](https://ffmpeg.org/download.html) (neueste stabile Version)

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

### Entwicklungsmodus starten

```bash
bun run tauri dev
```

### Release-Build

```bash
bun run tauri build
```

## Dokumentation

### 📚 Hauptdokumentation

- 📚 [Dokumentationsübersicht](docs-ru/README.md) - Vollständige Dokumentationsübersicht
- 🚀 [Erste Schritte](docs-ru/01-getting-started/README.md) - Installation und erste Schritte
- 🏗️ [Architektur-Leitfaden](docs-ru/02-architecture/README.md) - Systemarchitektur
- 🎯 [Feature-Leitfaden](docs-ru/03-features/README.md) - Feature-Übersicht und Status
- 📡 [API-Referenz](docs-ru/04-api-reference/README.md) - Tauri-Befehle Referenz
- 🧪 [Entwicklungs-Leitfaden](docs-ru/05-development/README.md) - Tests und Entwicklung
- 🚀 [Deployment-Leitfaden](docs-ru/06-deployment/README.md) - Build und Deployment
- 📋 [Benutzer-Leitfäden](docs-ru/07-guides/README.md) - Performance und Best Practices
- 🛣️ [Roadmap](docs-ru/08-roadmap/README.md) - Entwicklungs-Roadmap
- 🔐 [OAuth-Setup](docs-ru/09-oauth-setup/oauth-setup-guide.md) - Social Media Integration

### 📋 Projektdokumentation

- **`src/features/README.md`** - Übersicht aller Features mit Prioritäten und Status
- **Sprachversionen**: Verfügbar in 11 Sprachen über den Wechsler oben

## Entwicklung

### Schnellstart

```bash
# Entwicklungsmodus
bun run tauri dev

# Tests ausführen
bun run test && bun run test:rust

# Code-Qualität prüfen
bun run check:all
```

### Wichtige Befehle

| Befehl | Beschreibung |
|--------|-------------|
| `bun run tauri dev` | Vollständige Anwendung in Entwicklung starten |
| `bun run dev` | Nur Frontend starten |
| `bun run build` | Für Produktion erstellen |
| `bun run test` | Frontend-Tests ausführen |
| `bun run test:rust` | Backend-Tests ausführen |
| `bun run lint` | Code-Qualität prüfen |
| `bun run fix:all` | Code-Probleme automatisch beheben |

📚 **[Vollständiger Entwicklungsleitfaden →](docs-ru/05-development/README.md)**

### Test-Abdeckungsstatus

✅ **Frontend-Tests**: 3,604 bestanden  
✅ **Backend-Tests**: 554 bestanden (+18 neue!)  
📊 **Gesamt**: 4,158 Tests bestanden
- `bun run test:coverage:report` - Test-Coverage-Bericht generieren und übermitteln
- `bun run test:rust` - Rust-Backend-Tests ausführen
- `bun run test:rust:watch` - Rust-Tests im Watch-Modus ausführen
- `bun run test:coverage:rust` - Rust-Tests mit Coverage ausführen
- `bun run test:coverage:rust:report` - Rust-Coverage-Bericht generieren und übermitteln
- `bun run test:ui` - Tests mit UI-Oberfläche ausführen
- `bun run test:e2e` - End-to-End-Tests mit Playwright ausführen
- `bun run test:e2e:ui` - E2E-Tests mit Playwright UI ausführen
- `bun run test:e2e:basic` - Basis-E2E-Test für Medien-Import ausführen
- `bun run test:e2e:real` - E2E-Tests mit echten Mediendateien ausführen
- `bun run test:e2e:integration` - Integrations-E2E-Tests ausführen (erfordert INTEGRATION_TEST=true)
- `bun run playwright:install` - Playwright-Browser installieren

### Tests

Das Projekt verwendet Vitest für Unit-Tests. Tests befinden sich im __tests__ Verzeichnis jedes Features, zusammen mit Mocks in __mocks__.

## CI/CD und Code-Qualität

### Automatisierte Prozesse
- ✅ **Linting**: ESLint, Stylelint, Clippy
- ✅ **Tests**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Abdeckung**: Codecov-Integration
- ✅ **Build**: Plattformübergreifende Builds

📚 **[Detaillierter CI/CD-Leitfaden →](docs-ru/06-deployment/README.md)**  
🔧 **[Linting und Formatierung →](docs-ru/05-development/linting-and-formatting.md)**

## Dokumentation und Ressourcen

- 📚 [**API-Dokumentation**](https://chatman-media.github.io/timeline-studio/api-docs/) - Auto-generierte TypeScript-Dokumentation
- 🚀 [**Promo-Seite**](https://chatman-media.github.io/timeline-studio/) - Projekt-Showcase
- 📖 [**Vollständige Dokumentation**](docs-ru/README.md) - Vollständiger Leitfaden auf Russisch
- 🎬 [**Live-Demo**](https://chatman-media.github.io/timeline-studio/) - Probieren Sie den Editor online aus

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

- [Tauri-Dokumentation](https://v2.tauri.app/start/)
- [XState-Dokumentation](https://xstate.js.org/docs/)
- [Vitest-Dokumentation](https://vitest.dev/guide/)
- [Tailwind CSS-Dokumentation](https://tailwindcss.com/docs)
- [Shadcn UI-Dokumentation](https://ui.shadcn.com/)
- [Stylelint-Dokumentation](https://stylelint.io/)
- [ESLint-Dokumentation](https://eslint.org/docs/latest/)
- [Playwright-Dokumentation](https://playwright.dev/docs/intro)
- [TypeDoc-Dokumentation](https://typedoc.org/)
- [ffmpeg-Dokumentation](https://ffmpeg.org/documentation.html)

## GitHub Pages

Das Projekt verwendet GitHub Pages zum Hosten der API-Dokumentation und der Werbeseite:

- **Werbeseite**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API-Dokumentation**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Beide Seiten werden automatisch aktualisiert, wenn entsprechende Dateien im `main`-Branch über GitHub Actions-Workflows geändert werden.
