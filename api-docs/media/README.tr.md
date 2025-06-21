# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

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

## Proje Genel Bakış

Timeline Studio, Tauri mimarisi (Rust + React) üzerine inşa edilmiş modern bir video editörüdür.

**Hedefimiz**: Aşağıdakileri birleştiren bir editör oluşturmak:
- **DaVinci Resolve'un profesyonel gücü** - düzenleme, renk derecelendirme, ses miksajı, görsel efektler, hareketli grafikler ve gelişmiş kompozisyon üzerinde tam kontrol
- **Kapsamlı yaratıcı kütüphane** - Filmora gibi popüler editörlere kıyaslanabilir efektler, filtreler, geçişler, çoklu kamera şablonları, animasyonlu başlıklar, stil şablonları ve altyazı ön ayarları
- **AI komut dosyası ve otomasyon** - farklı diller ve farklı platformlar için otomatik içerik üretimi

**Temel yenilik**: Kullanıcıların videoları, müzikleri ve diğer kaynakları yüklemesi yeterlidir ve AI, farklı dillerde ve farklı platformlar (YouTube, TikTok, Vimeo, Telegram) için optimize edilmiş bir dizi video otomatik olarak oluşturacaktır.

![Timeline Interface](/public/screen3.png)

### Proje Durumu (Haziran 2025)

**Genel Tamamlanma: %53.8** ⬆️ (gerçek modül durumu ve 14 yeni planlı modülle yeniden hesaplandı)
- **Tamamlandı**: 11 modül (%100 hazır)
- **Geliştirme aşamasında**: 8 modül (%45-85 hazır)
- **Planlı**: 5 modül (%30-85 hazır)
- **Yeni planlı**: 14 modül (%0 hazır) - [ayrıntılar planned/ içinde](docs-ru/08-roadmap/planned/)

### Temel Başarılar:
- ✅ **Video Derleyici** - GPU hızlandırma ile tam olarak uygulandı (%100)
- ✅ **Zaman Çizelgesi** - ana editör tam işlevsel (%100)
- ✅ **Medya Yönetimi** - dosya yönetimi hazır (%100)
- ✅ **Temel Mimari** - app-state, browser, modals, user/project settings (%100)
- ✅ **Tanıma** - YOLO v11 nesne ve yüz tanıma (%100)
- 🔄 **Efektler/Filtreler/Geçişler** - Filmora tarzında zengin efekt kütüphanesi (%75-80)
- 🔄 **Dışa Aktarma** - neredeyse tamamlandı, parametre ayrıntıları kaldı (%85)
- 🔄 **Kaynak Paneli** - ana UI hazır, sürükle & bırak eksik (%80)
- ❗ **AI Sohbet** - gerçek API entegrasyonu gerekli (%30)
- 📋 **14 yeni planlı modül** - [planned/ bak](docs-ru/08-roadmap/planned/) DaVinci + Filmora seviyesine ulaşmak için
- 🎯 **Hedef** - DaVinci gücü ve Filmora kütüphanesini AI otomasyonuyla birleştir

## Ana Özellikler

- 🎬 Çoklu parça zaman çizelgesiyle profesyonel video düzenleme
- 🖥️ Çapraz platform (Windows, macOS, Linux)
- 🚀 GPU hızlandırmalı video işleme (NVENC, QuickSync, VideoToolbox)
- 🤖 AI destekli nesne/yüz tanıma (YOLO v11)
- 🎨 30'dan fazla geçiş, görsel efekt ve filtre
- 📝 12 stil ve animasyonlu gelişmiş altyazı sistemi
- 🎵 Efektli çoklu parça ses düzenleme
- 🧠 XState v5 kullanarak durum yönetimi
- 🌐 Uluslararasılaştırma desteği (11 dil)
- 💾 Akıllı önbelleğe alma ve önizleme oluşturma
- 🎨 Tailwind CSS v4, shadcn-ui kullanarak modern UI
- 📚 2400+ test (%98.8 başarı oranı) ile tam dokümantasyon

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
- **Dil Sürümleri**: Yukarıdaki değiştirici aracılığıyla 11 dilde mevcut

## Geliştirme

### Hızlı Başlangıç

```bash
# Geliştirme modu
bun run tauri dev

# Testleri çalıştır
bun run test && bun run test:rust

# Kod kalitesini kontrol et
bun run check:all
```

### Temel Komutlar

| Komut | Açıklama |
|-------|----------|
| `bun run tauri dev` | Tam uygulamayı geliştirme modunda başlat |
| `bun run dev` | Sadece frontend başlat |
| `bun run build` | Üretim için derle |
| `bun run test` | Frontend testleri çalıştır |
| `bun run test:rust` | Backend testleri çalıştır |
| `bun run lint` | Kod kalitesini kontrol et |
| `bun run fix:all` | Kod sorunlarını otomatik düzelt |

📚 **[Tam Geliştirme Kılavuzu →](docs-ru/05-development/README.md)**

### Test Kapsamı Durumu

✅ **Frontend Testleri**: 3,604 geçti  
✅ **Backend Testleri**: 554 geçti (+18 yeni!)  
📊 **Toplam**: 4,158 test geçti

### Test Etme

Proje, birim testler için Vitest kullanır. Testler, özelliğin __tests__ dizininde bulunur ve mock'lar __mocks__ içindedir.

## CI/CD ve Kod Kalitesi

### Otomatik Süreçler
- ✅ **Linting**: ESLint, Stylelint, Clippy
- ✅ **Testler**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Kapsam**: Codecov entegrasyonu
- ✅ **Derleme**: Çoklu platform derlemeleri

📚 **[Ayrıntılı CI/CD Kılavuzu →](docs-ru/06-deployment/README.md)**  
🔧 **[Linting ve Biçimlendirme →](docs-ru/05-development/linting-and-formatting.md)**

## Dokümantasyon ve Kaynaklar

- 📚 [**API Dokümantasyonu**](https://chatman-media.github.io/timeline-studio/api-docs/) - Otomatik oluşturulmuş TypeScript dokümantasyonu
- 🚀 [**Tanıtım Sayfası**](https://chatman-media.github.io/timeline-studio/) - Proje vitrin
- 📖 [**Tam Dokümantasyon**](docs-ru/README.md) - Rusça tam kılavuz
- 🎬 [**Canlı Demo**](https://chatman-media.github.io/timeline-studio/) - Editörü çevrimiçi deneyin

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