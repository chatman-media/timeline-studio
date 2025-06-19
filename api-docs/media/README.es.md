# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Lint CSS](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-css.yml?style=flat-square&label=lint%20css)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=flat-square&label=lint%20ts)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=flat-square&label=lint%20rust)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)

[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=for-the-badge&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=for-the-badge&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## Descripción del Proyecto

Timeline Studio es un editor de video moderno construido sobre la arquitectura Tauri (Rust + React).

**Nuestro objetivo**: crear un editor que combine:
- **Poder profesional de DaVinci Resolve** - control completo sobre edición, corrección de color, mezcla de audio, efectos visuales, gráficos en movimiento y composición avanzada
- **Amplia biblioteca creativa** - efectos, filtros, transiciones, plantillas multicámara, títulos animados, plantillas de estilo y preajustes de subtítulos comparables a editores populares como Filmora
- **Scripting y automatización con IA** - generación automática de contenido en diferentes idiomas y para diferentes plataformas

**Innovación clave**: Es suficiente que los usuarios carguen videos, música y otros recursos, y la IA creará automáticamente un conjunto de videos en diferentes idiomas y optimizados para diferentes plataformas (YouTube, TikTok, Vimeo, Telegram).

![Interfaz de Timeline #1](/public/screen2.png)

![Interfaz de Timeline #2](/public/screen4.png)

### Estado del Proyecto (Junio 2025)

**Completado General: 86.2%** ⬆️ (actualizado después de la integración OAuth y finalización de Export)
- ✅ Funcionalidad principal de edición completa
- ✅ Video Compiler con aceleración GPU
- ✅ Módulo de reconocimiento (YOLO v11) - ORT arreglado
- ✅ Efectos, filtros y transiciones (75-80%)
- ✅ Export - ¡integración completa con redes sociales! (98%) 🎉
- ✅ Integración OAuth - soporte para YouTube/TikTok/Vimeo/Telegram
- ✅ Sistema de vista previa unificado con Preview Manager
- ✅ Persistencia de medios y proyectos temporales
- ✅ Sistema de plantillas - basado en configuración (95% completado)
- ✅ Timeline al 90% de finalización
- ⚠️ Panel de recursos en desarrollo (85%)
- 🎯 Fecha objetivo de lanzamiento MVP: Final de junio 2025

## Características Principales

- 🎬 Edición de video profesional con timeline multipista
- 🖥️ Multiplataforma (Windows, macOS, Linux)
- 🚀 Procesamiento de video acelerado por GPU (NVENC, QuickSync, VideoToolbox)
- 🤖 Reconocimiento de objetos/rostros potenciado por IA (YOLO v11 - ORT arreglado)
- 🎨 30+ transiciones, efectos visuales y filtros
- 📝 Sistema avanzado de subtítulos con 12 estilos y animaciones
- 🎵 Edición de audio multipista con efectos
- 📤 Exportación a MP4/MOV/WebM con integración OAuth de redes sociales
- 🔐 Soporte OAuth para YouTube/TikTok/Vimeo/Telegram con almacenamiento seguro de tokens
- 📱 Presets de dispositivos (iPhone, iPad, Android) para exportaciones optimizadas
- 🧠 Gestión de estado usando XState v5
- 🌐 Soporte de internacionalización (11 idiomas)
- 💾 Caché inteligente y sistema de vista previa unificado
- 🎨 UI moderna usando Tailwind CSS v4, shadcn-ui
- 📚 Documentación completa con 2400+ pruebas (98.8% de éxito)

## Comenzando

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [Rust](https://www.rust-lang.org/tools/install) (última versión estable)
- [bun](https://bun.sh/) (última versión estable)
- [ffmpeg](https://ffmpeg.org/download.html) (última versión estable)

### Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Instalar dependencias:

```bash
bun install
```

### Modo de Desarrollo

```bash
bun run tauri dev
```

### Compilación de Producción

```bash
bun run tauri build
```

## Documentación

### 📚 Documentación Principal

- 📚 [Resumen de Documentación](docs-ru/README.md) - Mapa completo de documentación
- 🚀 [Comenzando](docs-ru/01-getting-started/README.md) - Instalación y primeros pasos
- 🏗️ [Guía de Arquitectura](docs-ru/02-architecture/README.md) - Arquitectura del sistema
- 🎯 [Guía de Características](docs-ru/03-features/README.md) - Resumen de características y estado
- 📡 [Referencia API](docs-ru/04-api-reference/README.md) - Referencia de comandos Tauri
- 🧪 [Guía de Desarrollo](docs-ru/05-development/README.md) - Pruebas y desarrollo
- 🚀 [Guía de Despliegue](docs-ru/06-deployment/README.md) - Construcción y despliegue
- 📋 [Guías de Usuario](docs-ru/07-guides/README.md) - Rendimiento y mejores prácticas
- 🛣️ [Hoja de Ruta](docs-ru/08-roadmap/README.md) - Hoja de ruta de desarrollo
- 🔐 [Configuración OAuth](docs-ru/09-oauth-setup/oauth-setup-guide.md) - Integración con redes sociales

### 📋 Documentación del Proyecto

- **`src/features/README.md`** - resumen de todas las características con prioridades y estado
- **Versiones en idiomas**: Disponible en 11 idiomas a través del selector arriba

## Desarrollo

### Scripts Disponibles

- `bun dev` - Ejecutar Next.js en modo desarrollo
- `bun tauri dev` - Ejecutar Tauri en modo desarrollo
- `bun build` - Compilar Next.js
- `bun tauri build` - Compilar aplicación Tauri

#### Linting y Formateo

- `bun lint` - Verificar código JavaScript/TypeScript con ESLint
- `bun lint:fix` - Corregir errores de ESLint
- `bun lint:css` - Verificar código CSS con Stylelint
- `bun lint:css:fix` - Corregir errores de Stylelint
- `bun format:imports` - Formatear importaciones
- `bun lint:rust` - Verificar código Rust con Clippy
- `bun format:rust` - Formatear código Rust con rustfmt
- `bun check:all` - Ejecutar todas las verificaciones y pruebas
- `bun fix:all` - Corregir todos los errores de linting

#### Pruebas

- `bun test` - Ejecutar pruebas
- `bun test:app` - Ejecutar pruebas solo para componentes de aplicación
- `bun test:coverage` - Ejecutar pruebas con reporte de cobertura
- `bun test:ui` - Ejecutar pruebas con interfaz UI
- `bun test:e2e` - Ejecutar pruebas end-to-end con Playwright

### Pruebas

El proyecto utiliza Vitest para pruebas unitarias. Las pruebas se encuentran en el directorio __tests__ de cada característica, junto con los mocks en __mocks__.

#### 🧪 Estado de Cobertura de Pruebas:
```bash
⨯ bun run test

 Test Files  258 passed | 1 skipped (259)
      Tests  3604 passed | 60 skipped (3664)
   Start at  20:08:23
   Duration  26.48s (transform 5.42s, setup 53.03s, collect 25.72s, tests 32.83s, environment 67.99s, prepare 16.45s)

⨯ bun run test:rust
   test result: ok. 366 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 12.38s

```

```bash
# Ejecutar pruebas del cliente
bun run test

# Ejecutar pruebas de rust
bun run test:rust

# Ejecutar pruebas con reporte de cobertura
bun run test:coverage

# Ejecutar pruebas para función específica
bun run test src/features/effects
```

## Licencia

Este proyecto se distribuye bajo la Licencia MIT con Commons Clause.

**Términos Principales:**

- **Código Abierto**: Puedes usar, modificar y distribuir libremente el código de acuerdo con los términos de la licencia MIT.
- **Restricción de Uso Comercial**: Commons Clause prohíbe "vender" el software sin un acuerdo separado con el autor.
- **"Vender"** significa usar la funcionalidad del software para proporcionar a terceros un producto o servicio por una tarifa.

Esta licencia permite:

- Usar el código para proyectos personales y no comerciales
- Estudiar y modificar el código
- Distribuir modificaciones bajo la misma licencia

Pero prohíbe:

- Crear productos o servicios comerciales basados en el código sin una licencia

Para una licencia comercial, por favor contacta al autor: ak.chatman.media@gmail.com

El texto completo de la licencia está disponible en el archivo [LICENSE](./LICENSE).

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Tauri](https://v2.tauri.app/start/)
- [Documentación de XState](https://xstate.js.org/docs/)
- [Documentación de Vitest](https://vitest.dev/guide/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de Stylelint](https://stylelint.io/)
- [Documentación de ESLint](https://eslint.org/docs/latest/)
- [Documentación de Playwright](https://playwright.dev/docs/intro)
- [Documentación de TypeDoc](https://typedoc.org/)

## GitHub Pages

El proyecto utiliza GitHub Pages para alojar la documentación API y la página promocional:

- **Página Promocional**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **Documentación API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Ambas páginas se actualizan automáticamente cuando los archivos correspondientes cambian en la rama `main` a través de workflows de GitHub Actions.
