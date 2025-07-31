# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

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
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/uvSBCw6e)

</div>

## Panoramica del Progetto

Timeline Studio è un editor video moderno basato sull'architettura Tauri (Rust + React).

**Il nostro obiettivo**: creare un editor che combini:
- **Potenza professionale di DaVinci Resolve** - controllo completo su editing, color grading, mixing audio, effetti visivi, motion graphics e compositing avanzato
- **Vasta libreria creativa** - effetti, filtri, transizioni, template multi-camera, titoli animati, template di stile e preset sottotitoli paragonabili ad editor popolari come Filmora
- **Scripting e automazione AI** - generazione automatica di contenuti in diverse lingue e per diverse piattaforme

**Innovazione chiave**: È sufficiente che gli utenti carichino video, musica e altre risorse, e l'AI creerà automaticamente un set di video in diverse lingue e ottimizzati per diverse piattaforme (YouTube, TikTok, Vimeo, Telegram).

![Timeline Interface #1](/public/screen2.png)

![Timeline Interface #2](/public/screen4.png)

### Stato del Progetto (Giugno 2025)

**Completamento Totale: 54.2%** ⬆️ (ricalcolato con completamento export e 14 nuovi moduli pianificati)
- **Completati**: 12 moduli (100% pronti)
- **In sviluppo**: 8 moduli (45-85% pronti)
- **Pianificati**: 4 moduli (30-80% pronti)
- **Nuovi pianificati**: 14 moduli (0% pronti) - [dettagli in planned/](docs-ru/08-roadmap/planned/)

### Risultati Chiave:
- ✅ **Video Compiler** - completamente implementato con accelerazione GPU (100%)
- ✅ **Timeline** - editor principale completamente funzionale (100%)
- ✅ **Gestione Media** - gestione file pronta (100%)
- ✅ **Architettura Core** - app-state, browser, modali, impostazioni utente/progetto (100%)
- ✅ **Riconoscimento** - riconoscimento oggetti e volti YOLO v11 (100%)
- ✅ **Effetti/Filtri/Transizioni** - ricca libreria effetti stile Filmora (75-80%)
- ✅ **Export** - completamente pronto con supporto 4 tab (100%)
- ✅ **Pannello Risorse** - UI principale pronta, drag & drop mancante (80%)
- ❗ **Chat AI** - richiede integrazione API reale (30%)
- 📋 **14 nuovi moduli pianificati** - [vedi planned/](docs-ru/08-roadmap/planned/) per raggiungere il livello DaVinci + Filmora
- 🎯 **Obiettivo** - combinare la potenza di DaVinci e la libreria di Filmora con automazione AI

## Caratteristiche Principali

- 🎬 Editing video professionale con timeline multi-traccia
- 🖥️ Cross-platform (Windows, macOS, Linux)
- 🚀 Elaborazione video accelerata GPU (NVENC, QuickSync, VideoToolbox)
- 🤖 Riconoscimento oggetti/volti basato su AI (YOLO v11 - ORT corretto)
- 🎨 30+ transizioni, effetti visivi e filtri
- 📝 Sistema sottotitoli avanzato con 12 stili e animazioni
- 🎵 Editing audio multi-traccia con effetti
- 📤 Export in MP4/MOV/WebM con integrazione OAuth social media
- 🔐 Supporto OAuth YouTube/TikTok/Vimeo/Telegram con archiviazione token sicura
- 📱 Preset dispositivi (iPhone, iPad, Android) per export ottimizzati
- 🌐 Supporto internazionalizzazione (13 lingue)
- 💾 Caching intelligente e sistema preview unificato
- 🎨 UI moderna usando Tailwind CSS v4, shadcn-ui
- 📚 Documentazione completa con più di 5.000 test e oltre l'80% di copertura del codice

## Iniziare

### Prerequisiti

- [Node.js](https://nodejs.org/) (v18 o superiore)
- [Rust](https://www.rust-lang.org/tools/install) (ultima versione stabile)
- [bun](https://bun.sh/) (ultima versione stabile)
- [ffmpeg](https://ffmpeg.org/download.html) (ultima versione stabile)

**Utenti Windows**: Consultare [docs-ru/06-deployment/platforms/windows-build.md](docs-ru/06-deployment/platforms/windows-build.md) per istruzioni dettagliate di setup inclusa la configurazione FFmpeg.

### Installazione

1. Clona il repository:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Installa le dipendenze:

```bash
bun install
```

### Avvio in Modalità Sviluppo

```bash
bun run tauri dev
```

### Build di Rilascio

```bash
bun run tauri build
```

## Documentazione

### 📚 Documentazione Principale

- 📚 [Panoramica Documentazione](docs-ru/README.md) - Mappa completa della documentazione
- 🚀 [Guida Introduttiva](docs-ru/01-getting-started/README.md) - Installazione e primi passi
- 🏗️ [Guida Architettura](docs-ru/02-architecture/README.md) - Architettura del sistema
- 🎯 [Guida Funzionalità](docs-ru/03-features/README.md) - Panoramica e stato delle funzionalità
- 📡 [Riferimento API](docs-ru/04-api-reference/README.md) - Riferimento comandi Tauri
- 🧪 [Guida Sviluppo](docs-ru/05-development/README.md) - Testing e sviluppo
- 🚀 [Guida Deployment](docs-ru/06-deployment/README.md) - Build e deployment
- 📋 [Guide Utente](docs-ru/07-guides/README.md) - Performance e best practices
- 🛣️ [Roadmap](docs-ru/08-roadmap/README.md) - Roadmap di sviluppo
- 🔐 [Setup OAuth](docs-ru/09-oauth-setup/oauth-setup-guide.md) - Integrazione social media

### 📋 Documentazione Progetto

- **`src/features/README.md`** - panoramica di tutte le funzionalità con priorità e stato
- **Versioni linguistiche**: Disponibile in 11 lingue tramite il selettore sopra

## Sviluppo

### Avvio Rapido

```bash
# Modalità sviluppo
bun run tauri dev

# Esegui test
bun run test && bun run test:rust

# Controlla qualità codice
bun run check:all
```

### Comandi Essenziali

| Comando | Descrizione |
|---------|-------------|
| `bun run tauri dev`   | Avvia applicazione completa in sviluppo |
| `bun run dev`         | Avvia solo frontend                     |
| `bun run build`       | Build per produzione                    |
| `bun run test`        | Esegui test frontend                    |
| `bun run test:rust`   | Esegui test backend                     |
| `bun run lint`        | Controlla qualità codice                |
| `bun run fix:all`     | Risolvi automaticamente problemi codice |

📚 **[Guida Sviluppo Completa →](docs-ru/05-development/README.md)**

### Stato Copertura Test

- ✅ **Test Frontend**: 4122 superati
- ✅ **Test Backend**: 798 superati
- ✅ **Test E2E**: 927 superati
- 📊 **Totale**: >5.000 test superati

## CI/CD & Qualità Codice

### Workflow Automatizzati
- ✅ **Linting**: ESLint, Stylelint, Clippy
- ✅ **Testing**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Coverage**: Integrazione Codecov
- ✅ **Build**: Build cross-platform

📚 **[Guida CI/CD Dettagliata →](docs-ru/06-deployment/README.md)**  
🔧 **[Linting & Formattazione →](docs-ru/05-development/linting-and-formatting.md)**

## Documentazione & Risorse

- 📚 [**Documentazione API**](https://chatman-media.github.io/timeline-studio/api-docs/) - Documentazione TypeScript auto-generata
- 🚀 [**Sito Web**](https://chatman-media.github.io/timeline-studio/) - Vetrina del progetto
- 📖 [**Documentazione Completa**](docs-ru/README.md) - Guida completa in russo

## Risorse Aggiuntive

- [Documentazione Tauri](https://v2.tauri.app/start/)
- [Documentazione XState](https://xstate.js.org/docs/)
- [Documentazione Vitest](https://vitest.dev/guide/)
- [Documentazione Tailwind CSS](https://tailwindcss.com/docs)
- [Documentazione Shadcn UI](https://ui.shadcn.com/)
- [Documentazione Stylelint](https://stylelint.io/)
- [Documentazione ESLint](https://eslint.org/docs/latest/)
- [Documentazione Playwright](https://playwright.dev/docs/intro)
- [Documentazione TypeDoc](https://typedoc.org/)
- [Documentazione ffmpeg](https://ffmpeg.org/documentation.html)

## Licenza

Questo progetto è distribuito sotto Licenza MIT con condizione Commons Clause.

**Termini principali:**

- **Open Source**: Puoi liberamente usare, modificare e distribuire il codice secondo i termini della Licenza MIT.
- **Restrizione Uso Commerciale**: Commons Clause proibisce la "vendita" del software senza un accordo separato con l'autore.
- **"Vendere"** significa utilizzare la funzionalità del software per fornire a terzi un prodotto o servizio a pagamento.

Questa licenza permette:

- Usare il codice per progetti personali e non commerciali
- Studiare e modificare il codice
- Distribuire modifiche sotto la stessa licenza

Ma proibisce:

- Creare prodotti o servizi commerciali basati sul codice senza una licenza

Per ottenere una licenza commerciale, contattare l'autore: ak.chatman.media@gmail.com

Il testo completo della licenza è disponibile nel file [LICENSE](./LICENSE)

## GitHub Pages

Il progetto usa GitHub Pages per ospitare la documentazione API e la pagina promo:

- **Pagina Promo**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **Documentazione API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Entrambe le pagine vengono aggiornate automaticamente quando i file corrispondenti vengono modificati nel branch `main` utilizzando i workflow GitHub Actions.