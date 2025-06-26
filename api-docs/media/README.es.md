# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Italiano](README.it.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

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

## 🎬 Descripción del Proyecto

**Timeline Studio** - editor de video con IA que transforma tus videos, música y efectos favoritos en docenas de clips listos para publicar en todas las plataformas!

### 🚀 Imagina las Posibilidades

**Sube tus videos, fotos, música una vez** → obtén:
- 📱 **TikTok** - shorts verticales con efectos de tendencia
- 📺 **YouTube** - películas completas, clips cortos, Shorts
- 📸 **Instagram** - Reels, Stories, publicaciones de diferentes duraciones
- ✈️ **Telegram** - versiones optimizadas para canales y chats

¡El asistente de IA creará el número correcto de versiones para cada plataforma! 🤖

### 💡 Cómo Funciona

> *"Crea un video sobre mi viaje a Asia para todas las redes sociales" - y en minutos tienes opciones listas: shorts dinámicos para TikTok, vlog atmosférico para YouTube, Stories vibrantes para Instagram. La IA seleccionará los mejores momentos, sincronizará con la música y adaptará para cada plataforma.*

### ⚡ Por Qué Esto Cambia Todo

- **Ahorro de tiempo 10x** - no más adaptación manual para cada video
- **La IA entiende las tendencias** - sabe qué funciona en cada red social
- **Calidad profesional** - usando las mismas herramientas que los grandes estudios
- **Todo funciona localmente** - tu contenido permanece privado

![Interfaz de Timeline #1](/public/screen2.png)

![Interfaz de Timeline #2](/public/screen4.png)

### Estado del Proyecto (Junio 2025)

**Completado General: 58%** ⬆️ (recalculado con API Keys Management al 100% y 14 nuevos módulos planificados)
- **Completado**: 13 módulos (100% listo)
- **En desarrollo**: 7 módulos (45-90% listo)
- **Planificado**: 4 módulos (30-80% listo)
- **Nuevos planificados**: 14 módulos (0% listo) - [detalles en planned/](docs-ru/08-roadmap/planned/)

### Logros Clave:
- ✅ **Arquitectura Central** - Timeline, Video Compiler, Media Management (100%)
- ✅ **API Keys Management** - almacenamiento seguro con encriptación AES-256-GCM (100%)
- ✅ **Reconocimiento** - reconocimiento de objetos y rostros YOLO v11 (100%)
- ✅ **Export** - integración OAuth para YouTube/TikTok/Vimeo (100%)
- 🚧 **Efectos/Filtros/Transiciones** - rica biblioteca en progreso (75-80%)
- 🚧 **Timeline AI** - automatización con 41 herramientas Claude (90%)

### Tareas Actuales:
- 🔄 **Manejo de callback OAuth** - completando integración de redes sociales
- ⏳ **Validación de API HTTP** - pruebas de conexión en tiempo real
- ⏳ **Importar desde .env** - migración de claves existentes

### Próximos Pasos:
1. **Integración de Redes Sociales** - implementación completa del flujo OAuth
2. **Efectos Avanzados** - completar biblioteca estilo Filmora
3. **Timeline AI** - automatización inteligente de creación de video

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
- 🌐 Soporte de internacionalización (13 idiomas)
- 💾 Caché inteligente y sistema de vista previa unificado
- 🎨 UI moderna usando Tailwind CSS v4, shadcn-ui
- 📚 Documentación completa con 2400+ pruebas (98.8% de éxito)

## Comenzando

### Configuración Rápida

```bash
# Clonar e instalar
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
bun install

# Ejecutar en modo desarrollo
bun run tauri dev
```

### Requisitos
- Node.js v18+, Rust, Bun, FFmpeg

📚 **[Guía Completa de Instalación →](docs-ru/01-getting-started/README.md)**
🪟 **[Configuración para Windows →](docs-ru/06-deployment/platforms/windows-build.md)**

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

Licencia MIT con Commons Clause - gratis para uso personal, el uso comercial requiere acuerdo.

📄 **[Detalles Completos de la Licencia →](docs-ru/10-legal/license.md)** | 📧 **Licencia Comercial**: ak.chatman.media@gmail.com

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
