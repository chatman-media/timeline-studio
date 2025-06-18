# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![Frontend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=frontend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=backend)](https://codecov.io/gh/chatman-media/timeline-studio)

[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## Visão Geral do Projeto

Timeline Studio é uma aplicação profissional de edição de vídeo construída com tecnologias web modernas e desempenho nativo. Nosso objetivo é criar um editor de nível DaVinci Resolve que seja acessível a todos.

![Interface da Timeline #1](/public/screen2.png)

![Interface da Timeline #2](/public/screen4.png)

### Status do Projeto (Junho 2025)

**Conclusão Geral: 86.2%** ⬆️ (atualizado após integração OAuth e conclusão do Export)
- ✅ Funcionalidade principal de edição completa
- ✅ Compilador de vídeo com aceleração GPU
- ✅ Módulo de reconhecimento (YOLO v11) - ORT corrigido
- ✅ Efeitos, filtros e transições (75-80%)
- ✅ Export - integração completa com redes sociais! (98%) 🎉
- ✅ Integração OAuth - suporte para YouTube/TikTok/Vimeo/Telegram
- ✅ Sistema de pré-visualização unificado com Preview Manager
- ✅ Persistência de mídia e projetos temporários
- ✅ Sistema de templates - baseado em configuração (95% concluído)
- ✅ Timeline com 90% de conclusão
- ⚠️ Painel de recursos em desenvolvimento (85%)
- 🎯 Data alvo de lançamento MVP: Final de junho 2025

## Recursos Principais

- 🎬 Edição profissional de vídeo com timeline multi-faixa
- 🖥️ Multiplataforma (Windows, macOS, Linux)
- 🚀 Processamento de vídeo acelerado por GPU (NVENC, QuickSync, VideoToolbox)
- 🤖 Reconhecimento de objetos/rostos alimentado por IA (YOLO v11 - ORT corrigido)
- 🎨 Mais de 30 transições, efeitos visuais e filtros
- 📝 Sistema avançado de legendas com 12 estilos e animações
- 🎵 Edição de áudio multi-faixa com efeitos
- 📤 Exportação para MP4/MOV/WebM com integração OAuth de redes sociais
- 🔐 Suporte OAuth para YouTube/TikTok/Vimeo/Telegram com armazenamento seguro de tokens
- 📱 Presets de dispositivos (iPhone, iPad, Android) para exportações otimizadas
- 🧠 Gerenciamento de estado usando XState v5
- 🌐 Suporte à internacionalização (11 idiomas)
- 💾 Cache inteligente e sistema de pré-visualização unificado
- 🎨 UI moderna usando Tailwind CSS v4, shadcn-ui
- 📚 Documentação completa com 2400+ testes (98.8% de taxa de sucesso)

## Começando

### Pré-requisitos

- [Node.js](https://nodejs.org/) (v18 ou superior)
- [Rust](https://www.rust-lang.org/tools/install) (versão estável mais recente)
- [bun](https://bun.sh/) (versão estável mais recente)
- [ffmpeg](https://ffmpeg.org/download.html) (versão estável mais recente)

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Instale as dependências:

```bash
bun install
```

### Iniciando em Modo de Desenvolvimento

```bash
bun run tauri dev
```

### Build de Produção

```bash
bun run tauri build
```

## Documentação

### 📚 Documentação Principal

- 📚 [Mapa da Documentação](docs-ru/MAP.md) - Visão geral completa da documentação
- 🏗️ [Guia de Arquitetura](docs-ru/ARCHITECTURE.md) - Arquitetura do sistema
- 🧪 [Guia de Testes](docs-ru/testing/TESTING.md) - Estratégias de teste
- 📡 [Referência da API](docs-ru/API.md) - Referência de comandos Tauri
- 🚀 [Guia de Implantação](docs-ru/deployment/DEPLOYMENT.md) - Build e implantação
- 🛣️ [Roteiro](docs-ru/ROADMAP.md) - Roteiro de desenvolvimento

### 📋 Documentação do Projeto

- **`src/features/README.md`** - visão geral de todos os recursos com prioridades e status
- **Versões em idiomas**: Disponível em 13 idiomas através do seletor acima

## Desenvolvimento

### Scripts Disponíveis

- `bun run dev` - Iniciar Next.js em modo de desenvolvimento
- `bun run tauri dev` - Iniciar Tauri em modo de desenvolvimento
- `bun run build` - Build do Next.js
- `bun run tauri build` - Build da aplicação Tauri
- `bun run test` - Executar todos os testes
- `bun run test:watch` - Executar testes em modo watch
- `bun run lint` - Verificar código
- `bun run format` - Formatar código

### Stack Tecnológico

- **Frontend**: Next.js 15, React 19, TypeScript, XState v5
- **Backend**: Tauri v2 (Rust), FFmpeg
- **UI**: Tailwind CSS v4, shadcn-ui, Radix UI
- **Testes**: Vitest, Testing Library, Playwright
- **IA**: ONNX Runtime, YOLO v11

## Contribuindo

Por favor, leia [CONTRIBUTING.md](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e o processo para enviar pull requests.

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Contato

- GitHub Issues: [github.com/chatman-media/timeline-studio/issues](https://github.com/chatman-media/timeline-studio/issues)
- Telegram: [@timelinestudio](https://t.me/timelinestudio)
- Website: [chatman-media.github.io/timeline-studio](https://chatman-media.github.io/timeline-studio/)

---

⭐ Se você gosta deste projeto, por favor, dê-nos uma estrela!