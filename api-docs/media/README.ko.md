# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=flat-square)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=flat-square&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Last Commit](https://img.shields.io/github/last-commit/chatman-media/timeline-studio?style=flat-square&label=last%20commit)](https://github.com/chatman-media/timeline-studio/commits/main)
[![GitHub commits](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=flat-square&label=commits)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=flat-square&label=downloads)](https://www.npmjs.com/package/timeline-studio)

[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](./docs/en/README.md)
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/BSddjvWk)

</div>

## 프로젝트 개요

Timeline Studio는 Tauri 아키텍처(Rust + React)로 구축된 최신 비디오 편집기입니다.

**우리의 목표**: 다음을 결합한 편집기 만들기:
- **DaVinci Resolve의 전문적인 기능** - 편집, 색상 보정, 오디오 믹싱, 시각 효과, 모션 그래픽 및 고급 합성에 대한 완전한 제어
- **광범위한 창의적 라이브러리** - Filmora와 같은 인기 편집기에 필적하는 효과, 필터, 전환, 멀티 카메라 템플릿, 애니메이션 제목, 스타일 템플릿 및 자막 프리셋
- **AI 스크립팅 및 자동화** - 다양한 언어와 다양한 플랫폼을 위한 자동 콘텐츠 생성

**핵심 혁신**: 사용자가 비디오, 음악 및 기타 리소스를 업로드하기만 하면 AI가 다양한 언어로 자동으로 비디오 세트를 만들고 다양한 플랫폼(YouTube, TikTok, Vimeo, Telegram)에 최적화합니다.

![Timeline Interface](/public/screen3.png)

### 프로젝트 상태 (2025년 6월)

**전체 완성도: 53.8%** ⬆️ (실제 모듈 상태와 14개의 새로운 계획 모듈로 재계산)
- **완료**: 11개 모듈 (100% 준비)
- **개발 중**: 8개 모듈 (45-85% 준비)
- **계획됨**: 5개 모듈 (30-85% 준비)
- **새로 계획됨**: 14개 모듈 (0% 준비) - [planned/에서 세부사항](docs-ru/08-roadmap/planned/)

### 주요 성과:
- ✅ **비디오 컴파일러** - GPU 가속으로 완전 구현 (100%)
- ✅ **타임라인** - 메인 편집기 완전 기능 (100%)
- ✅ **미디어 관리** - 파일 관리 준비 완료 (100%)
- ✅ **핵심 아키텍처** - app-state, browser, modals, user/project settings (100%)
- ✅ **인식** - YOLO v11 객체 및 얼굴 인식 (100%)
- 🔄 **효과/필터/전환** - Filmora 스타일의 풍부한 효과 라이브러리 (75-80%)
- 🔄 **내보내기** - 거의 완료, 매개변수 세부사항 남음 (85%)
- 🔄 **리소스 패널** - 메인 UI 준비, 드래그 & 드롭 누락 (80%)
- ❗ **AI 채팅** - 실제 API 통합 필요 (30%)
- 📋 **14개 새로운 계획 모듈** - [planned/ 참조](docs-ru/08-roadmap/planned/) DaVinci + Filmora 수준 달성을 위해
- 🎯 **목표** - DaVinci 파워와 Filmora 라이브러리를 AI 자동화와 결합

## 주요 기능

- 🎬 멀티 트랙 타임라인을 이용한 전문적인 동영상 편집
- 🖥️ 크로스 플랫폼 (Windows, macOS, Linux)
- 🚀 GPU 가속 비디오 처리 (NVENC, QuickSync, VideoToolbox)
- 🤖 AI 기반 객체/얼굴 인식 (YOLO v11)
- 🎨 30개 이상의 전환, 시각 효과 및 필터
- 📝 12가지 스타일과 애니메이션을 지원하는 고급 자막 시스템
- 🎵 효과가 포함된 멀티 트랙 오디오 편집
- 🌐 국제화 지원 (13개 언어)
- 💾 스마트 캐싱 및 미리보기 생성
- 🎨 Tailwind CSS v4, shadcn-ui를 사용한 현대적인 UI
- 📚 2400+ 테스트(98.8% 성공률)로 완전한 문서화

## 시작하기

### 사전 요구사항

