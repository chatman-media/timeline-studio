# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=for-the-badge&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=for-the-badge&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![codecov](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=for-the-badge&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=for-the-badge&label=npm%20downloads)](https://www.npmjs.com/package/timeline-studio)
[![Open Collective](https://img.shields.io/opencollective/all/timeline-studio?style=for-the-badge&label=sponsors)](https://opencollective.com/timeline-studio)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/visit-website-brightgreen?style=for-the-badge&logo=globe&logoColor=white)](https://chatman-media.github.io/timeline-studio/)
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

</div>

## 🎬 Proje Genel Bakış

**Timeline Studio** - AI destekli video editörü, videolarınızı, müziklerinizi ve favori efektlerinizi tüm platformlarda yayınlanmaya hazır düzinelerce klibe dönüştürür!

### 🚀 Olanakları Hayal Edin

**Videolarınızı, fotoğraflarınızı, müziklerinizi bir kez yükleyin** → şunları elde edin:
- 📱 **TikTok** - trend efektlerle dikey kısa videolar
- 📺 **YouTube** - tam filmler, kısa klipler, Shorts
- 📸 **Instagram** - farklı uzunluklarda Reels, Stories, gönderiler
- ✈️ **Telegram** - kanallar ve sohbetler için optimize edilmiş sürümler

AI asistanı her platform için doğru sayıda sürüm oluşturacak! 🤖

### 💡 Nasıl Çalışır

> *"Asya seyahatim hakkında tüm sosyal medya için bir video oluştur" - ve dakikalar içinde hazır seçenekleriniz var: TikTok için dinamik kısa videolar, YouTube için atmosferik vlog, Instagram için canlı Stories. AI en iyi anları seçecek, müzikle senkronize edecek ve her platforma uyarlayacak.*

### ⚡ Bu Neden Her Şeyi Değiştiriyor

- **10x zaman tasarrufu** - her video için artık manuel uyarlama yok
- **AI trendleri anlıyor** - her sosyal ağda neyin işe yaradığını biliyor
- **Profesyonel kalite** - büyük stüdyolarla aynı araçları kullanıyor
- **Her şey yerel olarak çalışıyor** - içeriğiniz gizli kalıyor

![Timeline Interface](/public/screen3.png)

### Proje Durumu (Haziran 2025)

**Genel Tamamlanma: %58** ⬆️ (API Anahtar Yönetimi %100 tamamlanma ve 14 yeni planlı modülle yeniden hesaplandı)
- **Tamamlandı**: 13 modül (%100 hazır)
- **Geliştirme aşamasında**: 7 modül (%45-90 hazır)
- **Planlı**: 4 modül (%30-80 hazır)
- **Yeni planlı**: 14 modül (%0 hazır) - [ayrıntılar planned/ içinde](docs-ru/08-roadmap/planned/)

### Temel Başarılar:
- ✅ **Temel Mimari** - Zaman Çizelgesi, Video Derleyici, Medya Yönetimi (%100)
- ✅ **API Anahtar Yönetimi** - AES-256-GCM şifreleme ile güvenli depolama (%100)
- ✅ **Tanıma** - YOLO v11 nesne ve yüz tanıma (%100)
- ✅ **Dışa Aktarma** - YouTube/TikTok/Vimeo OAuth entegrasyonu (%100)
- 🚧 **Efektler/Filtreler/Geçişler** - zengin kütüphane geliştiriliyor (%75-80)
- 🚧 **Zaman Çizelgesi AI** - 41 Claude aracıyla otomasyon (%90)

### Mevcut Görevler:
- 🔄 **OAuth geri arama işleme** - sosyal ağ entegrasyonunu tamamlama
- ⏳ **HTTP API doğrulama** - gerçek zamanlı bağlantı testi
- ⏳ **.env'den içe aktarma** - mevcut anahtarların taşınması

### Sonraki Adımlar:
1. **Sosyal Ağlar Entegrasyonu** - tam OAuth akışı uygulaması
2. **Gelişmiş Efektler** - Filmora tarzı kütüphanenin tamamlanması
3. **Zaman Çizelgesi AI** - akıllı video oluşturma otomasyonu

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

### Hızlı Kurulum

```bash
# Klonla ve kur
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
bun install

# Geliştirme modunu çalıştır
bun run tauri dev
```

### Gereksinimler
- Node.js v18+, Rust, Bun, FFmpeg

📚 **[Tam Kurulum Kılavuzu →](docs-ru/01-getting-started/README.md)**  
🪟 **[Windows Kurulumu →](docs-ru/06-deployment/platforms/windows-build.md)**

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