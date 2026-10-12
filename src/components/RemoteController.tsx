import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import GoogleCast, {
  useRemoteMediaClient,
  useMediaStatus,
  useStreamPosition,
  useCastDevice,
  MediaPlayerState,
  MediaStreamType,
} from 'react-native-google-cast';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { formatTime, seekRelative } from '../services/castService';

const { width } = Dimensions.get('window');

interface Props {
  currentMediaTitle?: string;
  currentMediaSubtitle?: string;
  currentMediaPoster?: string;
  isLiveStream?: boolean;
}

export const RemoteController: React.FC<Props> = ({
  currentMediaTitle,
  currentMediaSubtitle,
  currentMediaPoster,
  isLiveStream,
}) => {
  const client = useRemoteMediaClient();
  const mediaStatus = useMediaStatus();
  const streamPosition = useStreamPosition();
  const currentDevice = useCastDevice();

  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSeeking, setIsSeeking] = useState<boolean>(false);
  const [seekValue, setSeekValue] = useState<number>(0);

  // TV'deki oynatma durumu
  const isPlaying = mediaStatus?.playerState === MediaPlayerState.PLAYING;
  const isBuffering = mediaStatus?.playerState === MediaPlayerState.BUFFERING;
  const isLive =
    isLiveStream ||
    mediaStatus?.mediaInfo?.streamType === MediaStreamType.LIVE;

  const duration = mediaStatus?.mediaInfo?.streamDuration || 0;
  const currentPos = isSeeking ? seekValue : (streamPosition || 0);

  // Başlık ve afiş bilgileri
  const metadata = mediaStatus?.mediaInfo?.metadata as any;
  const title =
    metadata?.title || currentMediaTitle || 'TV Akışı Oynatılıyor';
  const subtitle =
    metadata?.subtitle ||
    currentMediaSubtitle ||
    `${currentDevice?.friendlyName || 'Chromecast'} üzerinde`;
  const poster =
    metadata?.images?.[0]?.url || currentMediaPoster;

  // Ses durumunu güncelle
  useEffect(() => {
    if (mediaStatus?.volume !== undefined) {
      setVolume(mediaStatus.volume);
    }
    if (mediaStatus?.isMuted !== undefined) {
      setIsMuted(mediaStatus.isMuted);
    }
  }, [mediaStatus?.volume, mediaStatus?.isMuted]);

  // Oynat / Durdur aksiyonu
  const togglePlayPause = async () => {
    if (!client) return;
    try {
      if (isPlaying) {
        await client.pause();
      } else {
        await client.play();
      }
    } catch (err) {
      console.error('Oynatma kontrol hatası:', err);
    }
  };

  // Sarma aksiyonları
  const handleSeekDelta = async (deltaSeconds: number) => {
    if (!client || isLive) return;
    try {
      await seekRelative(client, streamPosition || 0, deltaSeconds, duration);
    } catch (err) {
      console.error('Sarma hatası:', err);
    }
  };

  // Slider ile sarma
  const handleSliderComplete = async (value: number) => {
    if (!client || isLive) return;
    setIsSeeking(false);
    try {
      await client.seek({ position: value });
    } catch (err) {
      console.error('Sarma hatası:', err);
    }
  };

  // Ses seviyesini ayarlama
  const handleVolumeChange = async (val: number) => {
    setVolume(val);
    if (!client) return;
    try {
      await client.setStreamVolume(val);
    } catch (err) {
      console.error('Ses seviyesi değiştirilemedi:', err);
    }
  };

  // Sessize alma (Mute)
  const toggleMute = async () => {
    if (!client) return;
    try {
      const nextMuted = !isMuted;
      setIsMuted(nextMuted);
      await client.setStreamMuted(nextMuted);
    } catch (err) {
      console.error('Sessize alma hatası:', err);
    }
  };

  // Medyayı tamamen durdurma
  const handleStop = async () => {
    if (!client) return;
    try {
      await client.stop();
    } catch (err) {
      console.error('Medyayı durdurma hatası:', err);
    }
  };

  // Eğer TV'de hiçbir oturum veya medya yoksa kumanda gizlenir
  if (!client || !mediaStatus || mediaStatus.playerState === MediaPlayerState.IDLE) {
    return null;
  }

  return (
    <View style={styles.card}>
      {/* Üst Durum Çubuğu */}
      <View style={styles.statusBar}>
        <View style={styles.targetDeviceRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.targetDeviceText}>
            {currentDevice?.friendlyName || 'Android TV'}
          </Text>
        </View>

        <View style={styles.modeBadge}>
          <Ionicons name="phone-portrait-outline" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
          <Text style={styles.modeBadgeText}>Bağımsız Kumanda</Text>
        </View>

        <TouchableOpacity
          onPress={() => GoogleCast.showExpandedControls()}
          style={styles.expandBtn}
        >
          <Ionicons name="expand" size={15} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* Medya Bilgisi ve Afiş */}
      <View style={styles.mediaInfoRow}>
        {poster ? (
          <Image source={{ uri: poster }} style={styles.mediaPoster} />
        ) : (
          <View style={styles.mediaPosterPlaceholder}>
            <Ionicons name="tv" size={28} color="#38BDF8" />
          </View>
        )}
        <View style={styles.mediaTitles}>
          <Text style={styles.mediaTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.mediaSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
          {isLive && (
            <View style={styles.liveIndicator}>
              <View style={styles.liveRedDot} />
              <Text style={styles.liveText}>CANLI YAYIN</Text>
            </View>
          )}
        </View>
      </View>

      {/* Süre / İlerleme Çubuğu (Canlı Değilse) */}
      {!isLive && duration > 0 ? (
        <View style={styles.progressContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={currentPos}
            onValueChange={(val) => {
              setIsSeeking(true);
              setSeekValue(val);
            }}
            onSlidingComplete={handleSliderComplete}
            minimumTrackTintColor="#38BDF8"
            maximumTrackTintColor="#334155"
            thumbTintColor="#38BDF8"
          />
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(currentPos)}</Text>
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        </View>
      ) : isLive ? (
        <View style={styles.liveStatusRow}>
          <Ionicons name="radio" size={16} color="#10B981" />
          <Text style={styles.liveStatusMessage}>
            TV üzerinden canlı HLS akışı devam ediyor
          </Text>
        </View>
      ) : null}

      {/* Temel Oynatma Düğmeleri (-10s / Play-Pause / +30s) */}
      <View style={styles.playbackControls}>
        <TouchableOpacity
          style={[styles.skipBtn, isLive && styles.btnDisabled]}
          onPress={() => handleSeekDelta(-10)}
          disabled={isLive}
          activeOpacity={0.7}
        >
          <Ionicons name="play-back" size={22} color={isLive ? '#475569' : '#E2E8F0'} />
          <Text style={[styles.skipLabel, isLive && styles.textDisabled]}>-10s</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mainPlayBtn}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          {isBuffering ? (
            <Ionicons name="hourglass-outline" size={32} color="#FFFFFF" />
          ) : isPlaying ? (
            <Ionicons name="pause" size={32} color="#FFFFFF" />
          ) : (
            <Ionicons name="play" size={32} color="#FFFFFF" style={{ marginLeft: 3 }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.skipBtn, isLive && styles.btnDisabled]}
          onPress={() => handleSeekDelta(30)}
          disabled={isLive}
          activeOpacity={0.7}
        >
          <Ionicons name="play-forward" size={22} color={isLive ? '#475569' : '#E2E8F0'} />
          <Text style={[styles.skipLabel, isLive && styles.textDisabled]}>+30s</Text>
        </TouchableOpacity>
      </View>

      {/* TV Ses Düzeyi Kontrolü */}
      <View style={styles.volumeRow}>
        <TouchableOpacity onPress={toggleMute} style={styles.muteBtn}>
          <Ionicons
            name={isMuted || volume === 0 ? 'volume-mute' : 'volume-medium'}
            size={20}
            color={isMuted ? '#EF4444' : '#94A3B8'}
          />
        </TouchableOpacity>

        <Slider
          style={styles.volumeSlider}
          minimumValue={0}
          maximumValue={1}
          value={isMuted ? 0 : volume}
          onValueChange={handleVolumeChange}
          minimumTrackTintColor="#38BDF8"
          maximumTrackTintColor="#334155"
          thumbTintColor="#38BDF8"
        />

        <Text style={styles.volumePercentage}>
          {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
        </Text>
      </View>

      {/* Durdur ve Yayını Sonlandır Butonu */}
      <TouchableOpacity style={styles.stopBtn} onPress={handleStop} activeOpacity={0.7}>
        <Ionicons name="stop-circle-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
        <Text style={styles.stopBtnText}>TV Yayını Kapat</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    marginBottom: 14,
  },
  targetDeviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  targetDeviceText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  modeBadgeText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  expandBtn: {
    padding: 4,
  },
  mediaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  mediaPoster: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  mediaPosterPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  mediaTitles: {
    flex: 1,
    marginLeft: 14,
  },
  mediaTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  mediaSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 3,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  liveRedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 5,
  },
  liveText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 12,
  },
  slider: {
    width: '100%',
    height: 30,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -4,
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  liveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 6,
  },
  liveStatusMessage: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    marginVertical: 12,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  skipLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  textDisabled: {
    color: '#475569',
  },
  mainPlayBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
  },
  muteBtn: {
    padding: 6,
  },
  volumeSlider: {
    flex: 1,
    height: 30,
    marginHorizontal: 8,
  },
  volumePercentage: {
    color: '#94A3B8',
    fontSize: 12,
    width: 42,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  stopBtn: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  stopBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
});
