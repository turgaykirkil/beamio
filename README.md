# TV Cast — React Native & Expo Google Cast / Android TV Aktarıcı

iPhone ve Android cihazlarınızdan aynı Wi-Fi ağındaki Google Cast ve Chromecast uyumlu cihazlara (**Mi Box, Android TV, Google TV, Chromecast Ultra**) doğrudan video (**MP4**) ve canlı yayın (**HLS .m3u8**) aktarımı yapan mobil uygulama.

---

## 🚀 Temel Özellikler

1. **Google Cast v3 Entegrasyonu:**
   - Aynı Wi-Fi ağındaki Cast cihazlarını (Mi Box, Android TV, Chromecast) otomatik tarama (`useDevices`, mDNS / Bonjour).
   - Resmi Google Cast Butonu (`CastButton`) ve dahili özel cihaz seçim modalı.
   - Doğrudan alıcıda çalışan **Default Media Receiver (`CC1AD845`)** entegrasyonu.

2. **Geniş Medya Desteği:**
   - **VOD (İsteğe Bağlı):** MP4, WebM formatları.
   - **Canlı Yayınlar (Live Stream):** HLS (`.m3u8`) akışları (Apple HTTP Live Streaming).
   - Otomatik MIME tipi ve `MediaStreamType` (`BUFFERED` veya `LIVE`) tespiti.

3. **Uzaktan Kumanda Arayüzü (Expanded / Remote Controller):**
   - **Telefon Video Yükünden Bağımsızdır:** Video çözme ve oynatma işlemi doğrudan TV/Mi Box üzerinde gerçekleşir; telefon yalnızca kablosuz bir uzaktan kumanda işlevi görür.
   - Oynat / Durdur (Play/Pause) senkronizasyonu.
   - -10 saniye geri sarma ve +30 saniye ileri sarma.
   - Hassas zaman çizelgesi (Scrubber Slider) ve geçen/kalan süre gösterimi.
   - TV alıcısı doğrudan donanımsal ses seviyesi (Volume Slider %0 - %100) ve Sessize Alma (Mute).
   - TV yayını sonlandırma ve yerel bağlantı yönetimi.

4. **Twitter / X Video Link Çözümleyici (Parser Altyapısı):**
   - Paylaşılan `x.com/...` veya `twitter.com/...` tweet bağlantılarını otomatik algılama.
   - Arka planda yüksek hızlı servis üzerinden tweet içeriğindeki gerçek `.mp4` ve `.m3u8` akış adreslerini çözümleme.
   - Çözünürlük seçenekleri (1080p Full HD, 720p HD, 480p SD) arasında seçim yapabilme.

5. **Hızlı Test Yayınları (Quick Presets):**
   - Apple HLS Canlı Test Akışı (`.m3u8`)
   - Big Buck Bunny 1080p MP4
   - Tears of Steel MP4

---

## 📁 Proje Dosya Yapısı

```
tvcast/
├── App.tsx                        # Ana uygulama bileşeni ve durum yönetimi
├── app.json                       # iOS Info.plist izinleri ve Google Cast config eklentisi
├── package.json                   # Bağımlılıklar ve komutlar
├── tsconfig.json                  # TypeScript yapılandırması
└── src/
    ├── types/
    │   └── cast.ts                # Akış tipleri, Twitter varyantları ve medya modelleri
    ├── services/
    │   ├── castService.ts         # MediaLoadRequest, seek, süre formatı ve test presetleri
    │   └── twitterService.ts      # Twitter / X link ayrıştırıcı ve video akış çözücü
    └── components/
        ├── CastHeader.tsx         # Marka başlığı, Cast butonu ve cihaz durum hapı
        ├── DeviceModal.tsx        # Ağdaki Mi Box / TV alıcılarını listeleyen modal
        ├── MediaInputCard.tsx     # URL girişi, pano yapıştırma, X çözümleyici ve Cast aksiyonu
        ├── QuickPresetPicker.tsx  # Tek tıkla HLS canlı yayın ve MP4 test kartları
        └── RemoteController.tsx   # Bağımsız TV kumandası (Play/Pause, Ses, Sarma, Zaman)
```

---

## 🛠️ Kurulum ve Çalıştırma

> **Önemli Not:** `react-native-google-cast`, Google'ın yerel Cast SDK'sını (iOS CocoaPods ve Android Play Services) içerir. Bu nedenle standart Expo Go yerine **Expo Prebuild / Development Build** kullanılır.

### 1. Bağımlılıkları Yükleme
```bash
npm install
```

### 2. Proje Sağlık Kontrolü & Typecheck
```bash
npx tsc --noEmit
npx expo-doctor
```

### 3. iOS Cihazda / iPhone'da Çalıştırma (Development Build)

#### Yerel Mac + Xcode ile:
```bash
# iOS native projesini derleyip bağlı iPhone'a yükler
npx expo run:ios --device
```

#### Veya EAS Build (Bulut Derleme) ile:
```bash
# Geliştirme profili oluşturma
npx eas-cli build --profile development --platform ios
```

---

## 📱 iOS 14+ Yerel Ağ İzinleri (`app.json`)

Chromecast ve Android TV cihazlarının iPhone tarafından keşfedilebilmesi için `app.json` içerisine gerekli konfigürasyonlar eklenmiştir:

- `NSLocalNetworkUsageDescription`: Wi-Fi ağındaki Cast cihazlarını bulabilmek için yerel ağ izni.
- `NSBonjourServices`: `_googlecast._tcp` ve `_CC1AD845._googlecast._tcp` Bonjour servis kayıtları.
- `react-native-google-cast` Expo Config Plugin: AppDelegate üzerinde `GCKCastContext` başlatılmasını otomatik yönetir.
