# Timeline Studio

**🌐 Language / Idioma / Langue / Sprache / Язык:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md)

Éditeur vidéo construit avec Tauri, React et XState.

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/website-Promo-brightgreen)](https://chatman-media.github.io/timeline-studio/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![DeepSource](https://app.deepsource.com/gh/chatman-media/timeline-studio.svg/?label=code+coverage&show_trend=true&token=zE1yrrYR6Jl7GK0R74LZx9MJ)](https://app.deepsource.com/gh/chatman-media/timeline-studio/)

## Aperçu du Projet

Timeline Studio est une application de bureau pour créer et éditer des vidéos. L'application utilise une architecture basée sur des machines à états finis (XState) pour gérer une logique d'état complexe.

![Interface Timeline](/public/screen3.png)

## 📊 État de Développement

### 🎯 Progression Générale : 76% Terminé (13/17 fonctionnalités)

```
Composants :     16/17 ✅ (94%)
Hooks :          14/17 ✅ (82%)
Services :       15/17 ✅ (88%)
Tests :          13/17 ✅ (76%)
Documentation :  17/17 ✅ (100%)
```

### 🔥 Tâches Critiques

- **Timeline** - nécessite une machine d'état, des hooks, la logique principale
- **Resources** - nécessite des composants UI pour la gestion
- **AI Chat** - nécessite une vérification de l'exhaustivité fonctionnelle
- **Options** - nécessite une expansion de fonctionnalité

### ✅ Composants Prêts

- **VideoPlayer** - lecteur vidéo entièrement fonctionnel
- **Browser** - navigateur de fichiers multimédias avec onglets
- **Media, Music, Effects, Filters, Transitions, Templates** - tout prêt
- **AppState, Modals, TopBar, MediaStudio** - infrastructure de base

### Fonctionnalités Principales

- 🎬 Création et édition de projets vidéo
- 🖥️ Multiplateforme (Windows, macOS, Linux)
- 🧠 Gestion d'état avec XState v5
- 🌐 Support d'internationalisation (i18n)
- 🎨 UI moderne avec Tailwind CSS v4
- 🔍 Contrôle strict de la qualité du code avec ESLint, Stylelint et Clippy
- 📚 Documentation complète pour tous les composants

## Commencer

### Prérequis

- [Node.js](https://nodejs.org/) (v18 ou supérieur)
- [Rust](https://www.rust-lang.org/tools/install) (dernière version stable)
- [bun](https://bun.sh/) (dernière version stable)

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

### Mode Développement

```bash
bun tauri dev
```

### Build de Production

```bash
bun tauri build
```

## Structure du Projet

```
timeline-studio/
├── src/                  # Code source frontend (React, Next.js)
│   ├── features/         # Modules de fonctionnalités de l'application (17 fonctionnalités)
│   │   ├── browser/      ✅ # Navigateur de fichiers multimédias avec onglets
│   │   ├── media/        ✅ # Gestion des fichiers multimédias
│   │   ├── video-player/ ✅ # Lecteur vidéo avec contrôles
│   │   ├── timeline/     ⚠️ # Timeline (nécessite du travail)
│   │   ├── resources/    ⚠️ # Ressources (nécessite des composants UI)
│   │   ├── ai-chat/      ❓ # Chat IA (nécessite vérification)
│   │   ├── options/      ⚠️ # Panneau d'options (nécessite expansion)
│   │   ├── music/        ✅ # Fichiers musicaux
│   │   ├── effects/      ✅ # Effets vidéo
│   │   ├── filters/      ✅ # Filtres d'image
│   │   ├── transitions/  ✅ # Transitions de clips
│   │   ├── subtitles/    ✅ # Sous-titres
│   │   ├── templates/    ✅ # Modèles de projet
│   │   ├── modals/       ✅ # Fenêtres modales
│   │   ├── app-state/    ✅ # État global
│   │   ├── top-bar/      ✅ # Barre de navigation supérieure
│   │   ├── media-studio/ ✅ # Composant racine
│   │   └── OVERVIEW.md   📚 # Aperçu de toutes les fonctionnalités
│   ├── i18n/             # Internationalisation
│   ├── types/            # Types TypeScript
│   ├── lib/              # Utilitaires et bibliothèques
│   └── components/       # Composants UI réutilisables
├── src-tauri/            # Code source backend (Rust)
│   ├── src/              # Code Rust
│   └── Cargo.toml        # Configuration des dépendances Rust
├── public/               # Fichiers statiques
├── DEV.md                📚 # Documentation développeur
├── README.ru.md          📚 # Documentation russe
└── package.json          # Configuration des dépendances Node.js
```

## 📚 Documentation

### 🗂️ Structure de Documentation

Chaque fonctionnalité contient une documentation détaillée :

- **`README.md`** - exigences fonctionnelles, état de préparation
- **`DEV.md`** - architecture technique, API, types de données

### 📋 Documents Clés

- **`src/features/OVERVIEW.md`** - aperçu de toutes les 17 fonctionnalités avec priorités
- **`DEV.md`** - architecture de l'application, machines d'état, plan de développement
- **`README.md`** - informations générales du projet (anglais)
- **`README.es.md`** - version espagnole de la documentation
- **`README.fr.md`** - version française de la documentation
- **`README.de.md`** - version allemande de la documentation
- **`README.ru.md`** - version russe de la documentation

## Développement

### Scripts Disponibles

- `bun dev` - Exécuter Next.js en mode développement
- `bun tauri dev` - Exécuter Tauri en mode développement
- `bun build` - Construire Next.js
- `bun tauri build` - Construire l'application Tauri

#### Linting et Formatage

- `bun lint` - Vérifier le code JavaScript/TypeScript avec ESLint
- `bun lint:fix` - Corriger les erreurs ESLint
- `bun lint:css` - Vérifier le code CSS avec Stylelint
- `bun lint:css:fix` - Corriger les erreurs Stylelint
- `bun format:imports` - Formater les importations
- `bun lint:rust` - Vérifier le code Rust avec Clippy
- `bun format:rust` - Formater le code Rust avec rustfmt
- `bun check:all` - Exécuter toutes les vérifications et tests
- `bun fix:all` - Corriger toutes les erreurs de linting

#### Tests

- `bun test` - Exécuter les tests
- `bun test:app` - Exécuter les tests uniquement pour les composants d'application
- `bun test:coverage` - Exécuter les tests avec rapport de couverture
- `bun test:ui` - Exécuter les tests avec interface UI
- `bun test:e2e` - Exécuter les tests end-to-end avec Playwright

### Machines d'État (XState v5)

Le projet utilise XState v5 pour gérer une logique d'état complexe.

#### ✅ Machines d'État Implémentées (10) :

- `appSettingsMachine` - gestion centralisée des paramètres
- `chatMachine` - gestion du chat IA
- `modalMachine` - gestion des fenêtres modales
- `playerMachine` - gestion du lecteur vidéo
- `resourcesMachine` - gestion des ressources de timeline
- `musicMachine` - gestion des fichiers musicaux
- `userSettingsMachine` - paramètres utilisateur
- `projectSettingsMachine` - paramètres de projet
- `mediaListMachine` - gestion des listes de fichiers multimédias
- `templateListMachine` - gestion des modèles

#### ❌ Nécessitent Implémentation (2) :

- `timelineMachine` - **CRITIQUE !** Machine d'état principale de timeline
- `optionsMachine` - gestion du panneau d'options

Voir `DEV.md` pour les détails.

### Tests

Le projet utilise Vitest pour les tests unitaires. Les tests sont situés à côté des fichiers testés avec les extensions `.test.ts` ou `.test.tsx`.

```bash
# Exécuter tous les tests
bun test

# Exécuter les tests avec rapport de couverture
bun test:coverage
```

## Licence

Ce projet est distribué sous la Licence MIT avec Commons Clause.

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

Pour une licence commerciale, veuillez contacter l'auteur : ak.chatman.media@gmail.com

Le texte complet de la licence est disponible dans le fichier [LICENSE](./LICENSE).

## Ressources Supplémentaires

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Tauri](https://v2.tauri.app/start/)
- [Documentation XState](https://xstate.js.org/docs/)
- [Documentation Vitest](https://vitest.dev/guide/)
- [Documentation Tailwind CSS](https://tailwindcss.com/docs)
- [Documentation Stylelint](https://stylelint.io/)
- [Documentation ESLint](https://eslint.org/docs/latest/)
- [Documentation Playwright](https://playwright.dev/docs/intro)
- [Documentation TypeDoc](https://typedoc.org/)

## GitHub Pages

Le projet utilise GitHub Pages pour héberger la documentation API et la page promotionnelle :

- **Page Promotionnelle** : [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **Documentation API** : [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Les deux pages sont automatiquement mises à jour lorsque les fichiers correspondants changent dans la branche `main` via les workflows GitHub Actions.
