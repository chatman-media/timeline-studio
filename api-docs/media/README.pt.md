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

### Scripts Disponíveis

- `bun run dev` - Iniciar Next.js em modo de desenvolvimento
- `bun run tauri dev` - Iniciar Tauri em modo de desenvolvimento
- `bun run build` - Build do Next.js
- `bun run tauri build` - Build da aplicação Tauri

#### Linting e Formatação

- `bun run lint` - Verificar código JavaScript/TypeScript com ESLint
- `bun run lint:fix` - Corrigir erros do ESLint
- `bun run lint:css` - Verificar código CSS com Stylelint
- `bun run lint:css:fix` - Corrigir erros do Stylelint
- `bun run format:imports` - Formatar imports
- `bun run lint:rust` - Verificar código Rust com Clippy
- `bun run format:rust` - Formatar código Rust com rustfmt
- `bun run check:all` - Executar todas as verificações e testes
- `bun run fix:all` - Corrigir todos os erros de linting

#### Testes

- `bun run test` - Executar testes
- `bun run test:app` - Executar testes apenas dos componentes da aplicação
- `bun run test:watch` - Executar testes em modo watch
- `bun run test:coverage` - Executar testes com relatório de cobertura
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

#### 🧪 Status de Cobertura de Testes:
```bash
⨯ bun run test

 Test Files  242 passed | 1 skipped (243)
      Tests  3284 passed | 60 skipped (3344)
   Start at  16:17:39
   Duration  29.44s (transform 5.03s, setup 47.28s, collect 22.85s, tests 32.74s, environment 74.05s, prepare 22.21s)

⨯ bun run test:rust
   test result: ok. 366 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 12.38s

```

```bash
# Executar testes do cliente
bun run test

# Executar testes rust
bun run test:rust

# Executar testes com relatório de cobertura
bun run test:coverage

# Executar testes de função específica
bun run test src/features/effects
```

## Integração e Implantação Contínuas

O projeto está configurado para usar GitHub Actions para integração e implantação contínuas. Workflows:

### Verificação e Build

- `check-all.yml` - Executar todas as verificações e testes
- `lint-css.yml` - Verificar apenas código CSS (executa quando arquivos CSS mudam)
- `lint-rs.yml` - Verificar apenas código Rust (executa quando arquivos Rust mudam)
- `lint-js.yml` - Verificar apenas código JavaScript/TypeScript (executa quando arquivos JavaScript/TypeScript mudam)

### Implantação

- `build.yml` - Build do projeto
- `build-release.yml` - Build do projeto para release
- `deploy-promo.yml` - Build e publicar página promocional no GitHub Pages
- `docs.yml` - Gerar e publicar documentação da API no GitHub Pages

### Configuração do Linter

#### Stylelint (CSS)

O projeto usa Stylelint para verificar código CSS. A configuração está localizada no arquivo `.stylelintrc.json`. Principais recursos:

- Suporte para diretivas do Tailwind CSS
- Ignorar seletores duplicados para compatibilidade com Tailwind
- Correção automática de erros ao salvar arquivos (no VS Code)

Para executar o linter CSS, use o comando:

```bash
bun lint:css
```

Para correção automática de erros:

```bash
bun lint:css:fix
```

## Documentação da API

A documentação da API está disponível em: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Para gerar documentação localmente, use o comando:

```bash
bun run docs
```

A documentação estará disponível na pasta `docs/`.

Para desenvolvimento de documentação em tempo real, use:

```bash
bun run docs:watch
```

A documentação é atualizada automaticamente quando o código fonte muda no branch `main` usando o workflow do GitHub Actions `docs.yml`.

## Página Promocional

A página promocional do projeto está disponível em: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

O código fonte da página promocional está localizado na pasta `promo/`.

Para desenvolvimento local da página promocional, use os comandos:

```bash
cd promo
bun install
bun run dev
```

Para build da página promocional:

```bash
cd promo
bun run build
```

A página promocional é atualizada automaticamente quando arquivos mudam na pasta `promo/` no branch `main` usando o workflow do GitHub Actions `deploy-promo.yml`.

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