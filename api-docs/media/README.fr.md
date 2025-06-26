# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=for-the-badge&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=for-the-badge&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=for-the-badge&label=frontend&flag=frontend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=for-the-badge&label=backend&flag=backend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![GitHub commits](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=for-the-badge&label=commits)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=for-the-badge&label=npm%20downloads)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/visit-website-brightgreen?style=for-the-badge&logo=globe&logoColor=white)](https://chatman-media.github.io/timeline-studio/)

[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

</div>

## 🎬 Aperçu du Projet

**Timeline Studio** - éditeur vidéo avec IA qui transforme vos vidéos, musique et effets préférés en dizaines de clips prêts à publier sur toutes les plateformes !

### 🚀 Imaginez les Possibilités

**Téléchargez vos vidéos, photos, musique une fois** → obtenez :
- 📱 **TikTok** - shorts verticaux avec effets tendance
- 📺 **YouTube** - films complets, clips courts, Shorts
- 📸 **Instagram** - Reels, Stories, posts de différentes durées
- ✈️ **Telegram** - versions optimisées pour canaux et chats

L'assistant IA créera le bon nombre de versions pour chaque plateforme ! 🤖

### 💡 Comment Ça Marche

> *"Créez une vidéo sur mon voyage en Asie pour tous les réseaux sociaux" - et en quelques minutes vous avez des options prêtes : shorts dynamiques pour TikTok, vlog atmosphérique pour YouTube, Stories vibrantes pour Instagram. L'IA sélectionnera les meilleurs moments, synchronisera avec la musique et adaptera pour chaque plateforme.*

### ⚡ Pourquoi Cela Change Tout

- **Économie de temps 10x** - plus d'adaptation manuelle pour chaque vidéo
- **L'IA comprend les tendances** - sait ce qui fonctionne sur chaque réseau social
- **Qualité professionnelle** - utilisant les mêmes outils que les grands studios
- **Tout fonctionne localement** - votre contenu reste privé

![Interface Timeline #1](/public/screen2.png)

![Interface Timeline #2](/public/screen4.png)

### Statut du Projet (Juin 2025)

**Achèvement Global : 58%** ⬆️ (recalculé avec API Keys Management à 100% et 14 nouveaux modules planifiés)
- **Terminé** : 13 modules (100% prêt)
- **En développement** : 7 modules (45-90% prêt)
- **Planifié** : 4 modules (30-80% prêt)
- **Nouveaux planifiés** : 14 modules (0% prêt) - [détails dans planned/](docs-ru/08-roadmap/planned/)

### Réalisations Clés :
- ✅ **Architecture Centrale** - Timeline, Video Compiler, Media Management (100%)
- ✅ **API Keys Management** - stockage sécurisé avec cryptage AES-256-GCM (100%)
- ✅ **Reconnaissance** - reconnaissance d'objets et visages YOLO v11 (100%)
- ✅ **Export** - intégration OAuth pour YouTube/TikTok/Vimeo (100%)
- 🚧 **Effets/Filtres/Transitions** - riche bibliothèque en progression (75-80%)
- 🚧 **Timeline AI** - automatisation avec 41 outils Claude (90%)

### Tâches Actuelles :
- 🔄 **Gestion des callbacks OAuth** - finalisation de l'intégration des réseaux sociaux
- ⏳ **Validation API HTTP** - tests de connexion en temps réel
- ⏳ **Import depuis .env** - migration des clés existantes

### Prochaines Étapes :
1. **Intégration Réseaux Sociaux** - implémentation complète du flux OAuth
2. **Effets Avancés** - finaliser la bibliothèque style Filmora
3. **Timeline AI** - automatisation intelligente de création vidéo

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
- 🌐 Support d'internationalisation (13 langues)
- 💾 Cache intelligent et système d'aperçu unifié
- 🎨 Interface moderne utilisant Tailwind CSS v4, shadcn-ui
- 📚 Documentation complète avec 2400+ tests (98.8% de réussite)

## Commencer

### Configuration Rapide

```bash
# Cloner et installer
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
bun install

# Lancer en mode développement
bun run tauri dev
```

### Prérequis
- Node.js v18+, Rust, Bun, FFmpeg

📚 **[Guide Complet d'Installation →](docs-ru/01-getting-started/README.md)**
🪟 **[Configuration Windows →](docs-ru/06-deployment/platforms/windows-build.md)**

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

Licence MIT avec Commons Clause - gratuit pour usage personnel, l'usage commercial nécessite un accord.

📄 **[Détails Complets de la Licence →](docs-ru/10-legal/license.md)** | 📧 **Licence Commerciale** : ak.chatman.media@gmail.com
