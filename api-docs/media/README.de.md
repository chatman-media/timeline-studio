# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=flat-square)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=flat-square&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Last Commit](https://img.shields.io/github/last-commit/chatman-media/timeline-studio?style=flat-square&label=last%20commit)](https://github.com/chatman-media/timeline-studio/commits/main)
[![GitHub commits](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=flat-square&label=commits)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=flat-square&label=downloads)](https://www.npmjs.com/package/timeline-studio)

[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](./docs/en/README.md)
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/BSddjvWk)

</div>

## 🎬 Projektübersicht

**Timeline Studio** - KI-gestützter Video-Editor, der Ihre Videos, Musik und Lieblingseffekte in Dutzende veröffentlichungsbereite Clips für alle Plattformen verwandelt!

### 🚀 Stellen Sie sich die Möglichkeiten vor

**Laden Sie Ihre Videos, Fotos, Musik einmal hoch** → erhalten Sie:
- 📱 **TikTok** - vertikale Shorts mit Trend-Effekten
- 📺 **YouTube** - vollständige Filme, kurze Clips, Shorts
- 📸 **Instagram** - Reels, Stories, Posts unterschiedlicher Länge
- ✈️ **Telegram** - optimierte Versionen für Kanäle und Chats

Der KI-Assistent erstellt die richtige Anzahl von Versionen für jede Plattform! 🤖

### 💡 Wie es funktioniert

> *"Erstelle ein Video über meine Asienreise für alle sozialen Medien" - und innerhalb von Minuten haben Sie fertige Optionen: dynamische Shorts für TikTok, atmosphärischer Vlog für YouTube, lebendige Stories für Instagram. Die KI wählt die besten Momente aus, synchronisiert mit Musik und passt für jede Plattform an.*

### ⚡ Warum das alles verändert

- **10x Zeitersparnis** - keine manuelle Anpassung für jedes Video mehr
- **KI versteht Trends** - weiß, was auf jedem sozialen Netzwerk funktioniert
- **Professionelle Qualität** - verwendet die gleichen Tools wie große Studios
- **Alles läuft lokal** - Ihre Inhalte bleiben privat

![Timeline-Oberfläche #1](/public/screen2.png)

![Timeline-Oberfläche #2](/public/screen4.png)

### Projektstatus (Juni 2025)

**Gesamte Fertigstellung: 58%** ⬆️ (neu berechnet mit API Keys Management bei 100% und 14 neuen geplanten Modulen)
- **Abgeschlossen**: 13 Module (100% bereit)
- **In Entwicklung**: 7 Module (45-90% bereit)
- **Geplant**: 4 Module (30-80% bereit)
- **Neu geplant**: 14 Module (0% bereit) - [Details in planned/](docs-ru/08-roadmap/planned/)

### Wichtige Errungenschaften:
- ✅ **Kernarchitektur** - Timeline, Video Compiler, Media Management (100%)
- ✅ **API Keys Management** - sichere Speicherung mit AES-256-GCM-Verschlüsselung (100%)
- ✅ **Erkennung** - YOLO v11 Objekt- und Gesichtserkennung (100%)
- ✅ **Export** - OAuth-Integration für YouTube/TikTok/Vimeo (100%)
- 🚧 **Effekte/Filter/Übergänge** - reiche Bibliothek in Arbeit (75-80%)
- 🚧 **Timeline AI** - Automatisierung mit 41 Claude-Tools (90%)

### Aktuelle Aufgaben:
- 🔄 **OAuth-Callback-Behandlung** - Abschluss der Social-Media-Integration
- ⏳ **HTTP-API-Validierung** - Echtzeit-Verbindungstests
- ⏳ **Import aus .env** - Migration bestehender Schlüssel

### Nächste Schritte:
1. **Social-Media-Integration** - vollständige OAuth-Flow-Implementierung
2. **Erweiterte Effekte** - Fertigstellung der Filmora-Stil-Bibliothek
3. **Timeline AI** - intelligente Videoerstellungs-Automatisierung

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
- 🌐 Internationalisierung-Support (13 Sprachen)
- 💾 Intelligente Zwischenspeicherung und einheitliches Vorschausystem
- 🎨 Moderne UI mit Tailwind CSS v4, shadcn-ui
- 📚 Vollständige Dokumentation mit 2400+ Tests (98.8% Erfolgsrate)

## Erste Schritte

### Schnelleinrichtung

```bash
# Klonen und installieren
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
bun install

# Im Entwicklungsmodus starten
bun run tauri dev
```

### Anforderungen
- Node.js v18+, Rust, Bun, FFmpeg

📚 **[Vollständige Installationsanleitung →](docs-ru/01-getting-started/README.md)**
🪟 **[Windows-Einrichtung →](docs-ru/06-deployment/platforms/windows-build.md)**

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

MIT-Lizenz mit Commons Clause - kostenlos für persönliche Nutzung, kommerzielle Nutzung erfordert Vereinbarung.

📄 **[Vollständige Lizenzdetails →](docs-ru/10-legal/license.md)** | 📧 **Kommerzielle Lizenz**: ak.chatman.media@gmail.com

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