- [Node.js](https://nodejs.org/) (v18 이상)
- [Rust](https://www.rust-lang.org/tools/install) (최신 안정 버전)
- [bun](https://bun.sh/) (최신 안정 버전)
- [ffmpeg](https://ffmpeg.org/download.html) (최신 안정 버전)

### 설치

1. 저장소 복제:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. 의존성 설치:

```bash
bun install
```

### 개발 모드 실행

```bash
bun run tauri dev
```

### 릴리스 빌드

```bash
bun run tauri build
```

## 문서

### 📚 주요 문서

- 📚 [문서 맵](docs-ru/MAP.md) - 완전한 문서 개요
- 🏗️ [아키텍처 가이드](docs-ru/ARCHITECTURE.md) - 시스템 아키텍처
- 🧪 [테스팅 가이드](docs-ru/testing/TESTING.md) - 테스트 전략
- 📡 [API 참조](docs-ru/API.md) - Tauri 명령 참조
- 🚀 [배포 가이드](docs-ru/deployment/DEPLOYMENT.md) - 빌드 및 배포
- 🛣️ [로드맵](docs-ru/ROADMAP.md) - 개발 로드맵

### 📋 프로젝트 문서

- **`src/features/README.md`** - 우선순위와 상태를 포함한 모든 기능 개요
- **언어 버전**: 위의 선택기를 통해 11개 언어로 제공

## 개발

### 빠른 시작

```bash
# 개발 모드
bun run tauri dev

# 테스트 실행
bun run test && bun run test:rust

# 코드 품질 검사
bun run check:all
```

### 필수 명령어

| 명령어 | 설명 |
|-------|------|
| `bun run tauri dev` | 전체 애플리케이션을 개발 모드로 시작 |
| `bun run dev` | 프론트엔드만 시작 |
| `bun run build` | 프로덕션용 빌드 |
| `bun run test` | 프론트엔드 테스트 실행 |
| `bun run test:rust` | 백엔드 테스트 실행 |
| `bun run lint` | 코드 품질 검사 |
| `bun run fix:all` | 코드 문제 자동 수정 |

📚 **[완전한 개발 가이드 →](docs-ru/05-development/README.md)**

### 테스트 커버리지 상태

✅ **프론트엔드 테스트**: 3,604 통과
✅ **백엔드 테스트**: 554 통과 (+18 새로운!)
📊 **총합**: 4,158 테스트 통과

### 테스팅

프로젝트는 단위 테스트를 위해 Vitest를 사용합니다. 테스트는 기능의 __tests__ 디렉토리에 위치하며, __mocks__에 모의 객체가 있습니다.

## CI/CD 및 코드 품질

### 자동화된 프로세스
- ✅ **린팅**: ESLint, Stylelint, Clippy
- ✅ **테스트**: 프론트엔드 (Vitest), 백엔드 (Rust), E2E (Playwright)
- ✅ **커버리지**: Codecov 통합
- ✅ **빌드**: 크로스 플랫폼 빌드

📚 **[상세 CI/CD 가이드 →](docs-ru/06-deployment/README.md)**
🔧 **[린팅 및 포맷팅 →](docs-ru/05-development/linting-and-formatting.md)**

## 문서 및 리소스

- 📚 [**API 문서**](https://chatman-media.github.io/timeline-studio/api-docs/) - 자동 생성된 TypeScript 문서
- 🚀 [**프로모 페이지**](https://chatman-media.github.io/timeline-studio/) - 프로젝트 쇼케이스
- 📖 [**완전한 문서**](docs-ru/README.md) - 러시아어 완전 가이드
- 🎬 [**라이브 데모**](https://chatman-media.github.io/timeline-studio/) - 온라인에서 편집기 시도

## 추가 자료

- [Tauri 문서](https://v2.tauri.app/start/)
- [XState 문서](https://xstate.js.org/docs/)
- [Vitest 문서](https://vitest.dev/guide/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Shadcn UI 문서](https://ui.shadcn.com/)
- [Stylelint 문서](https://stylelint.io/)
- [ESLint 문서](https://eslint.org/docs/latest/)
- [Playwright 문서](https://playwright.dev/docs/intro)
- [TypeDoc 문서](https://typedoc.org/)
- [ffmpeg 문서](https://ffmpeg.org/documentation.html)

## 라이선스

이 프로젝트는 Commons Clause 조건이 포함된 MIT 라이선스 하에 배포됩니다.

**주요 조건:**

- **오픈 소스**: MIT 라이선스 조건에 따라 코드를 자유롭게 사용, 수정 및 배포할 수 있습니다.
- **상업적 사용 제한**: Commons Clause는 작성자와의 별도 계약 없이 소프트웨어를 "판매"하는 것을 금지합니다.
- **"판매"**는 소프트웨어 기능을 사용하여 제3자에게 유료로 제품이나 서비스를 제공하는 것을 의미합니다.

이 라이선스는 다음을 허용합니다:

- 개인 및 비상업적 프로젝트에 코드 사용
- 코드 연구 및 수정
- 동일한 라이선스 하에 수정 사항 배포

하지만 다음을 금지합니다:

- 라이선스 없이 코드를 기반으로 한 상업적 제품이나 서비스 생성

상업적 라이선스를 얻으려면 작성자에게 연락하세요: ak.chatman.media@gmail.com

전체 라이선스 텍스트는 [LICENSE](./LICENSE) 파일에서 확인할 수 있습니다.

## GitHub Pages

프로젝트는 API 문서 및 프로모 페이지 호스팅을 위해 GitHub Pages를 사용합니다:

- **프로모 페이지**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API 문서**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

두 페이지 모두 GitHub Actions 워크플로우를 사용하여 `main` 브랜치의 해당 파일 변경 시 자동으로 업데이트됩니다.
