# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## Aperçu du Projet

Timeline Studio est une application de montage vidéo professionnelle construite avec des technologies web modernes et des performances natives. Notre objectif est de créer un éditeur de niveau DaVinci Resolve accessible à tous.

![Timeline Interface](/public/screen3.png)

### Statut du Projet (Juin 2025)

**Achèvement Global : 75%**
- ✅ Fonctionnalité d'édition de base terminée
- ✅ Compilateur vidéo avec accélération GPU
- ✅ Module de reconnaissance (YOLO v11)
- ✅ Effets, filtres et transitions
- ⚠️ Interface d'exportation à terminer (25%)
- ⚠️ Panneau de ressources en développement (40%)
- 🎯 Objectif de sortie MVP : Fin juin 2025

## Fonctionnalités Principales

- 🎬 Montage vidéo professionnel avec timeline multi-pistes
- 🖥️ Multi-plateforme (Windows, macOS, Linux)
- 🚀 Traitement vidéo accéléré par GPU (NVENC, QuickSync, VideoToolbox)
- 🤖 Reconnaissance d'objets/visages alimentée par l'IA (YOLO v11)
- 🎨 Plus de 30 transitions, effets visuels et filtres
- 📝 Système de sous-titres avancé avec 12 styles et animations
- 🎵 Montage audio multi-pistes avec effets
- 🧠 Gestion d'état utilisant XState v5
- 🌐 Support d'internationalisation (6 langues)
- 💾 Cache intelligent et génération d'aperçus
- 🎨 Interface moderne utilisant Tailwind CSS v4, shadcn-ui
- 📚 Documentation complète avec plus de 80% de couverture de tests

## Commencer

### Prérequis

- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- [Rust](https://www.rust-lang.org/tools/install) (dernière version stable)
- [bun](https://bun.sh/) (dernière version stable)
- [ffmpeg](https://ffmpeg.org/download.html) (dernière version stable)

### Installation

1. Cloner le dépôt :

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Installer les dépendances :

```bash
bun install
```

### Lancement en Mode Développement

```bash
bun run tauri dev
```

### Build de Release

```bash
bun run tauri build
```

## Structure du Projet

```
timeline-studio/
├── bin/                              # Scripts shell
├── docs/                             # Documentation générée automatiquement
├── docs-ru/                      # Docs générées par IA pour développeurs et agents
├── examples/                         # Exemples d'utilisation API
├── promo/                            # Site web GitHub Pages
├── public/                           # Fichiers statiques
├── scripts/                          # Scripts JavaScript
├── src/                              # Code source frontend (React, XState, Next.js)
│   ├── app/                          # Point d'entrée principal de l'application
│   ├── components/                   # Composants partagés
│   ├── features/                     # Fonctionnalités
│   │   ├── ai-chat/                  # Chatbot IA (assistant interactif)
│   │   ├── app-state/                # État global de l'application
│   │   ├── browser/                  # Navigateur de fichiers média (panneau de fichiers)
│   │   ├── camera-capture/           # Capture vidéo/photo caméra
│   │   ├── effects/                  # Effets vidéo et leurs paramètres
│   │   ├── export/                   # Export vidéo et projet
│   │   ├── filters/                  # Filtres vidéo (correction couleur, styles)
│   │   ├── keyboard-shortcuts/       # Raccourcis clavier et préréglages
│   │   ├── media/                    # Gestion fichiers média (audio/vidéo)
│   │   ├── media-studio/             # Studio de montage média
│   │   ├── modals/                   # Fenêtres modales (dialogues)
│   │   ├── music/                    # Import et gestion musique
│   │   ├── options/                  # Export et paramètres projet
│   │   ├── project-settings/         # Paramètres projet (taille, fps, etc.)
│   │   ├── recognition/              # Reconnaissance scène et objets
│   │   ├── resources/                # Gestion ressources projet
│   │   ├── style-templates/          # Modèles de styles et design
│   │   ├── subtitles/                # Import et édition sous-titres
│   │   ├── templates/                # Modèles vidéo et préréglages
│   │   ├── timeline/                 # Timeline de montage principale
│   │   ├── top-bar/                  # Panneau de contrôle supérieur
│   │   ├── transitions/              # Transitions vidéo entre clips
│   │   ├── user-settings/            # Paramètres utilisateur
│   │   ├── video-player/             # Lecteur vidéo
│   │   ├── voice-recording/          # Enregistrement vocal et voix off
│   │   ├── script-generator/         # Nouveau : génération de scripts
│   │   ├── montage-planner/          # Nouveau : planification montage
│   │   ├── person-identification/    # Nouveau : identification personnes
│   │   ├── scene-analyzer/           # Nouveau : analyse de scènes
│   │   └── README.md                 # Aperçu de toutes les fonctionnalités
│   ├── i18n/                         # Internationalisation
│   ├── lib/                          # Utilitaires et bibliothèques
│   ├── styles/                       # Styles globaux
|   ├── test/                         # Configuration tests et utilitaires
├── src-tauri/                        # Backend (Rust)
│   ├── src/
│   │   ├── main.rs                   # Point d'entrée Tauri
│   │   ├── media.rs                  # Analyse média (FFmpeg)
│   │   ├── recognition.rs            # YOLO pour objets/visages
│   │   ├── script_generator.rs       # Génération scripts (Claude/OpenAI/Grok API)
│   │   ├── montage_planner.rs        # Planification montage
│   │   ├── person_identification.rs  # Identification personnes
│   │   ├── scene_analyzer.rs         # Analyse scènes
│   │   └── ai_chat.rs                # Traitement chat
└── package.json                      # Configuration dépendances Node.js
```

## Documentation

### 📚 Documentation Principale

- 📚 [Carte de Documentation](docs-ru/MAP.md) - Aperçu complet de la documentation
- 🏗️ [Guide Architecture](docs-ru/ARCHITECTURE.md) - Architecture système
- 🧪 [Guide de Tests](docs-ru/testing/TESTING.md) - Stratégies de test
- 📡 [Référence API](docs-ru/API.md) - Référence commandes Tauri
- 🚀 [Guide de Déploiement](docs-ru/deployment/DEPLOYMENT.md) - Build et déploiement
- 🛣️ [Feuille de Route](docs-ru/ROADMAP.md) - Feuille de route développement

### 📋 Documentation du Projet

- **`src/features/README.md`** - aperçu de toutes les fonctionnalités avec priorités et statut
- **Versions linguistiques** : Disponible en 13 langues via le sélecteur ci-dessus

## Développement

### Scripts Disponibles

- `bun run dev` - Lancer Next.js en mode développement
- `bun run tauri dev` - Lancer Tauri en mode développement
- `bun run build` - Build Next.js
- `bun run tauri build` - Build application Tauri

#### Linting et Formatage

- `bun run lint` - Vérifier code JavaScript/TypeScript avec ESLint
- `bun run lint:fix` - Corriger erreurs ESLint
- `bun run lint:css` - Vérifier code CSS avec Stylelint
- `bun run lint:css:fix` - Corriger erreurs Stylelint
- `bun run format:imports` - Formater imports
- `bun run lint:rust` - Vérifier code Rust avec Clippy
- `bun run format:rust` - Formater code Rust avec rustfmt
- `bun run check:all` - Lancer toutes vérifications et tests
- `bun run fix:all` - Corriger toutes erreurs de linting

#### Tests

- `bun run test` - Lancer tests
- `bun run test:app` - Lancer tests composants application uniquement
- `bun run test:watch` - Lancer tests en mode surveillance
- `bun run test:ui` - Lancer tests avec interface UI
- `bun run test:e2e` - Lancer tests end-to-end avec Playwright

### Machines d'État (XState v5)

Le projet utilise XState v5 pour gérer la logique d'état complexe.

#### ✅ Machines d'État Implémentées (11) :

- `appSettingsMachine` - gestion des paramètres centralisés
- `browserStateMachine` - gestion état navigateur
- `chatMachine` - gestion chat IA
- `modalMachine` - gestion fenêtres modales
- `playerMachine` - gestion lecteur vidéo
- `resourcesMachine` - gestion ressources timeline
- `userSettingsMachine` - paramètres utilisateur
- `projectSettingsMachine` - paramètres projet
- `mediaMachine` - gestion fichiers média
- `timelineMachine` - Machine d'état timeline principale

### Tests

Le projet utilise Vitest pour les tests unitaires. Les tests sont situés dans le répertoire __tests__ de la fonctionnalité, avec les mocks dans __mocks__.

#### 🧪 Statut Couverture Tests :
```bash
⨯ bun run test

 Test Files  141 passed (141)
      Tests  1295 passed | 9 skipped (1304)
   Start at  23:20:43
   Duration  13.14s (transform 3.71s, setup 25.13s, collect 13.88s, tests 8.69s, environment 38.26s, prepare 8.96s)

⨯ bun run test:rust
   test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s

```

```bash
# Lancer tests client
bun run test

# Lancer tests rust
bun run test:rust

# Lancer tests avec rapport couverture
bun run test:coverage

# Lancer tests pour fonction spécifique
bun run test src/features/effects
```

## Intégration Continue et Déploiement

Le projet est configuré pour utiliser GitHub Actions pour l'intégration continue et le déploiement. Workflows :

### Vérification et Build

- `check-all.yml` - Lancer toutes vérifications et tests
- `lint-css.yml` - Vérifier code CSS uniquement (lance quand fichiers CSS changent)
- `lint-rs.yml` - Vérifier code Rust uniquement (lance quand fichiers Rust changent)
- `lint-js.yml` - Vérifier code JavaScript/TypeScript uniquement (lance quand fichiers JavaScript/TypeScript changent)

### Déploiement

- `build.yml` - Build projet
- `build-release.yml` - Build projet pour release
- `deploy-promo.yml` - Build et publier page promo sur GitHub Pages
- `docs.yml` - Générer et publier documentation API sur GitHub Pages

### Configuration Linter

#### Stylelint (CSS)

Le projet utilise Stylelint pour vérifier le code CSS. La configuration est située dans le fichier `.stylelintrc.json`. Fonctionnalités principales :

- Support des directives Tailwind CSS
- Ignorer sélecteurs dupliqués pour compatibilité Tailwind
- Correction automatique erreurs lors sauvegarde fichiers (dans VS Code)

Pour lancer le linter CSS, utiliser la commande :

```bash
bun lint:css
```

Pour correction automatique erreurs :

```bash
bun lint:css:fix
```

## Documentation API

La documentation API est disponible à : [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Pour générer la documentation localement, utiliser la commande :

```bash
bun run docs
```

La documentation sera disponible dans le dossier `docs/`.

Pour développement documentation en temps réel :

```bash
bun run docs:watch
```

La documentation est automatiquement mise à jour quand le code source change dans la branche `main` en utilisant le workflow GitHub Actions `docs.yml`.

## Page Promo

La page promo du projet est disponible à : [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

Le code source de la page promo est situé dans le dossier `promo/`.

Pour développement local de la page promo, utiliser les commandes :

```bash
cd promo
bun install
bun run dev
```

Pour build la page promo :

```bash
cd promo
bun run build
```

La page promo est automatiquement mise à jour quand les fichiers changent dans le dossier `promo/` sur la branche `main` en utilisant le workflow GitHub Actions `deploy-promo.yml`.

## Ressources Supplémentaires

- [Documentation Tauri](https://v2.tauri.app/start/)
- [Documentation XState](https://xstate.js.org/docs/)
- [Documentation Vitest](https://vitest.dev/guide/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation Shadcn UI](https://ui.shadcn.com/)
- [Documentation Stylelint](https://stylelint.io/)
- [Documentation ESLint](https://eslint.org/docs/latest/)
- [Documentation Playwright](https://playwright.dev/docs/intro)
- [Documentation TypeDoc](https://typedoc.org/)
- [Documentation ffmpeg](https://ffmpeg.org/documentation.html)

## Licence

Ce projet est distribué sous la Licence MIT avec condition Commons Clause.

**Termes Principaux :**

- **Open Source** : Vous pouvez librement utiliser, modifier et distribuer le code conformément aux termes de la licence MIT.
- **Restriction d'Usage Commercial** : Commons Clause interdit de "vendre" le logiciel sans accord séparé avec l'auteur.
- **"Vendre"** signifie utiliser la fonctionnalité du logiciel pour fournir à des tiers un produit ou service contre rémunération.

Cette licence permet :

- Utiliser le code pour des projets personnels et non commerciaux
- Étudier et modifier le code
- Distribuer les modifications sous la même licence

Mais interdit :

- Créer des produits ou services commerciaux basés sur le code sans licence

Pour obtenir une licence commerciale, veuillez contacter l'auteur : ak.chatman.media@gmail.com

Le texte complet de la licence est disponible dans le fichier [LICENSE](./LICENSE)

## GitHub Pages

Le projet utilise GitHub Pages pour héberger la documentation API et la page promo :

- **Page Promo** : [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **Documentation API** : [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Les deux pages sont automatiquement mises à jour quand les fichiers correspondants changent dans la branche `main` en utilisant les workflows GitHub Actions.