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

## プロジェクト概要

Timeline Studioは、最新のWeb技術とネイティブパフォーマンスで構築されたプロフェッショナルなビデオ編集アプリケーションです。私たちの目標は、誰もがアクセスできるDaVinci Resolveレベルのエディターを作成することです。

![タイムラインインターフェース #1](/public/screen2.png)

![タイムラインインターフェース #2](/public/screen4.png)

### プロジェクトステータス（2025年6月）

**全体的な完成度：86.2%** ⬆️（OAuth統合とExport完成後に更新）
- ✅ コア編集機能完了
- ✅ GPU加速付きビデオコンパイラー
- ✅ 認識モジュール（YOLO v11）- ORT修正済み
- ✅ エフェクト、フィルター、トランジション（75-80%）
- ✅ Export - 完全なソーシャルメディア統合！（98%）🎉
- ✅ OAuth統合 - YouTube/TikTok/Vimeo/Telegramサポート
- ✅ Preview Managerによる統一プレビューシステム
- ✅ メディア永続化と一時プロジェクト
- ✅ テンプレートシステム - 設定ベース（95%完了）
- ✅ Timeline 90%完了
- ⚠️ リソースパネル開発中（85%）
- 🎯 目標MVPリリース：2025年6月末

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

- 📚 [ドキュメントマップ](docs-ru/MAP.md) - 完全なドキュメント概要
- 🏗️ [アーキテクチャガイド](docs-ru/ARCHITECTURE.md) - システムアーキテクチャ
- 🧪 [テストガイド](docs-ru/testing/TESTING.md) - テスト戦略
- 📡 [APIリファレンス](docs-ru/API.md) - Tauriコマンドリファレンス
- 🚀 [デプロイメントガイド](docs-ru/deployment/DEPLOYMENT.md) - ビルドとデプロイメント
- 🛣️ [ロードマップ](docs-ru/ROADMAP.md) - 開発ロードマップ

### 📋 プロジェクトドキュメント

- **`src/features/README.md`** - 優先順位とステータスを含むすべての機能の概要
- **言語版**: 上記のセレクターから13言語で利用可能

## 開発

### 利用可能なスクリプト

- `bun run dev` - 開発モードでNext.jsを起動
- `bun run tauri dev` - 開発モードでTauriを起動
- `bun run build` - Next.jsをビルド
- `bun run tauri build` - Tauriアプリケーションをビルド
- `bun run test` - すべてのテストを実行
- `bun run test:watch` - ウォッチモードでテストを実行
- `bun run lint` - コードをチェック
- `bun run format` - コードをフォーマット

### 技術スタック

- **フロントエンド**: Next.js 15、React 19、TypeScript、XState v5
- **バックエンド**: Tauri v2 (Rust)、FFmpeg
- **UI**: Tailwind CSS v4、shadcn-ui、Radix UI
- **テスト**: Vitest、Testing Library、Playwright
- **AI**: ONNX Runtime、YOLO v11

## 貢献

行動規範とプルリクエストの送信プロセスの詳細については、[CONTRIBUTING.md](CONTRIBUTING.md)をお読みください。

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています - 詳細は[LICENSE](LICENSE)ファイルを参照してください。

## お問い合わせ

- GitHub Issues: [github.com/chatman-media/timeline-studio/issues](https://github.com/chatman-media/timeline-studio/issues)
- Telegram: [@timelinestudio](https://t.me/timelinestudio)
- ウェブサイト: [chatman-media.github.io/timeline-studio](https://chatman-media.github.io/timeline-studio/)

---

⭐ このプロジェクトが気に入ったら、スターを付けてください！