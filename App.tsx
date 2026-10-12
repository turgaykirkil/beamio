import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  SafeAreaView,
  Alert,
  Text,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import GoogleCast, {
  useCastDevice,
  useCastSession,
  useRemoteMediaClient,
  useDevices,
} from 'react-native-google-cast';
import { CastHeader } from './src/components/CastHeader';
import { MediaInputCard } from './src/components/MediaInputCard';
import { QuickPresetPicker } from './src/components/QuickPresetPicker';
import { RemoteController } from './src/components/RemoteController';
import { DeviceModal } from './src/components/DeviceModal';
import { loadMediaToCast } from './src/services/castService';
import { MediaPreset } from './src/types/cast';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [deviceModalVisible, setDeviceModalVisible] = useState(false);
  const [currentMediaInfo, setCurrentMediaInfo] = useState<{
    title: string;
    subtitle?: string;
    posterUrl?: string;
    isLive: boolean;
  }>({
    title: '',
    subtitle: '',
    posterUrl: undefined,
    isLive: false,
  });

  const castSession = useCastSession();
  const remoteClient = useRemoteMediaClient();
  const connectedDevice = useCastDevice();
  const devices = useDevices();

  // Uygulama açıldığında cihaz keşfini otomatik başlat
  React.useEffect(() => {
    try {
      const discoveryManager = GoogleCast.getDiscoveryManager();
      discoveryManager.startDiscovery();
    } catch (e) {
      console.log('DiscoveryManager hatası:', e);
    }
  }, []);

  // Medyayı Cast etme işleyicisi
  const handleCastMedia = async (params: {
    url: string;
    title: string;
    subtitle?: string;
    posterUrl?: string;
    isLive: boolean;
  }) => {
    // Eğer bağlı bir TV / Chromecast oturumu yoksa kullanıcıyı uyar ve cihaz menüsünü aç
    if (!remoteClient || !castSession) {
      Alert.alert(
        'TV Seçilmedi',
        'Video aktarımını başlatmak için lütfen önce yerel ağınızdaki bir Chromecast veya Android TV cihazına (Mi Box vb.) bağlanın.',
        [
          { text: 'Vazgeç', style: 'cancel' },
          {
            text: 'Cihazları Listele',
            onPress: () => setDeviceModalVisible(true),
          },
          {
            text: 'Cast Menüsü Aç',
            onPress: async () => {
              try {
                await GoogleCast.showCastDialog();
              } catch (e) {
                console.log(e);
              }
            },
          },
        ]
      );
      return;
    }

    try {
      setCurrentMediaInfo({
        title: params.title,
        subtitle: params.subtitle,
        posterUrl: params.posterUrl,
        isLive: params.isLive,
      });

      await loadMediaToCast(remoteClient, {
        contentUrl: params.url,
        title: params.title,
        subtitle: params.subtitle,
        posterUrl: params.posterUrl,
        isLive: params.isLive,
        autoplay: true,
      });
    } catch (err: any) {
      Alert.alert(
        'Aktarım Hatası',
        `Medya TV'ye yüklenirken bir sorun oluştu: ${err?.message || 'Bilinmeyen hata'}`
      );
    }
  };

  // Hazır test yayınını başlatma
  const handleSelectPreset = (preset: MediaPreset) => {
    handleCastMedia({
      url: preset.url,
      title: preset.title,
      subtitle: preset.subtitle,
      posterUrl: preset.posterUrl,
      isLive: preset.type === 'live',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Üst Başlık ve Bağlantı Çubuğu */}
      <CastHeader
        onOpenDeviceModal={() => setDeviceModalVisible(true)}
        discoveredDevicesCount={devices.length}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Uzaktan Kumanda Arayüzü (TV'de medya oynatılıyorsa en üstte görünür) */}
          <RemoteController
            currentMediaTitle={currentMediaInfo.title}
            currentMediaSubtitle={currentMediaInfo.subtitle}
            currentMediaPoster={currentMediaInfo.posterUrl}
            isLiveStream={currentMediaInfo.isLive}
          />

          {/* Wi-Fi & TV Bilgilendirme Kartı */}
          {!connectedDevice && (
            <View style={styles.bannerContainer}>
              <View style={styles.bannerIcon}>
                <Ionicons name="wifi" size={20} color="#38BDF8" />
              </View>
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Aynı Wi-Fi Ağı Gereklidir</Text>
                <Text style={styles.bannerDescription}>
                  iPhone'unuz ile Mi Box / Android TV'nizin aynı kablosuz ağa bağlı olduğundan emin olun.
                </Text>
              </View>
            </View>
          )}

          {/* Video / Canlı Yayın URL Girişi & X Çözümleyici */}
          <MediaInputCard onCastMedia={handleCastMedia} />

          {/* Hızlı Test Presetleri */}
          <QuickPresetPicker onSelectPreset={handleSelectPreset} />

          {/* Bilgi ve İpuçları */}
          <View style={styles.infoFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color="#64748B" />
              <Text style={styles.footerText}>
                Yerel Ağ Protokolü: Google Cast v3 SDK (mDNS / Bonjour)
              </Text>
            </View>
            <View style={styles.footerItem}>
              <Ionicons name="film-outline" size={16} color="#64748B" />
              <Text style={styles.footerText}>
                Formatlar: MP4, WebM, HLS (.m3u8), AAC, MP3
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Cast Cihaz Seçim Modalı */}
      <DeviceModal
        visible={deviceModalVisible}
        onClose={() => setDeviceModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerDescription: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  infoFooter: {
    marginHorizontal: 18,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: '#64748B',
    fontSize: 11,
  },
});
