# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## Proje Genel Bakış

Timeline Studio, modern web teknolojileri ve yerel performansla geliştirilmiş profesyonel bir video düzenleme uygulamasıdır. Amacımız, herkese erişilebilir DaVinci Resolve seviyesinde bir editör oluşturmaktır.

![Timeline Interface](/public/screen3.png)

### Proje Durumu (Haziran 2025)

**Genel Tamamlanma: %75**
- ✅ Temel düzenleme işlevselliği tamamlandı
- ✅ GPU hızlandırmalı Video Derleyici
- ✅ Tanıma modülü (YOLO v11)
- ✅ Efektler, filtreler ve geçişler
- ⚠️ Dışa aktarma UI'sının tamamlanması gerekiyor (%25)
- ⚠️ Kaynak paneli geliştiriliyor (%40)
- 🎯 MVP sürüm hedefi: Haziran 2025 sonu

## Ana Özellikler

- 🎬 Çoklu parça zaman çizelgesiyle profesyonel video düzenleme
- 🖥️ Çapraz platform (Windows, macOS, Linux)
- 🚀 GPU hızlandırmalı video işleme (NVENC, QuickSync, VideoToolbox)
- 🤖 AI destekli nesne/yüz tanıma (YOLO v11)
- 🎨 30'dan fazla geçiş, görsel efekt ve filtre
- 📝 12 stil ve animasyonlu gelişmiş altyazı sistemi
- 🎵 Efektli çoklu parça ses düzenleme
- 🧠 XState v5 kullanarak durum yönetimi
- 🌐 Uluslararasılaştırma desteği (6 dil)
- 💾 Akıllı önbelleğe alma ve önizleme oluşturma
- 🎨 Tailwind CSS v4, shadcn-ui kullanarak modern UI
- 📚 %80'den fazla test kapsamıyla tam dokümantasyon

## Başlarken

### Ön Koşullar

- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- [Rust](https://www.rust-lang.org/tools/install) (en son kararlı sürüm)
- [bun](https://bun.sh/) (en son kararlı sürüm)
- [ffmpeg](https://ffmpeg.org/download.html) (en son kararlı sürüm)

### Kurulum

1. Depoyu klonlayın:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Bağımlılıkları yükleyin:

```bash
bun install
```

### Geliştirme Modu Başlatma

```bash
bun run tauri dev
```

### Sürüm Derlemesi

```bash
bun run tauri build
```

## Dokümantasyon

### 📚 Ana Dokümantasyon

- 📚 [Dokümantasyon Haritası](docs-ru/MAP.md) - Tam dokümantasyon genel bakışı
- 🏗️ [Mimari Kılavuzu](docs-ru/ARCHITECTURE.md) - Sistem mimarisi
- 🧪 [Test Kılavuzu](docs-ru/testing/TESTING.md) - Test stratejileri
- 📡 [API Referansı](docs-ru/API.md) - Tauri komutları referansı
- 🚀 [Dağıtım Kılavuzu](docs-ru/deployment/DEPLOYMENT.md) - Derleme ve dağıtım
- 🛣️ [Yol Haritası](docs-ru/ROADMAP.md) - Geliştirme yol haritası

### 📋 Proje Dokümantasyonu

- **`src/features/README.md`** - öncelikler ve durumla birlikte tüm özelliklerin genel bakışı
- **Dil Sürümleri**: Yukarıdaki değiştirici aracılığıyla 13 dilde mevcut

## Geliştirme

### Mevcut Betikler

- `bun run dev` - Geliştirme modunda Next.js başlat
- `bun run tauri dev` - Geliştirme modunda Tauri başlat
- `bun run build` - Next.js derle
- `bun run tauri build` - Tauri uygulaması derle

#### Linting ve Biçimlendirme

- `bun run lint` - ESLint ile JavaScript/TypeScript kodunu kontrol et
- `bun run lint:fix` - ESLint hatalarını düzelt
- `bun run lint:css` - Stylelint ile CSS kodunu kontrol et
- `bun run lint:css:fix` - Stylelint hatalarını düzelt
- `bun run format:imports` - İçe aktarmaları biçimlendir
- `bun run lint:rust` - Clippy ile Rust kodunu kontrol et
- `bun run format:rust` - rustfmt ile Rust kodunu biçimlendir
- `bun run check:all` - Tüm kontrolleri ve testleri çalıştır
- `bun run fix:all` - Tüm linting hatalarını düzelt

#### Test Etme

- `bun run test` - Testleri çalıştır
- `bun run test:app` - Sadece uygulama bileşenleri testlerini çalıştır
- `bun run test:watch` - İzleme modunda testleri çalıştır
- `bun run test:ui` - UI arayüzüyle testleri çalıştır
- `bun run test:e2e` - Playwright ile uçtan uca testleri çalıştır

### Test Etme

Proje, birim testler için Vitest kullanır. Testler, özelliğin __tests__ dizininde bulunur ve mock'lar __mocks__ içindedir.

#### 🧪 Test Kapsamı Durumu:
```bash
⨯ bun run test

 Test Files  242 passed | 1 skipped (243)
      Tests  3284 passed | 60 skipped (3344)
   Start at  16:17:39
   Duration  29.44s (transform 5.03s, setup 47.28s, collect 22.85s, tests 32.74s, environment 74.05s, prepare 22.21s)

⨯ bun run test:rust
   test result: ok. 366 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 12.26s

```

```bash
# İstemci testlerini çalıştır
bun run test

# Rust testlerini çalıştır
bun run test:rust

# Kapsam raporu ile testleri çalıştır
bun run test:coverage

# Belirli fonksiyon testlerini çalıştır
bun run test src/features/effects
```

## Sürekli Entegrasyon ve Dağıtım

Proje, sürekli entegrasyon ve dağıtım için GitHub Actions kullanacak şekilde yapılandırılmıştır. İş akışları:

### Doğrulama ve Derleme

- `check-all.yml` - Tüm kontrolleri ve testleri çalıştır
- `lint-css.yml` - Sadece CSS kodunu kontrol et (CSS dosyaları değiştiğinde çalışır)
- `lint-rs.yml` - Sadece Rust kodunu kontrol et (Rust dosyaları değiştiğinde çalışır)
- `lint-js.yml` - Sadece JavaScript/TypeScript kodunu kontrol et (JavaScript/TypeScript dosyaları değiştiğinde çalışır)

### Dağıtım

- `build.yml` - Projeyi derle
- `build-release.yml` - Sürüm için projeyi derle
- `deploy-promo.yml` - GitHub Pages'de tanıtım sayfasını derle ve yayınla
- `docs.yml` - GitHub Pages'de API dokümantasyonu oluştur ve yayınla

### Linter Yapılandırması

#### Stylelint (CSS)

Proje, CSS kodunu kontrol etmek için Stylelint kullanır. Yapılandırma `.stylelintrc.json` dosyasında bulunur. Ana özellikler:

- Tailwind CSS direktifleri desteği
- Tailwind uyumluluğu için yinelenen seçicileri yoksayma
- Dosyaları kaydederken otomatik hata düzeltme (VS Code'da)

CSS linter'ı çalıştırmak için komutu kullanın:

```bash
bun lint:css
```

Otomatik hata düzeltme için:

```bash
bun lint:css:fix
```

## API Dokümantasyonu

API dokümantasyonu şu adreste mevcuttur: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Dokümantasyonu yerel olarak oluşturmak için komutu kullanın:

```bash
bun run docs
```

Dokümantasyon `docs/` klasöründe mevcut olacaktır.

Gerçek zamanlı dokümantasyon geliştirme için:

```bash
bun run docs:watch
```

Dokümantasyon, GitHub Actions iş akışı `docs.yml` kullanılarak `main` dalındaki kaynak kod değişikliklerinde otomatik olarak güncellenir.

## Tanıtım Sayfası

Proje tanıtım sayfası şu adreste mevcuttur: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

Tanıtım sayfası kaynak kodu `promo/` klasöründe bulunur.

Tanıtım sayfasının yerel geliştirmesi için komutları kullanın:

```bash
cd promo
bun install
bun run dev
```

Tanıtım sayfasını derlemek için:

```bash
cd promo
bun run build
```

Tanıtım sayfası, GitHub Actions iş akışı `deploy-promo.yml` kullanılarak `main` dalındaki `promo/` klasör dosya değişikliklerinde otomatik olarak güncellenir.

## Ek Kaynaklar

- [Tauri Dokümantasyonu](https://v2.tauri.app/start/)
- [XState Dokümantasyonu](https://xstate.js.org/docs/)
- [Vitest Dokümantasyonu](https://vitest.dev/guide/)
- [Tailwind CSS Dokümantasyonu](https://tailwindcss.com/docs)
- [Shadcn UI Dokümantasyonu](https://ui.shadcn.com/)
- [Stylelint Dokümantasyonu](https://stylelint.io/)
- [ESLint Dokümantasyonu](https://eslint.org/docs/latest/)
- [Playwright Dokümantasyonu](https://playwright.dev/docs/intro)
- [TypeDoc Dokümantasyonu](https://typedoc.org/)
- [ffmpeg Dokümantasyonu](https://ffmpeg.org/documentation.html)

## Lisans

Bu proje, Commons Clause koşulu ile MIT Lisansı altında dağıtılmaktadır.

**Ana şartlar:**

- **Açık Kaynak**: MIT Lisans şartlarına göre kodu özgürce kullanabilir, değiştirebilir ve dağıtabilirsiniz.
- **Ticari Kullanım Kısıtlaması**: Commons Clause, yazar ile ayrı bir anlaşma olmaksızın yazılımı "satmayı" yasaklar.
- **"Satmak"**, yazılım işlevselliğini kullanarak üçüncü taraflara ücret karşılığında ürün veya hizmet sağlamak anlamına gelir.

Bu lisans şunlara izin verir:

- Kişisel ve ticari olmayan projelerde kod kullanımı
- Kodu inceleme ve değiştirme
- Değişiklikleri aynı lisans altında dağıtma

Ancak şunları yasaklar:

- Lisans olmaksızın kod tabanlı ticari ürün veya hizmet oluşturma

Ticari lisans almak için yazara başvurun: ak.chatman.media@gmail.com

Tam lisans metni [LICENSE](./LICENSE) dosyasında mevcuttur

## GitHub Pages

Proje, API dokümantasyonu ve tanıtım sayfası barındırma için GitHub Pages kullanır:

- **Tanıtım Sayfası**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API Dokümantasyonu**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Her iki sayfa da GitHub Actions iş akışları kullanılarak `main` dalındaki ilgili dosyalar değiştiğinde otomatik olarak güncellenir.