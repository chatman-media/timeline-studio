# Timeline Studio

**🌐 Language / Idioma / Langue / Sprache / Язык:** [English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md)

Editor de video construido con Tauri, React y XState.

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/website-Promo-brightgreen)](https://chatman-media.github.io/timeline-studio/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![DeepSource](https://app.deepsource.com/gh/chatman-media/timeline-studio.svg/?label=code+coverage&show_trend=true&token=zE1yrrYR6Jl7GK0R74LZx9MJ)](https://app.deepsource.com/gh/chatman-media/timeline-studio/)

## Descripción del Proyecto

Timeline Studio es una aplicación de escritorio para crear y editar videos. La aplicación utiliza una arquitectura basada en máquinas de estado finito (XState) para gestionar la lógica de estado compleja.

![Interfaz de Timeline](/public/screen3.png)

## 📊 Estado de Desarrollo

### 🎯 Progreso General: 76% Completo (13/17 características)

```
Componentes:     16/17 ✅ (94%)
Hooks:           14/17 ✅ (82%)
Servicios:       15/17 ✅ (88%)
Pruebas:         13/17 ✅ (76%)
Documentación:   17/17 ✅ (100%)
```

### 🔥 Tareas Críticas

- **Timeline** - requiere máquina de estado, hooks, lógica principal
- **Resources** - requiere componentes UI para gestión
- **AI Chat** - requiere verificación de completitud funcional
- **Options** - requiere expansión de funcionalidad

### ✅ Componentes Listos

- **VideoPlayer** - reproductor de video completamente funcional
- **Browser** - navegador de archivos multimedia con pestañas
- **Media, Music, Effects, Filters, Transitions, Templates** - todo listo
- **AppState, Modals, TopBar, MediaStudio** - infraestructura básica

### Características Principales

- 🎬 Creación y edición de proyectos de video
- 🖥️ Multiplataforma (Windows, macOS, Linux)
- 🧠 Gestión de estado con XState v5
- 🌐 Soporte de internacionalización (i18n)
- 🎨 UI moderna con Tailwind CSS v4
- 🔍 Control estricto de calidad de código con ESLint, Stylelint y Clippy
- 📚 Documentación completa para todos los componentes

## Comenzando

### Prerrequisitos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [Rust](https://www.rust-lang.org/tools/install) (última versión estable)
- [bun](https://bun.sh/) (última versión estable)

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
bun tauri dev
```

### Compilación de Producción

```bash
bun tauri build
```

## Estructura del Proyecto

```
timeline-studio/
├── src/                  # Código fuente del frontend (React, Next.js)
│   ├── features/         # Módulos de características de la aplicación (17 características)
│   │   ├── browser/      ✅ # Navegador de archivos multimedia con pestañas
│   │   ├── media/        ✅ # Gestión de archivos multimedia
│   │   ├── video-player/ ✅ # Reproductor de video con controles
│   │   ├── timeline/     ⚠️ # Timeline (requiere trabajo)
│   │   ├── resources/    ⚠️ # Recursos (requiere componentes UI)
│   │   ├── ai-chat/      ❓ # Chat AI (requiere verificación)
│   │   ├── options/      ⚠️ # Panel de opciones (requiere expansión)
│   │   ├── music/        ✅ # Archivos de música
│   │   ├── effects/      ✅ # Efectos de video
│   │   ├── filters/      ✅ # Filtros de imagen
│   │   ├── transitions/  ✅ # Transiciones de clips
│   │   ├── subtitles/    ✅ # Subtítulos
│   │   ├── templates/    ✅ # Plantillas de proyecto
│   │   ├── modals/       ✅ # Ventanas modales
│   │   ├── app-state/    ✅ # Estado global
│   │   ├── top-bar/      ✅ # Barra de navegación superior
│   │   ├── media-studio/ ✅ # Componente raíz
│   │   └── OVERVIEW.md   📚 # Resumen de todas las características
│   ├── i18n/             # Internacionalización
│   ├── types/            # Tipos TypeScript
│   ├── lib/              # Utilidades y bibliotecas
│   └── components/       # Componentes UI reutilizables
├── src-tauri/            # Código fuente del backend (Rust)
│   ├── src/              # Código Rust
│   └── Cargo.toml        # Configuración de dependencias Rust
├── public/               # Archivos estáticos
├── DEV.md                📚 # Documentación para desarrolladores
├── README.ru.md          📚 # Documentación en ruso
└── package.json          # Configuración de dependencias Node.js
```

## 📚 Documentación

### 🗂️ Estructura de Documentación

Cada característica contiene documentación detallada:

- **`README.md`** - requisitos funcionales, estado de preparación
- **`DEV.md`** - arquitectura técnica, API, tipos de datos

### 📋 Documentos Clave

- **`src/features/OVERVIEW.md`** - resumen de todas las 17 características con prioridades
- **`DEV.md`** - arquitectura de la aplicación, máquinas de estado, plan de desarrollo
- **`README.md`** - información general del proyecto (inglés)
- **`README.es.md`** - versión en español de la documentación
- **`README.fr.md`** - versión en francés de la documentación
- **`README.de.md`** - versión en alemán de la documentación
- **`README.ru.md`** - versión en ruso de la documentación

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

### Máquinas de Estado (XState v5)

El proyecto utiliza XState v5 para gestionar la lógica de estado compleja.

#### ✅ Máquinas de Estado Implementadas (11):

- `appSettingsMachine` - gestión centralizada de configuraciones
- `chatMachine` - gestión de chat AI
- `modalMachine` - gestión de ventanas modales
- `playerMachine` - gestión del reproductor de video
- `resourcesMachine` - gestión de recursos del timeline
- `musicMachine` - gestión de archivos de música
- `userSettingsMachine` - configuraciones de usuario
- `projectSettingsMachine` - configuraciones de proyecto
- `mediaListMachine` - gestión de listas de archivos multimedia
- `templateListMachine` - gestión de plantillas
- `timelineMachine` - ✅ **¡COMPLETADO!** Máquina de estado principal del timeline (20 tests pasaron)

#### ❌ Requieren Implementación (1):

- `optionsMachine` - gestión del panel de opciones

Ver `DEV.md` para detalles.

### Pruebas

El proyecto utiliza Vitest para pruebas unitarias. Las pruebas se ubican junto a los archivos probados con extensiones `.test.ts` o `.test.tsx`.

```bash
# Ejecutar todas las pruebas
bun test

# Ejecutar pruebas con reporte de cobertura
bun test:coverage
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
