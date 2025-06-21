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

**Completado General: 53.8%** ⬆️ (recalculado con estado real de módulos y 14 nuevos módulos planificados)
- **Completado**: 11 módulos (100% listo) 
- **En desarrollo**: 8 módulos (45-85% listo)
- **Planificado**: 5 módulos (30-85% listo)
- **Nuevos planificados**: 14 módulos (0% listo) - [detalles en planned/](docs-ru/08-roadmap/planned/)

### Logros Clave:
- ✅ **Video Compiler** - completamente implementado con aceleración GPU (100%)
- ✅ **Timeline** - editor principal completamente funcional (100%)
- ✅ **Gestión de Medios** - gestión de archivos lista (100%)
- ✅ **Arquitectura Central** - app-state, browser, modals, user/project settings (100%)
- ✅ **Reconocimiento** - reconocimiento de objetos y rostros YOLO v11 (100%)
- 🔄 **Efectos/Filtros/Transiciones** - rica biblioteca de efectos estilo Filmora (75-80%)
- 🔄 **Export** - casi listo, quedan detalles de parámetros (85%)
- 🔄 **Panel de Recursos** - UI principal listo, falta drag & drop (80%)
- ❗ **AI Chat** - requiere integración real de API (30%)
- 📋 **14 nuevos módulos planificados** - [ver planned/](docs-ru/08-roadmap/planned/) para alcanzar nivel DaVinci + Filmora
- 🎯 **Objetivo** - combinar poder de DaVinci y biblioteca Filmora con automatización AI

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

### Inicio Rápido

```bash
# Modo de desarrollo
bun run tauri dev

# Ejecutar pruebas
bun run test && bun run test:rust

# Verificar calidad del código
bun run check:all
```

### Comandos Esenciales

| Comando | Descripción |
|---------|-------------|
| `bun run tauri dev` | Ejecutar aplicación completa en desarrollo |
| `bun run dev` | Ejecutar solo frontend |
| `bun run build` | Compilar para producción |
| `bun run test` | Ejecutar pruebas de frontend |
| `bun run test:rust` | Ejecutar pruebas de backend |
| `bun run lint` | Verificar calidad del código |
| `bun run fix:all` | Auto-corregir problemas de código |

📚 **[Guía Completa de Desarrollo →](docs-ru/05-development/README.md)**

### Estado de Cobertura de Pruebas

✅ **Pruebas Frontend**: 3,604 pasaron  
✅ **Pruebas Backend**: 554 pasaron (+18 nuevas!)  
📊 **Total**: 4,158 pruebas pasando

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

## CI/CD y Calidad del Código

### Procesos Automatizados
- ✅ **Linting**: ESLint, Stylelint, Clippy
- ✅ **Pruebas**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Cobertura**: Integración con Codecov
- ✅ **Compilación**: Compilaciones multiplataforma

📚 **[Guía Detallada de CI/CD →](docs-ru/06-deployment/README.md)**  
🔧 **[Linting y Formateo →](docs-ru/05-development/linting-and-formatting.md)**

## Documentación y Recursos

- 📚 [**Documentación API**](https://chatman-media.github.io/timeline-studio/api-docs/) - Documentación TypeScript auto-generada
- 🚀 [**Página Promocional**](https://chatman-media.github.io/timeline-studio/) - Showcase del proyecto
- 📖 [**Documentación Completa**](docs-ru/README.md) - Guía completa en ruso
- 🎬 [**Demo en Vivo**](https://chatman-media.github.io/timeline-studio/) - Prueba el editor online

## Recursos Adicionales

- [Documentación de Tauri](https://v2.tauri.app/start/)
- [Documentación de XState](https://xstate.js.org/docs/)
- [Documentación de Vitest](https://vitest.dev/guide/)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de Shadcn UI](https://ui.shadcn.com/)
- [Documentación de Stylelint](https://stylelint.io/)
- [Documentación de ESLint](https://eslint.org/docs/latest/)
- [Documentación de Playwright](https://playwright.dev/docs/intro)
- [Documentación de TypeDoc](https://typedoc.org/)
- [Documentación de ffmpeg](https://ffmpeg.org/documentation.html)

## GitHub Pages

El proyecto utiliza GitHub Pages para alojar la documentación API y la página promocional:

- **Página Promocional**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **Documentación API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Ambas páginas se actualizan automáticamente cuando los archivos correspondientes cambian en la rama `main` a través de workflows de GitHub Actions.
