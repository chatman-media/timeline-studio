# [2.6.0](https://github.com/chatman-media/timeline-studio/compare/v2.5.0...v2.6.0) (2025-11-07)


### Bug Fixes

* Добавлен semicolon в тесте test_language_state_mutex_recovery ([7bef55e](https://github.com/chatman-media/timeline-studio/commit/7bef55e38facdb1707220d2bec3754e33f6f5155))
* Исправлены layout presets для точного соответствия оригинальным ([384ff3b](https://github.com/chatman-media/timeline-studio/commit/384ff3bbfda3ea4f80062201a685521a91414209))
* Убран ненужный вызов drop() для tauri::State ([558c132](https://github.com/chatman-media/timeline-studio/commit/558c132b2ef3627434a44ae9130be93ea11303c1))


### Features

* Добавлен 5-й preset Chat Layout с AI виджетами ([1fd0434](https://github.com/chatman-media/timeline-studio/commit/1fd043458f5290c380d2d29a5107b027240af326))
* Добавлено Tauri Logger логирование в AI Chat модуль ([1c468a1](https://github.com/chatman-media/timeline-studio/commit/1c468a1108cb532ecc7cb4b0fac8f3ab8edbd779))
* Добавлено Tauri Logger логирование в Browser модуль ([64af0a2](https://github.com/chatman-media/timeline-studio/commit/64af0a201a58b707e7965144150b7345843f255e))
* Добавлено Tauri Logger логирование в Montage Planner модуль ([3304ed4](https://github.com/chatman-media/timeline-studio/commit/3304ed4730be4920fe3119467255481ce35986a3))
* Добавлено Tauri Logger логирование в Templates и Color Grading модули ([cea8353](https://github.com/chatman-media/timeline-studio/commit/cea8353e3d145601f516144a86bcad8dc47789db))
* Обновление до Next.js 16 и восстановление layout ([68360b5](https://github.com/chatman-media/timeline-studio/commit/68360b5cb9bb3cbb57324cd29ecf5999fa8a1cd7))
* Реализована виджетная система workspace на базе [@dnd-kit](https://github.com/dnd-kit) ([9620548](https://github.com/chatman-media/timeline-studio/commit/96205481de18cc66ae4a44b6c5318ada378d57a3))

# [2.5.0](https://github.com/chatman-media/timeline-studio/compare/v2.4.0...v2.5.0) (2025-11-07)


### Bug Fixes

* Исправлен тест mutex poisoning в language_tauri для предотвращения ошибок ([738e4ed](https://github.com/chatman-media/timeline-studio/commit/738e4ed5f3dc60c282544c474c94005d1e7ea431))
* Исправлена совместимость Tauri Logger с e2e тестами и тестовым окружением ([7debd2e](https://github.com/chatman-media/timeline-studio/commit/7debd2e36b18d115c5c497c0f9458f35b17ea04a))


### Features

* Добавлено Tauri Logger логирование в Fairlight Audio модуль ([11d29e6](https://github.com/chatman-media/timeline-studio/commit/11d29e6bf1b6a405a1e2e025f9ebe54f0eeecc8d))
* Добавлено Tauri Logger логирование в Person Identification модуль ([4c09ce1](https://github.com/chatman-media/timeline-studio/commit/4c09ce11b94b6787019576eef10ef29b5ee8db2e))
* Добавлено Tauri Logger логирование в Updates и Modals модули ([31e6bfb](https://github.com/chatman-media/timeline-studio/commit/31e6bfb54d4882ea73569cef455402c7788b3769))

# [2.4.0](https://github.com/chatman-media/timeline-studio/compare/v2.3.5...v2.4.0) (2025-11-07)


### Bug Fixes

* Добавлены моки для Tauri Logger в тестовое окружение ([98c59e0](https://github.com/chatman-media/timeline-studio/commit/98c59e017dd8430b00d730e992d1589de90fafd5))
* Исправлен баг определения типа медиа и восстановлены шаблоны ([ee93c8c](https://github.com/chatman-media/timeline-studio/commit/ee93c8ccd913164cce4186e0c7c7bea28c7bfd19))
* Исправлены timeline-content тесты после изменений в компоненте ([b97b120](https://github.com/chatman-media/timeline-studio/commit/b97b120ceb9be7ca24beafc848e66235daf9c7a1))
* Исправлены упавшие тесты после добавления Tauri Logger ([39fe39c](https://github.com/chatman-media/timeline-studio/commit/39fe39c49fdf66326898028109fb0d8e4ca6c9d1))
* Обновлены тесты templates после восстановления полного набора шаблонов ([e6e9d5a](https://github.com/chatman-media/timeline-studio/commit/e6e9d5a96c8426d46f4ec501a603b570f2edd9b5))


### Features

* Добавлено Tauri Logger логирование в Recognition, AI-Director и Subtitles модули ([d844a6c](https://github.com/chatman-media/timeline-studio/commit/d844a6c122761cee0eb6b86129bc09016858ea67))
* Добавлено комплексное Tauri Logger логирование во все ключевые модули ([0cfb368](https://github.com/chatman-media/timeline-studio/commit/0cfb36869ec4f3c3cd3f6904bcfdc6fd60bc675c))
* Расширено логирование Tauri Logger на AI, медиа и ресурсные модули ([1916dfe](https://github.com/chatman-media/timeline-studio/commit/1916dfec9c936f316586a71a8f4845e307176e6a))
* Расширено логирование Tauri Logger на AI, медиа и ресурсные модули ([f04dad2](https://github.com/chatman-media/timeline-studio/commit/f04dad284e496ca319c971d64890878c6af56590))

## [2.3.5](https://github.com/chatman-media/timeline-studio/compare/v2.3.4...v2.3.5) (2025-11-06)


### Bug Fixes

* Унифицировать проверку Tauri окружения для v2 ([b1b16dd](https://github.com/chatman-media/timeline-studio/commit/b1b16ddd2ad1fd84ebb3051026553fbb8291488d))

## [2.3.4](https://github.com/chatman-media/timeline-studio/compare/v2.3.3...v2.3.4) (2025-11-06)


### Bug Fixes

* Исправлена проблема с пустым отображением шаблонов после миграции ([6e4bf06](https://github.com/chatman-media/timeline-studio/commit/6e4bf06092d9bb2a33c6c32e6d5e9c82aa81e29d))
* Сохранение метаданных видео при синхронизации с backend ([946a5b1](https://github.com/chatman-media/timeline-studio/commit/946a5b1be5900aca9d07e3af70bffc97277c1533))
* Удалены сообщения о загрузке Timeline ([3211d63](https://github.com/chatman-media/timeline-studio/commit/3211d6393fba1ae6b08939f86bb198347f820c84))

## [2.3.3](https://github.com/chatman-media/timeline-studio/compare/v2.3.2...v2.3.3) (2025-11-05)


### Bug Fixes

* Исправлены 5 пропущенных тестов в project-settings-modal ([7d26138](https://github.com/chatman-media/timeline-studio/commit/7d261388177b23f5c5019fd5b3f2478bd0febe65))
* Исправлены пропущенные тесты timeline-content и default-layout ([43d3c70](https://github.com/chatman-media/timeline-studio/commit/43d3c70b619385222bb57e7bcdd9ddd2effdb0d6))

## [2.3.2](https://github.com/chatman-media/timeline-studio/compare/v2.3.1...v2.3.2) (2025-11-05)


### Bug Fixes

* Удален дублирующий экспорт useProjectSettings ([7890cda](https://github.com/chatman-media/timeline-studio/commit/7890cda0d9fa09d62fa0530a5a85c779dc66b3af))

## [2.3.1](https://github.com/chatman-media/timeline-studio/compare/v2.3.0...v2.3.1) (2025-11-05)


### Bug Fixes

* Исправлен type-only импорт React в ResourcesProvider ([beaa876](https://github.com/chatman-media/timeline-studio/commit/beaa8760caf956c7af9a141bd1e527ed2f09a0eb))
* Исправлен импорт несуществующего AppContext ([0d253c2](https://github.com/chatman-media/timeline-studio/commit/0d253c2e0b53956d1e84840568cff499591fcfd2))
* Исправлен порядок объявлений в ResourcesProvider ([20908e0](https://github.com/chatman-media/timeline-studio/commit/20908e066f74214cf14a488fe784639f13621c9f))
* Исправлена циклическая зависимость в ResourcesPanel ([af7686f](https://github.com/chatman-media/timeline-studio/commit/af7686fa3240faceb17f3a1ba36772fcc7603c75))
* Улучшено логирование ошибок загрузки изображений ([752c86b](https://github.com/chatman-media/timeline-studio/commit/752c86b7faa926e716e3f0a6b0d3062ca16c026a))

# [2.3.0](https://github.com/chatman-media/timeline-studio/compare/v2.2.4...v2.3.0) (2025-11-05)


### Features

* Добавлены превью для медиафайлов в панели ресурсов ([05d7ed1](https://github.com/chatman-media/timeline-studio/commit/05d7ed1ea2d58ab81fce6e7d308175c411c7a52d)), closes [#70](https://github.com/chatman-media/timeline-studio/issues/70) [#70](https://github.com/chatman-media/timeline-studio/issues/70)

## [2.2.4](https://github.com/chatman-media/timeline-studio/compare/v2.2.3...v2.2.4) (2025-11-05)


### Bug Fixes

* Исправлен синтаксис HSL цветов в светлой и темной темах ([a26d19f](https://github.com/chatman-media/timeline-studio/commit/a26d19f8677083d4d0cfa06cac730e9faab95e54)), closes [#68](https://github.com/chatman-media/timeline-studio/issues/68) [#68](https://github.com/chatman-media/timeline-studio/issues/68)

## [2.2.3](https://github.com/chatman-media/timeline-studio/compare/v2.2.2...v2.2.3) (2025-11-05)


### Bug Fixes

* Исправлены дубликаты в моках и импорты удаленных legacy файлов ([30d8cb0](https://github.com/chatman-media/timeline-studio/commit/30d8cb0f535bc237eac73f143f514a8de535dc64))
* Исправлены импорты V2 в тестах и добавлен экспорт ProjectSettingsContext ([3d9d435](https://github.com/chatman-media/timeline-studio/commit/3d9d435a824facba70837f20699c7a6ae25dcc37))

## [2.2.2](https://github.com/chatman-media/timeline-studio/compare/v2.2.1...v2.2.2) (2025-11-05)


### Bug Fixes

* Исправлены Rust тесты и добавлены скрипты для скачивания YOLO моделей ([46309ed](https://github.com/chatman-media/timeline-studio/commit/46309ed0d9fe02d6536000a6328c5ff87373fe3f))
* Сделать face detector опциональным в RecognitionService ([5156f5e](https://github.com/chatman-media/timeline-studio/commit/5156f5e5168706f7b63408f4c836f2f0c6da1f7a))
* Удален дублирующий FileSelectionCheckbox из превью медиа ([de68357](https://github.com/chatman-media/timeline-studio/commit/de6835701627f8205c50702a0cd40a8f92997d95))
* Улучшено логирование ошибок загрузки медиа в preview ([d153c82](https://github.com/chatman-media/timeline-studio/commit/d153c82f8af13005821efcb303d4f1274991650e))

## [2.2.1](https://github.com/chatman-media/timeline-studio/compare/v2.2.0...v2.2.1) (2025-11-05)


### Bug Fixes

* Исправлена синхронизация Media browser и автопроигрывание видео ([cbe697a](https://github.com/chatman-media/timeline-studio/commit/cbe697a849c628f4d38db9ef0f4347efc9f591f9))
* Удалены проверки console.log из тестов импорта ([ec344ad](https://github.com/chatman-media/timeline-studio/commit/ec344ad34f3e9bf3d9aae79d9969764be73a6134))

# [2.2.0](https://github.com/chatman-media/timeline-studio/compare/v2.1.5...v2.2.0) (2025-11-05)


### Bug Fixes

* Исправлен баг 4x добавления видео и пустого браузера ([49c4bfc](https://github.com/chatman-media/timeline-studio/commit/49c4bfcc53d6aca366a71b461074b4f619f8739e))
* Исправлены падающие тесты после перехода на новую архитектуру ([5f8f168](https://github.com/chatman-media/timeline-studio/commit/5f8f1686e23d536f36b2189260683f473a2e4c1a))


### Features

* Implement dynamic i18n loading through Tauri backend ([bc265ff](https://github.com/chatman-media/timeline-studio/commit/bc265ff6036e821863ef94254acdcf313847c1c1))

## [2.1.5](https://github.com/chatman-media/timeline-studio/compare/v2.1.4...v2.1.5) (2025-11-04)


### Bug Fixes

* Remove Next.js 16 config and standardize Node.js version ([5593105](https://github.com/chatman-media/timeline-studio/commit/5593105338222165e3faaa92f446701ef9978f7d))

## [2.1.4](https://github.com/chatman-media/timeline-studio/compare/v2.1.3...v2.1.4) (2025-11-04)


### Bug Fixes

* Browser media addition bugs and Next.js downgrade to stable ([4b0f430](https://github.com/chatman-media/timeline-studio/commit/4b0f430cbe3f937c59c8131284635f82c8d271a0))

## [2.1.3](https://github.com/chatman-media/timeline-studio/compare/v2.1.2...v2.1.3) (2025-11-03)


### Bug Fixes

* **tauri:** Change beforeBuildCommand from bun to npm ([824fb0d](https://github.com/chatman-media/timeline-studio/commit/824fb0dbadadb026bbdf33f107e966b123b2aa13))

## [2.1.2](https://github.com/chatman-media/timeline-studio/compare/v2.1.1...v2.1.2) (2025-11-03)


### Bug Fixes

* **ci:** Add Next.js 16 workaround to Build and Release workflow ([807ecbe](https://github.com/chatman-media/timeline-studio/commit/807ecbec411ba87d71344c28189ff47f974fb423)), closes [vercel/next.js#85604](https://github.com/vercel/next.js/issues/85604)

## [2.1.1](https://github.com/chatman-media/timeline-studio/compare/v2.1.0...v2.1.1) (2025-11-03)


### Bug Fixes

* **build:** Temporary workaround for Next.js 16 React Context bug ([0ba56c3](https://github.com/chatman-media/timeline-studio/commit/0ba56c305354662fb4bf6b30a25c21aa41b20456))
* **build:** Workaround for Next.js 16 static export + React Context issue ([cf1a467](https://github.com/chatman-media/timeline-studio/commit/cf1a46774424a91f0ce66ca86fa9b6ef803bb60b))

# [2.1.0](https://github.com/chatman-media/timeline-studio/compare/v2.0.1...v2.1.0) (2025-11-03)


### Bug Fixes

* **build:** Remove deprecated --no-lint flag and Pages Router ([96cbbb3](https://github.com/chatman-media/timeline-studio/commit/96cbbb3b297b7d8e278cfcfee0fdcf5237ab9961))


### Features

* Add custom not-found page for better 404 handling ([f1cf120](https://github.com/chatman-media/timeline-studio/commit/f1cf1208090edd1f917cab4f18ad8ffe2ac60989))

## [2.0.1](https://github.com/chatman-media/timeline-studio/compare/v2.0.0...v2.0.1) (2025-11-03)


