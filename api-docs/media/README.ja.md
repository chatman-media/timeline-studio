# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

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

## プロジェクト概要

Timeline Studioは、Tauriアーキテクチャ（Rust + React）で構築された最新のビデオエディターです。

**私たちの目標**：以下を組み合わせたエディターの作成：
- **DaVinci Resolveのプロフェッショナルパワー** - 編集、カラーグレーディング、オーディオミキシング、ビジュアルエフェクト、モーショングラフィックス、高度な合成の完全な制御
- **豊富なクリエイティブライブラリ** - Filmoraなどの人気エディターに匹敵するエフェクト、フィルター、トランジション、マルチカメラテンプレート、アニメーションタイトル、スタイルテンプレート、字幕プリセット
- **AIスクリプトと自動化** - 異なる言語と異なるプラットフォーム向けの自動コンテンツ生成

**主要な革新**：ユーザーがビデオ、音楽、その他のリソースをアップロードするだけで、AIが異なる言語と異なるプラットフォーム（YouTube、TikTok、Instagram、Telegram）に最適化されたビデオのセットを自動的に作成します。

![タイムラインインターフェース #1](/public/screen2.png)

![タイムラインインターフェース #2](/public/screen4.png)

### プロジェクトステータス（2025年6月）

**全体的な完成度：53.8%** ⬆️（モジュールの実際の状態と1414の新しい計画モジュールで再計算）
- **完了**：11モジュール（100%準備完了）
- **開発中**：8モジュール（45-85%準備完了）
- **計画済み**：5モジュール（30-85%準備完了）
- **新計画**：14モジュール（0%準備完了）- [詳細はplanned/](docs-ru/08-roadmap/planned/)

### 主要な成果：
- ✅ **ビデオコンパイラー** - GPU加速で完全実装（100%）
- ✅ **タイムライン** - メインエディターが完全機能（100%）
- ✅ **メディア管理** - ファイル管理準備完了（100%）
- ✅ **コアアーキテクチャ** - app-state、browser、modals、user/project settings（100%）
- ✅ **認識** - YOLO v11オブジェクト・顔認識（100%）
- 🔄 **エフェクト/フィルター/トランジション** - Filmoraスタイルの豊富なエフェクトライブラリ（75-80%）
- 🔄 **エクスポート** - ほぼ完成、パラメーターの詳細が残っている（85%）
- 🔄 **リソースパネル** - メインUI準備完了、ドラッグ&ドロップが不足（80%）
- ❗ **AIチャット** - 実際API統合が必要（30%）
- 📋 **14の新計画モジュール** - [planned/を参照](docs-ru/08-roadmap/planned/) DaVinci + Filmoraレベルに達するため
- 🎯 **目標** - DaVinciのパワーとFilmoraのライブラリをAI自動化で結合

## 主な機能

- 🎬 マルチトラックタイムラインによるプロフェッショナルなビデオ編集
- 🖥️ クロスプラットフォーム（Windows、macOS、Linux）
- 🚀 GPU加速ビデオ処理（NVENC、QuickSync、VideoToolbox）
- 🤖 AI駆動のオブジェクト/顔認識（YOLO v11 - ORT修正済み）
- 🎨 30種類以上のトランジション、視覚効果、フィルター
- 📝 12種類のスタイルとアニメーションを備えた高度な字幕システム
- 🎵 エフェクト付きマルチトラックオーディオ編集
- 📤 ソーシャルメディアOAuth統合付きMP4/MOV/WebMエクスポート
- 🔐 YouTube/TikTok/Vimeo/Telegram OAuth対応、安全なトークン保存
- 📱 最適化されたエクスポート用デバイスプリセット（iPhone、iPad、Android）
- 🧠 XState v5を使用した状態管理
- 🌐 国際化サポート（11言語）
- 💾 スマートキャッシングと統一プレビューシステム
- 🎨 Tailwind CSS v4、shadcn-uiを使用したモダンなUI
- 📚 2400以上のテスト（98.8%成功率）による完全なドキュメント

## はじめに

### 前提条件

- [Node.js](https://nodejs.org/)（v18以降）
- [Rust](https://www.rust-lang.org/tools/install)（最新の安定版）
- [bun](https://bun.sh/)（最新の安定版）
- [ffmpeg](https://ffmpeg.org/download.html)（最新の安定版）

### インストール

1. リポジトリをクローン：

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. 依存関係をインストール：

```bash
bun install
```

### 開発モードの起動

```bash
bun run tauri dev
```

### プロダクションビルド

```bash
bun run tauri build
```

## ドキュメント

### 📚 メインドキュメント

- 📚 [ドキュメント概要](docs-ru/README.md) - 完全なドキュメントマップ
- 🚀 [はじめに](docs-ru/01-getting-started/README.md) - インストールと最初のステップ
- 🏗️ [アーキテクチャガイド](docs-ru/02-architecture/README.md) - システムアーキテクチャ
- 🎯 [機能ガイド](docs-ru/03-features/README.md) - 機能概要とステータス
- 📡 [APIリファレンス](docs-ru/04-api-reference/README.md) - Tauriコマンドリファレンス
- 🧪 [開発ガイド](docs-ru/05-development/README.md) - テストと開発
- 🚀 [デプロイメントガイド](docs-ru/06-deployment/README.md) - ビルドとデプロイメント
- 📋 [ユーザーガイド](docs-ru/07-guides/README.md) - パフォーマンスとベストプラクティス
- 🛣️ [ロードマップ](docs-ru/08-roadmap/README.md) - 開発ロードマップ
- 🔐 [OAuth設定](docs-ru/09-oauth-setup/oauth-setup-guide.md) - ソーシャルメディア統合

### 📋 プロジェクトドキュメント

- **`src/features/README.md`** - 優先順位とステータスを含むすべての機能の概要
- **言語版**: 上記のセレクターから11言語で利用可能

## 開発

### クイックスタート

```bash
# 開発モード
bun run tauri dev

# テスト実行
bun run test && bun run test:rust

# コード品質チェック
bun run check:all
```

### 基本コマンド

| コマンド | 説明 |
|---------|------|
| `bun run tauri dev` | 完全なアプリケーションを開発モードで起動 |
| `bun run dev` | フロントエンドのみ起動 |
| `bun run build` | プロダクション用ビルド |
| `bun run test` | フロントエンドテスト実行 |
| `bun run test:rust` | バックエンドテスト実行 |
| `bun run lint` | コード品質チェック |
| `bun run fix:all` | コード問題の自動修正 |

📚 **[完全な開発ガイド →](docs-ru/05-development/README.md)**

### テストカバレッジ状態

✅ **フロントエンドテスト**：3,604成功  
✅ **バックエンドテスト**：554成功（+18新規！）  
📊 **合計**：4,158テスト成功
- `bun run test:coverage:report` - テストカバレッジレポートを生成・送信
- `bun run test:rust` - Rustバックエンドテストを実行
- `bun run test:rust:watch` - ウォッチモードでRustテストを実行
- `bun run test:coverage:rust` - カバレッジ付きでRustテストを実行
- `bun run test:coverage:rust:report` - Rustカバレッジレポートを生成・送信
- `bun run test:ui` - UIインターフェースでテストを実行
- `bun run test:e2e` - PlaywrightでEnd-to-Endテストを実行
- `bun run test:e2e:ui` - Playwright UIでE2Eテストを実行
- `bun run test:e2e:basic` - 基本的なメディアインポートE2Eテストを実行
- `bun run test:e2e:real` - 実際のメディアファイルでE2Eテストを実行
- `bun run test:e2e:integration` - 統合E2Eテストを実行（INTEGRATION_TEST=trueが必要）
- `bun run playwright:install` - Playwrightブラウザをインストール

### テスト

プロジェクトはユニットテストにVitestを使用しています。テストは各機能の__tests__ディレクトリ内にあり、モックは__mocks__内にあります。

#### 🧪 テストカバレッジステータス:
```bash
⨯ bun run test

 Test Files  258 passed | 1 skipped (259)
      Tests  3604 passed | 60 skipped (3664)
   Start at  20:08:23
   Duration  26.48s (transform 5.42s, setup 53.03s, collect 25.72s, tests 32.83s, environment 67.99s, prepare 16.45s)

⨯ bun run test:rust
   test result: ok. 366 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 12.38s

```

```bash
# クライアントテストを実行
bun run test

# Rustテストを実行
bun run test:rust

# カバレッジレポート付きでテストを実行
bun run test:coverage

# 特定の機能のテストを実行
bun run test src/features/effects
```

## CI/CDとコード品質

### 自動化プロセス
- ✅ **リンティング**: ESLint、Stylelint、Clippy
- ✅ **テスト**: フロントエンド（Vitest）、バックエンド（Rust）、E2E（Playwright）
- ✅ **カバレッジ**: Codecov統合
- ✅ **ビルド**: クロスプラットフォームビルド

📚 **[詳細なCI/CDガイド →](docs-ru/06-deployment/README.md)**  
🔧 **[リンティングとフォーマッティング →](docs-ru/05-development/linting-and-formatting.md)**

## ドキュメントとリソース

- 📚 [**APIドキュメント**](https://chatman-media.github.io/timeline-studio/api-docs/) - 自動生成されたTypeScriptドキュメント
- 🚀 [**プロモページ**](https://chatman-media.github.io/timeline-studio/) - プロジェクトショーケース
- 📖 [**完全なドキュメント**](docs-ru/README.md) - ロシア語での完全ガイド
- 🎬 [**ライブデモ**](https://chatman-media.github.io/timeline-studio/) - オンラインでエディターを試す

## 追加リソース

- [Tauriドキュメント](https://v2.tauri.app/start/)
- [XStateドキュメント](https://xstate.js.org/docs/)
- [Vitestドキュメント](https://vitest.dev/guide/)
- [Tailwind CSSドキュメント](https://tailwindcss.com/docs)
- [Shadcn UIドキュメント](https://ui.shadcn.com/)
- [Stylelintドキュメント](https://stylelint.io/)
- [ESLintドキュメント](https://eslint.org/docs/latest/)
- [Playwrightドキュメント](https://playwright.dev/docs/intro)
- [TypeDocドキュメント](https://typedoc.org/)
- [ffmpegドキュメント](https://ffmpeg.org/documentation.html)

## ライセンス

このプロジェクトはCommons Clause条件付きのMITライセンスの下で配布されています。

**主な条項：**

- **オープンソース**: MITライセンスの条項に従って、コードを自由に使用、変更、配布することができます。
- **商用利用制限**: Commons Clauseは、作者との別の合意なしにソフトウェアを「販売」することを禁止しています。
- **「販売」**とは、ソフトウェアの機能を使用して、第三者に有料で製品やサービスを提供することを意味します。

このライセンスは以下を許可します：

- 個人的および非商用プロジェクトでのコードの使用
- コードの学習と変更
- 同じライセンスの下での変更の配布

しかし、以下を禁止します：

- ライセンスなしでコードに基づく商用製品やサービスの作成

商用ライセンスを取得するには、作者にお問い合わせください：ak.chatman.media@gmail.com

完全なライセンステキストは[LICENSE](./LICENSE)ファイルで利用可能です

## GitHub Pages

プロジェクトはAPIドキュメントとプロモページのホスティングにGitHub Pagesを使用しています：

- **プロモページ**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **APIドキュメント**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

両方のページは、GitHub Actionsワークフローを使用して`main`ブランチで対応するファイルが変更されると自動的に更新されます。