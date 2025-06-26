# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

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

## 🎬 Visão Geral do Projeto

**Timeline Studio** - Editor de vídeo impulsionado por IA que transforma seus vídeos, música e efeitos favoritos em dezenas de clipes prontos para publicar em todas as plataformas!

### 🚀 Imagine as Possibilidades

**Faça upload de seus vídeos, fotos, música uma vez** → obtenha:
- 📱 **TikTok** - shorts verticais com efeitos em tendência
- 📺 **YouTube** - filmes completos, clipes curtos, Shorts
- 📸 **Instagram** - Reels, Stories, posts de diferentes durações
- ✈️ **Telegram** - versões otimizadas para canais e chats

Assistente de IA criará o número certo de versões para cada plataforma! 🤖

### 💡 Como Funciona

> *"Crie um vídeo sobre minha viagem à Ásia para todas as redes sociais" - e em minutos você tem opções prontas: shorts dinâmicos para TikTok, vlog atmosférico para YouTube, Stories vibrantes para Instagram. A IA selecionará os melhores momentos, sincronizará com a música e adaptará para cada plataforma.*

### ⚡ Por Que Isso Muda Tudo

- **Economia de 10x no tempo** - sem mais adaptação manual para cada vídeo
- **IA entende tendências** - sabe o que funciona em cada rede social
- **Qualidade profissional** - usando as mesmas ferramentas dos grandes estúdios
- **Tudo funciona localmente** - seu conteúdo permanece privado

![Interface da Timeline #1](/public/screen2.png)

![Interface da Timeline #2](/public/screen4.png)

### Status do Projeto (Junho 2025)

**Conclusão Geral: 58%** ⬆️ (recalculado com Gerenciamento de Chaves API em 100% e 14 novos módulos planejados)
- **Concluído**: 13 módulos (100% pronto)
- **Em desenvolvimento**: 7 módulos (45-90% pronto)
- **Planejado**: 4 módulos (30-80% pronto)
- **Novos planejados**: 14 módulos (0% pronto) - [detalhes em planned/](docs-ru/08-roadmap/planned/)

### Principais Conquistas:
- ✅ **Arquitetura Central** - Timeline, Compilador de Vídeo, Gerenciamento de Mídia (100%)
- ✅ **Gerenciamento de Chaves API** - armazenamento seguro com criptografia AES-256-GCM (100%)
- ✅ **Reconhecimento** - reconhecimento de objetos e rostos YOLO v11 (100%)
- ✅ **Export** - integração OAuth para YouTube/TikTok/Vimeo (100%)
- 🚧 **Efeitos/Filtros/Transições** - rica biblioteca em progresso (75-80%)
- 🚧 **Timeline AI** - automação com 41 ferramentas Claude (90%)

### Tarefas Atuais:
- 🔄 **Manipulação de callback OAuth** - completando integração de redes sociais
- ⏳ **Validação de API HTTP** - teste de conexão em tempo real
- ⏳ **Importar de .env** - migração de chaves existentes

### Próximos Passos:
1. **Integração de Redes Sociais** - implementação completa do fluxo OAuth
2. **Efeitos Avançados** - completando biblioteca estilo Filmora
3. **Timeline AI** - automação inteligente de criação de vídeo

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
- 🌐 Suporte à internacionalização (13 idiomas)
- 💾 Cache inteligente e sistema de pré-visualização unificado
- 🎨 UI moderna usando Tailwind CSS v4, shadcn-ui
- 📚 Documentação completa com 2400+ testes (98.8% de taxa de sucesso)

## Começando

### Configuração Rápida

```bash
# Clone e instale
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
bun install

# Executar modo de desenvolvimento
bun run tauri dev
```

### Requisitos
- Node.js v18+, Rust, Bun, FFmpeg

📚 **[Guia de Instalação Completo →](docs-ru/01-getting-started/README.md)**
🪟 **[Configuração Windows →](docs-ru/06-deployment/platforms/windows-build.md)**

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

📚 **[Guia Completo de Desenvolvimento →](docs-ru/05-development/README.md)**

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
- 🚀 [**Site**](https://chatman-media.github.io/timeline-studio/) - Vitrine do projeto
- 📖 [**Documentação Completa**](docs-ru/README.md) - Guia completo em russo

## Star History
<a href="https://www.star-history.com/#chatman-media/timeline-studio&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date" />
 </picture>
</a>

## Licença

Licença MIT com Commons Clause - gratuito para uso pessoal, uso comercial requer acordo.

📄 **[Detalhes Completos da Licença →](docs-ru/10-legal/license.md)** | 📧 **Licença Comercial**: ak.chatman.media@gmail.com
