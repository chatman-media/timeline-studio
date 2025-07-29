# [0.39.0](https://github.com/chatman-media/timeline-studio/compare/v0.38.3...v0.39.0) (2025-07-29)


### Bug Fixes

* **person-identification:** исправлены типы embedding в тестах ([8fe2198](https://github.com/chatman-media/timeline-studio/commit/8fe2198c3aa2e8821310104f42114920d2a0d19f))
* **promo:** исправлены ошибки Stylelint в CSS ([fc4f610](https://github.com/chatman-media/timeline-studio/commit/fc4f610b849a5484ee90dad4a86c2a23395ebe94))
* удален getServerSideProps из oauth/callback для совместимости со статическим экспортом ([633b61c](https://github.com/chatman-media/timeline-studio/commit/633b61cc9ab017f66861821526f42f7c712eb160))


### Features

* **person-identification:** реализована продвинутая система распознавания лиц ([2a09987](https://github.com/chatman-media/timeline-studio/commit/2a09987c5932acd82b2c7aa8d8e5bff1eac643dd))
* **promo:** усилен glass эффект навигации ([44a63f3](https://github.com/chatman-media/timeline-studio/commit/44a63f314d1662c67bc6659282d37145d34238e7))

## [0.38.3](https://github.com/chatman-media/timeline-studio/compare/v0.38.2...v0.38.3) (2025-07-28)


### Bug Fixes

* заменен require на динамический import в тесте use-filters-import ([c0ea8ef](https://github.com/chatman-media/timeline-studio/commit/c0ea8efea8fc515339dce999da07444cdac42e57))

## [0.38.2](https://github.com/chatman-media/timeline-studio/compare/v0.38.1...v0.38.2) (2025-07-28)


### Bug Fixes

* **promo:** исправлена проблема с changelog на промо-сайте ([64592d3](https://github.com/chatman-media/timeline-studio/commit/64592d330ec8106d654f5f384f970d532f1caf0c))

## [0.38.1](https://github.com/chatman-media/timeline-studio/compare/v0.38.0...v0.38.1) (2025-07-28)


### Bug Fixes

* исправлены ошибки в тестах use-filters-import ([3a27b08](https://github.com/chatman-media/timeline-studio/commit/3a27b08d8dc29144862f9bf39fb2dce532157ed9))

# [0.38.0](https://github.com/chatman-media/timeline-studio/compare/v0.37.2...v0.38.0) (2025-07-28)


### Bug Fixes

* Исправлена инициализация nextEventId в MidiSequencer ([7062ad8](https://github.com/chatman-media/timeline-studio/commit/7062ad84e1f2d7e1773e30d968ddac6a897e2bba))
* Исправлены все ошибки и предупреждения линтера ([3671310](https://github.com/chatman-media/timeline-studio/commit/36713106b3c81c6eea5046c78870217f8fba683b))
* Исправлены все ошибки линтера ([14fe2e9](https://github.com/chatman-media/timeline-studio/commit/14fe2e9f807136ef612cc06b13a72ff145bc034c))
* Исправлены ошибки импорта и тесты для multicam ([d7c504c](https://github.com/chatman-media/timeline-studio/commit/d7c504cb0c873914f3a5008fea03fbee6e0e9922))
* Исправлены тесты use-camera-sync ([8204b49](https://github.com/chatman-media/timeline-studio/commit/8204b498d92c88e6a4dcf65d1c8a421d998250bf))


### Features

* implement silent updates system and complete version control ([631f0d4](https://github.com/chatman-media/timeline-studio/commit/631f0d405a213afb8f3f9f304dac37d23d0f08f1))

## [0.37.2](https://github.com/chatman-media/timeline-studio/compare/v0.37.1...v0.37.2) (2025-07-28)


### Bug Fixes

* Fix build issues for macOS and Windows ([23efc10](https://github.com/chatman-media/timeline-studio/commit/23efc106a5b4b94cff974b7b01b6b57248030aec))

## [0.37.1](https://github.com/chatman-media/timeline-studio/compare/v0.37.0...v0.37.1) (2025-07-28)


### Bug Fixes

* настроена поддержка SPA роутинга для всех хостингов ([6eca72e](https://github.com/chatman-media/timeline-studio/commit/6eca72e31a9e3e84b8064867e10f117702615588))

# [0.37.0](https://github.com/chatman-media/timeline-studio/compare/v0.36.1...v0.37.0) (2025-07-28)


### Bug Fixes

* настроен клиентский роутинг для SPA ([5877f14](https://github.com/chatman-media/timeline-studio/commit/5877f140954e63ed56e2e6c1bbe3fa47e8a4fade))
* улучшен Kiro-стиль эффект и упрощены кнопки скачивания ([39ab779](https://github.com/chatman-media/timeline-studio/commit/39ab779211aa55c54461e661a8fcc42bcbb98e52))


### Features

* **promo:** add pricing, terms and privacy pages with footer improvements ([8f770af](https://github.com/chatman-media/timeline-studio/commit/8f770af599a5c20a96fd864f5c90a48a456507f4))
* **promo:** add responsible AI policy and improve mobile navigation ([534dcc9](https://github.com/chatman-media/timeline-studio/commit/534dcc929f7b932cef06f29fe4b627de58be7b28))
* **promo:** enhance UI with liquid glass effects and improved animations ([98b6994](https://github.com/chatman-media/timeline-studio/commit/98b699487db424e841f4df8c01d0beed88b5bfea))
* **promo:** increase blur effect for navigation liquid glass ([5b60401](https://github.com/chatman-media/timeline-studio/commit/5b60401d19a484397eae2e81cbbc14fa7b3352ae))
* **promo:** update logo font to use handwriting style ([c35c41d](https://github.com/chatman-media/timeline-studio/commit/c35c41dcd40b9e26e10000c9f9b88566a44d98e9))
* добавлен Kiro-стиль эффект наведения на кнопки скачивания ([9a7fce1](https://github.com/chatman-media/timeline-studio/commit/9a7fce1fecdebb814f9fe7263a114d05b2496dce))
* добавлен React Router для всех внутренних ссылок ([a5c2d7c](https://github.com/chatman-media/timeline-studio/commit/a5c2d7cc70c1f41f8bab7a7e3330e73360d1ecf1))
* добавлена страница документации и обновлены ссылки ([2a56f5d](https://github.com/chatman-media/timeline-studio/commit/2a56f5d73a492f073ecfe453481a9ee1f51c96cf))
* настроен semantic-release для автоматического версионирования ([5173430](https://github.com/chatman-media/timeline-studio/commit/517343039ababdb5a6ec8b556ebc6fa8dbd3ee44))

# Changelog

All notable changes to Timeline Studio will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.36.0] - 2025-01-01

### Added
- AI Chat Integration with Claude/OpenAI/DeepSeek/Ollama support
- Smart Montage Planner with AI-powered automatic montage generation
- Enhanced Timeline with complete editing capabilities
- 151+ specialized AI tools for video editing
- Multi-language support (10 languages)
- Advanced audio processing with Fairlight integration

### Changed
- Updated to Tauri v2 for better performance
- Improved UI with liquid glass effects
- Enhanced navigation with smooth scrolling
- Better GPU acceleration support

### Fixed
- macOS build issues with FFmpeg integration
- Navigation transform on scroll
- Hover effects in UI components
- Memory leaks in video processing
