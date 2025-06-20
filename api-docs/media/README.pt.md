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

## Visão Geral do Projeto

Timeline Studio é um editor de vídeo moderno construído com arquitetura Tauri (Rust + React).

**Nosso objetivo**: criar um editor combinando:
- **Poder profissional do DaVinci Resolve** - controle completo sobre edição, correção de cor, mixagem de áudio, efeitos visuais, gráficos em movimento e composição avançada
- **Biblioteca criativa extensa** - efeitos, filtros, transições, modelos multicâmera, títulos animados, modelos de estilo e predefinições de legendas comparáveis a editores populares como Filmora
- **Scripts e automação com IA** - geração automática de conteúdo em diferentes idiomas e para diferentes plataformas

**Inovação principal**: É suficiente que os usuários carreguem vídeos, música e outros recursos, e a IA criará automaticamente um conjunto de vídeos em diferentes idiomas e otimizados para diferentes plataformas (YouTube, TikTok, Vimeo, Telegram).

![Interface da Timeline #1](/public/screen2.png)

![Interface da Timeline #2](/public/screen4.png)

### Status do Projeto (Junho 2025)

**Conclusão Geral: 53.8%** ⬆️ (recalculado com status real dos módulos e 14 novos módulos planejados)
- **Concluído**: 11 módulos (100% pronto)
- **Em desenvolvimento**: 8 módulos (45-85% pronto)
- **Planejado**: 5 módulos (30-85% pronto)
- **Novos planejados**: 14 módulos (0% pronto) - [detalhes em planned/](docs-ru/08-roadmap/planned/)

### Principais Conquistas:
- ✅ **Compilador de Vídeo** - totalmente implementado com aceleração GPU (100%)
- ✅ **Timeline** - editor principal totalmente funcional (100%)
- ✅ **Gerenciamento de Mídia** - gerenciamento de arquivos pronto (100%)
- ✅ **Arquitetura Central** - app-state, browser, modals, user/project settings (100%)
- ✅ **Reconhecimento** - reconhecimento de objetos e rostos YOLO v11 (100%)
- 🔄 **Efeitos/Filtros/Transições** - rica biblioteca de efeitos estilo Filmora (75-80%)
- 🔄 **Export** - quase pronto, faltam detalhes de parâmetros (85%)
- 🔄 **Painel de Recursos** - UI principal pronto, falta drag & drop (80%)
- ❗ **AI Chat** - requer integração real da API (30%)
- 📋 **14 novos módulos planejados** - [ver planned/](docs-ru/08-roadmap/planned/) para alcançar nível DaVinci + Filmora
- 🎯 **Objetivo** - combinar poder do DaVinci e biblioteca Filmora com automação AI

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

- 📚 [Visão Geral da Documentação](docs-ru/README.md) - Mapa completo da documentação
- 🚀 [Primeiros Passos](docs-ru/01-getting-started/README.md) - Instalação e primeiros passos
- 🏗️ [Guia de Arquitetura](docs-ru/02-architecture/README.md) - Arquitetura do sistema
- 🎯 [Guia de Recursos](docs-ru/03-features/README.md) - Visão geral e status dos recursos
- 📡 [Referência da API](docs-ru/04-api-reference/README.md) - Referência de comandos Tauri
- 🧪 [Guia de Desenvolvimento](docs-ru/05-development/README.md) - Testes e desenvolvimento
- 🚀 [Guia de Implantação](docs-ru/06-deployment/README.md) - Build e implantação
- 📋 [Guias do Usuário](docs-ru/07-guides/README.md) - Performance e melhores práticas
- 🛣️ [Roteiro](docs-ru/08-roadmap/README.md) - Roteiro de desenvolvimento
- 🔐 [Configuração OAuth](docs-ru/09-oauth-setup/oauth-setup-guide.md) - Integração com redes sociais

### 📋 Documentação do Projeto

- **`src/features/README.md`** - visão geral de todos os recursos com prioridades e status
- **Versões em idiomas**: Disponível em 11 idiomas através do seletor acima

## Desenvolvimento

### Início Rápido

```bash
# Modo de desenvolvimento
bun run tauri dev

# Executar testes
bun run test && bun run test:rust

# Verificar qualidade do código
bun run check:all
```

### Comandos Essenciais

| Comando | Descrição |
|---------|-------------|
| `bun run tauri dev` | Iniciar aplicação completa em desenvolvimento |
| `bun run dev` | Iniciar apenas frontend |
| `bun run build` | Build para produção |
| `bun run test` | Executar testes frontend |
| `bun run test:rust` | Executar testes backend |
| `bun run lint` | Verificar qualidade do código |
| `bun run fix:all` | Auto-corrigir problemas de código |

📚 **[Guia Completo de Desenvolvimento →](docs-ru/05-development/README.md)**

### Status de Cobertura dos Testes

✅ **Testes Frontend**: 3,604 passaram  
✅ **Testes Backend**: 554 passaram (+18 novos!)  
📊 **Total**: 4,158 testes passando
- `bun run test:coverage:report` - Gerar e enviar relatório de cobertura de testes
- `bun run test:rust` - Executar testes do backend Rust
- `bun run test:rust:watch` - Executar testes Rust em modo watch
- `bun run test:coverage:rust` - Executar testes Rust com cobertura
- `bun run test:coverage:rust:report` - Gerar e enviar relatório de cobertura Rust
- `bun run test:ui` - Executar testes com interface UI
- `bun run test:e2e` - Executar testes end-to-end com Playwright
- `bun run test:e2e:ui` - Executar testes e2e com UI do Playwright
- `bun run test:e2e:basic` - Executar teste e2e básico de importação de mídia
- `bun run test:e2e:real` - Executar testes e2e com arquivos de mídia reais
- `bun run test:e2e:integration` - Executar testes e2e de integração (requer INTEGRATION_TEST=true)
- `bun run playwright:install` - Instalar navegadores do Playwright

### Testes

O projeto usa Vitest para testes unitários. Os testes estão localizados no diretório __tests__ de cada recurso, junto com mocks em __mocks__.

## CI/CD e Qualidade do Código

### Processos Automatizados
- ✅ **Linting**: ESLint, Stylelint, Clippy
- ✅ **Testes**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Cobertura**: Integração Codecov
- ✅ **Build**: Builds multiplataforma

📚 **[Guia Detalhado de CI/CD →](docs-ru/06-deployment/README.md)**  
🔧 **[Linting e Formatação →](docs-ru/05-development/linting-and-formatting.md)**

## Documentação e Recursos

- 📚 [**Documentação da API**](https://chatman-media.github.io/timeline-studio/api-docs/) - Documentação TypeScript auto-gerada
- 🚀 [**Página Promocional**](https://chatman-media.github.io/timeline-studio/) - Vitrine do projeto
- 📖 [**Documentação Completa**](docs-ru/README.md) - Guia completo em russo
- 🎬 [**Demo ao Vivo**](https://chatman-media.github.io/timeline-studio/) - Experimente o editor online

## Recursos Adicionais

- [Documentação Tauri](https://v2.tauri.app/start/)
- [Documentação XState](https://xstate.js.org/docs/)
- [Documentação Vitest](https://vitest.dev/guide/)
- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Documentação Shadcn UI](https://ui.shadcn.com/)
- [Documentação Stylelint](https://stylelint.io/)
- [Documentação ESLint](https://eslint.org/docs/latest/)
- [Documentação Playwright](https://playwright.dev/docs/intro)
- [Documentação TypeDoc](https://typedoc.org/)
- [Documentação ffmpeg](https://ffmpeg.org/documentation.html)

## Licença

Este projeto é distribuído sob a Licença MIT com condição Commons Clause.

**Termos principais:**

- **Open Source**: Você pode usar, modificar e distribuir o código livremente de acordo com os termos da Licença MIT.
- **Restrição de Uso Comercial**: Commons Clause proíbe "vender" o software sem um acordo separado com o autor.
- **"Vender"** significa usar a funcionalidade do software para fornecer a terceiros um produto ou serviço mediante pagamento.

Esta licença permite:

- Usar o código para projetos pessoais e não-comerciais
- Estudar e modificar o código
- Distribuir modificações sob a mesma licença

Mas proíbe:

- Criar produtos ou serviços comerciais baseados no código sem uma licença

Para obter uma licença comercial, entre em contato com o autor: ak.chatman.media@gmail.com

O texto completo da licença está disponível no arquivo [LICENSE](./LICENSE)

## GitHub Pages

O projeto usa GitHub Pages para hospedar a documentação da API e página promocional:

- **Página Promocional**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **Documentação da API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Ambas as páginas são atualizadas automaticamente quando os arquivos correspondentes são alterados no branch `main` usando workflows do GitHub Actions.