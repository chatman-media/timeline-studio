# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

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

## Aperçu du Projet

Timeline Studio est un éditeur vidéo moderne construit sur l'architecture Tauri (Rust + React).

**Notre objectif** : créer un éditeur qui combine :
- **La puissance professionnelle de DaVinci Resolve** - contrôle complet sur le montage, l'étalonnage des couleurs, le mixage audio, les effets visuels, les graphiques animés et la composition avancée
- **Une vaste bibliothèque créative** - effets, filtres, transitions, modèles multi-caméras, titres animés, modèles de style et préréglages de sous-titres comparables aux éditeurs populaires comme Filmora
- **Script et automatisation IA** - génération automatique de contenu dans différentes langues et pour différentes plateformes

**Innovation clé** : Il suffit aux utilisateurs de télécharger des vidéos, de la musique et d'autres ressources, et l'IA créera automatiquement un ensemble de vidéos dans différentes langues et optimisées pour différentes plateformes (YouTube, TikTok, Vimeo, Telegram).

![Interface Timeline #1](/public/screen2.png)

![Interface Timeline #2](/public/screen4.png)

### Statut du Projet (Juin 2025)

**Achèvement Global : 53.8%** ⬆️ (recalculé avec état réel des modules et 14 nouveaux modules planifiés)
- **Terminé** : 11 modules (100% prêt) 
- **En développement** : 8 modules (45-85% prêt)
- **Planifié** : 5 modules (30-85% prêt)
- **Nouveaux planifiés** : 14 modules (0% prêt) - [détails dans planned/](docs-ru/08-roadmap/planned/)

### Réalisations Clés :
- ✅ **Video Compiler** - complètement implémenté avec accélération GPU (100%)
- ✅ **Timeline** - éditeur principal complètement fonctionnel (100%)
- ✅ **Gestion des Médias** - gestion des fichiers prête (100%)
- ✅ **Architecture Centrale** - app-state, browser, modals, user/project settings (100%)
- ✅ **Reconnaissance** - reconnaissance d'objets et visages YOLO v11 (100%)
- 🔄 **Effets/Filtres/Transitions** - riche bibliothèque d'effets style Filmora (75-80%)
- 🔄 **Export** - presque prêt, il reste des détails de paramètres (85%)
- 🔄 **Panneau de Ressources** - UI principal prêt, manque drag & drop (80%)
- ❗ **AI Chat** - nécessite intégration API réelle (30%)
- 📋 **14 nouveaux modules planifiés** - [voir planned/](docs-ru/08-roadmap/planned/) pour atteindre le niveau DaVinci + Filmora
- 🎯 **Objectif** - combiner puissance DaVinci et bibliothèque Filmora avec automatisation IA

## Fonctionnalités Principales

- 🎬 Montage vidéo professionnel avec timeline multi-pistes
- 🖥️ Multi-plateforme (Windows, macOS, Linux)
- 🚀 Traitement vidéo accéléré par GPU (NVENC, QuickSync, VideoToolbox)
- 🤖 Reconnaissance d'objets/visages alimentée par l'IA (YOLO v11 - ORT corrigé)
- 🎨 Plus de 30 transitions, effets visuels et filtres
- 📝 Système de sous-titres avancé avec 12 styles et animations
- 🎵 Montage audio multi-pistes avec effets
- 📤 Export vers MP4/MOV/WebM avec intégration OAuth des réseaux sociaux
- 🔐 Support OAuth pour YouTube/TikTok/Vimeo/Telegram avec stockage sécurisé des tokens
- 📱 Préréglages d'appareils (iPhone, iPad, Android) pour des exports optimisés
- 🧠 Gestion d'état utilisant XState v5
- 🌐 Support d'internationalisation (11 langues)
- 💾 Cache intelligent et système d'aperçu unifié
- 🎨 Interface moderne utilisant Tailwind CSS v4, shadcn-ui
- 📚 Documentation complète avec 2400+ tests (98.8% de réussite)

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

### Démarrage Rapide

```bash
# Mode développement
bun run tauri dev

# Lancer tests
bun run test && bun run test:rust

# Vérifier qualité du code
bun run check:all
```

### Commandes Essentielles

| Commande | Description |
|----------|-------------|
| `bun run tauri dev` | Lancer application complète en développement |
| `bun run dev` | Lancer frontend uniquement |
| `bun run build` | Build pour production |
| `bun run test` | Lancer tests frontend |
| `bun run test:rust` | Lancer tests backend |
| `bun run lint` | Vérifier qualité du code |
| `bun run fix:all` | Auto-corriger problèmes de code |

📚 **[Guide Complet de Développement →](docs-ru/05-development/README.md)**

### Statut de Couverture des Tests

✅ **Tests Frontend** : 3,604 réussis  
✅ **Tests Backend** : 554 réussis (+18 nouveaux !)  
📊 **Total** : 4,158 tests réussis

## CI/CD et Qualité du Code

### Processus Automatisés
- ✅ **Linting** : ESLint, Stylelint, Clippy
- ✅ **Tests** : Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Couverture** : Intégration Codecov
- ✅ **Build** : Builds multi-plateformes

📚 **[Guide Détaillé CI/CD →](docs-ru/06-deployment/README.md)**  
🔧 **[Linting et Formatage →](docs-ru/05-development/linting-and-formatting.md)**

## Documentation et Ressources

- 📚 [**Documentation API**](https://chatman-media.github.io/timeline-studio/api-docs/) - Documentation TypeScript auto-générée
- 🚀 [**Page Promo**](https://chatman-media.github.io/timeline-studio/) - Vitrine du projet
- 📖 [**Documentation Complète**](docs-ru/README.md) - Guide complet en russe
- 🎬 [**Démo Live**](https://chatman-media.github.io/timeline-studio/) - Essayez l'éditeur en ligne

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