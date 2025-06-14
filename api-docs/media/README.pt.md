# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [العربية](README.ar.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)

## Visão Geral do Projeto

Timeline Studio é uma aplicação profissional de edição de vídeo construída com tecnologias web modernas e desempenho nativo. Nosso objetivo é criar um editor de nível DaVinci Resolve que seja acessível a todos.

![Interface da Timeline](/public/screen3.png)

### Status do Projeto (Junho 2025)

**Conclusão Geral: 75%**
- ✅ Funcionalidade principal de edição completa
- ✅ Compilador de vídeo com aceleração GPU
- ✅ Módulo de reconhecimento (YOLO v11)
- ✅ Efeitos, filtros e transições
- ⚠️ UI de exportação precisa ser concluída (25%)
- ⚠️ Painel de recursos em desenvolvimento (40%)
- 🎯 Lançamento MVP alvo: Final de junho 2025

## Recursos Principais

- 🎬 Edição profissional de vídeo com timeline multi-faixa
- 🖥️ Multiplataforma (Windows, macOS, Linux)
- 🚀 Processamento de vídeo acelerado por GPU (NVENC, QuickSync, VideoToolbox)
- 🤖 Reconhecimento de objetos/rostos alimentado por IA (YOLO v11)
- 🎨 Mais de 30 transições, efeitos visuais e filtros
- 📝 Sistema avançado de legendas com 12 estilos e animações
- 🎵 Edição de áudio multi-faixa com efeitos
- 🧠 Gerenciamento de estado usando XState v5
- 🌐 Suporte à internacionalização (6 idiomas)
- 💾 Cache inteligente e geração de pré-visualizações
- 🎨 UI moderna usando Tailwind CSS v4, shadcn-ui
- 📚 Documentação completa com mais de 80% de cobertura de testes

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

## Estrutura do Projeto

```
timeline-studio/
├── bin/                              # Scripts shell
├── docs/                             # Documentação gerada automaticamente
├── ai-gen-docs/                      # Documentação gerada por IA para desenvolvedores
├── examples/                         # Exemplos de uso da API
├── promo/                            # Site GitHub Pages
├── public/                           # Arquivos estáticos
├── scripts/                          # Scripts JavaScript
├── src/                              # Código-fonte frontend (React, XState, Next.js)
│   ├── app/                          # Ponto de entrada principal da aplicação
│   ├── components/                   # Componentes compartilhados
│   ├── features/                     # Recursos
│   │   ├── ai-chat/                  # Chatbot IA (assistente interativo)
│   │   ├── app-state/                # Estado global da aplicação
│   │   ├── browser/                  # Navegador de arquivos de mídia (painel de arquivos)
│   │   ├── camera-capture/           # Captura de vídeo/foto da câmera
│   │   ├── effects/                  # Efeitos de vídeo e seus parâmetros
│   │   ├── export/                   # Exportação de vídeo e projeto
│   │   ├── filters/                  # Filtros de vídeo (correção de cor, estilos)
│   │   ├── keyboard-shortcuts/       # Atalhos de teclado e predefinições
│   │   ├── media/                    # Manipulação de arquivos de mídia (áudio/vídeo)
│   │   ├── media-studio/             # Estúdio de edição de mídia
│   │   ├── modals/                   # Janelas modais (diálogos)
│   │   ├── music/                    # Importação e gerenciamento de música
│   │   ├── options/                  # Configurações de exportação e projeto
│   │   ├── project-settings/         # Configurações do projeto (tamanho, fps, etc.)
│   │   ├── recognition/              # Reconhecimento de cena e objeto
│   │   ├── resources/                # Gerenciamento de recursos do projeto
│   │   ├── style-templates/          # Estilos e modelos de design
│   │   ├── subtitles/                # Importação e edição de legendas
│   │   ├── templates/                # Modelos e predefinições de vídeo
│   │   ├── timeline/                 # Timeline de edição principal
│   │   ├── top-bar/                  # Interface da barra superior
│   │   ├── transitions/              # Transições de vídeo
│   │   ├── user-settings/            # Preferências do usuário
│   │   ├── video-compiler/           # Integração do compilador de vídeo frontend
│   │   └── video-player/             # Player de vídeo personalizado
│   ├── lib/                          # Bibliotecas e utilitários compartilhados
│   ├── test/                         # Utilitários de teste
│   └── types/                        # Definições de tipo TypeScript
├── src-tauri/                        # Código-fonte backend (Rust)
│   ├── src/                          # Arquivos fonte Rust
│   │   ├── app_dirs.rs               # Gerenciamento de diretórios da aplicação
│   │   ├── filesystem.rs             # Operações do sistema de arquivos
│   │   ├── language.rs               # Suporte de idioma/i18n
│   │   ├── lib.rs                    # Entrada principal da biblioteca
│   │   ├── media/                    # Módulo de processamento de mídia
│   │   ├── recognition/              # Módulo de reconhecimento YOLO
│   │   ├── video_compiler/           # Compilação de vídeo FFmpeg
│   │   └── video_server/             # Servidor de streaming de vídeo
│   └── tauri.conf.json               # Configuração Tauri
└── ...outros arquivos de configuração
```

Cada recurso contém documentação detalhada:

- **`README.md`** - requisitos funcionais, status de prontidão

### 📋 Documentos Principais

- **`src/features/DEV-README.md`** - visão geral de todos os recursos com prioridades e status
- **`README.md`** - informações gerais do projeto (Inglês)
- **`README.es.md`** - versão em espanhol da documentação
- **`README.fr.md`** - versão em francês da documentação
- **`README.de.md`** - versão em alemão da documentação
- **`README.ru.md`** - versão em russo da documentação
- **`README.zh.md`** - versão em chinês da documentação
- **`README.pt.md`** - versão em português da documentação

## Documentação

- 📚 [Mapa da Documentação](ai-gen-docs/MAP.md) - Visão geral completa da documentação
- 🏗️ [Guia de Arquitetura](ai-gen-docs/ARCHITECTURE.md) - Arquitetura do sistema
- 🧪 [Guia de Testes](ai-gen-docs/testing/TESTING.md) - Estratégias de teste
- 📡 [Referência da API](ai-gen-docs/API.md) - Referência de comandos Tauri
- 🚀 [Guia de Implantação](ai-gen-docs/deployment/DEPLOYMENT.md) - Build e implantação
- 🛣️ [Roteiro](ai-gen-docs/ROADMAP.md) - Roteiro de desenvolvimento

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