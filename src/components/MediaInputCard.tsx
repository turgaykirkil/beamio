import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { isTwitterUrl, isTwitterBroadcastUrl, parseTwitterVideo } from '../services/twitterService';
import { isHlsUrl, isMp4Url } from '../services/castService';
import { TwitterVideoResult, VideoVariant } from '../types/cast';

interface Props {
  onCastMedia: (params: {
    url: string;
    title: string;
    subtitle?: string;
    posterUrl?: string;
    isLive: boolean;
  }) => void;
  disabled?: boolean;
}

export const MediaInputCard: React.FC<Props> = ({ onCastMedia, disabled }) => {
  const [url, setUrl] = useState('');
  const [isParsingTwitter, setIsParsingTwitter] = useState(false);
  const [twitterResult, setTwitterResult] = useState<TwitterVideoResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VideoVariant | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState('');

  const isTwitterBroadcast = isTwitterBroadcastUrl(url);
  const isTwitter = isTwitterUrl(url);
  const isHls = isHlsUrl(url);
  const isMp4 = isMp4Url(url);

  // Panodan yapıştırma
  const handlePaste = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUrl(text.trim());
        setTwitterResult(null);
        setErrorMsg(null);
      }
    } catch (e) {
      console.log('Panoya erişilemedi:', e);
    }
  };

  // Twitter/X videosunu veya Canlı Yayınını çözümleme
  const handleParseTwitter = async () => {
    if (!url) return;
    setIsParsingTwitter(true);
    setErrorMsg(null);
    try {
      const result = await parseTwitterVideo(url);
      setTwitterResult(result);
      if (result.variants.length > 0) {
        setSelectedVariant(result.variants[0]);
      }
      if (!customTitle && (result.text || result.authorName)) {
        setCustomTitle(result.text || `${result.authorName} Canlı Yayını`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'X videosu / canlı yayını çözümlenemedi.');
      setTwitterResult(null);
    } finally {
      setIsParsingTwitter(false);
    }
  };

  // Doğrudan veya çözümlenmiş videoyu Cast etme
  const handleStartCast = async () => {
    setErrorMsg(null);

    // 1. Eğer halihazırda çözümlenmiş bir Twitter sonucu varsa
    if (twitterResult && selectedVariant) {
      const isLiveVariant =
        twitterResult.isLive ||
        selectedVariant.contentType.includes('mpegurl') ||
        isHlsUrl(selectedVariant.url);

      onCastMedia({
        url: selectedVariant.url,
        title: customTitle || twitterResult.text || `${twitterResult.authorName} X Yayını`,
        subtitle: `${twitterResult.authorName} (${twitterResult.authorHandle})`,
        posterUrl: twitterResult.posterUrl,
        isLive: isLiveVariant,
      });
      return;
    }

    if (!url.trim()) {
      setErrorMsg('Lütfen geçerli bir video veya canlı yayın URL adresi girin.');
      return;
    }

    // 2. Eğer Twitter / X linki girilmiş ama henüz çözümlenmemişse, otomatik çözüp gönder
    if (isTwitter) {
      setIsParsingTwitter(true);
      try {
        const result = await parseTwitterVideo(url.trim());
        setTwitterResult(result);
        const variant = result.selectedVariant || result.variants[0];
        setSelectedVariant(variant);

        if (!variant) {
          throw new Error('Oynatılabilir video akışı bulunamadı.');
        }

        const isLiveVariant =
          result.isLive ||
          variant.contentType.includes('mpegurl') ||
          isHlsUrl(variant.url);

        onCastMedia({
          url: variant.url,
          title: customTitle || result.text || `${result.authorName} X Yayını`,
          subtitle: `${result.authorName} (${result.authorHandle})`,
          posterUrl: result.posterUrl,
          isLive: isLiveVariant,
        });
        return;
      } catch (err: any) {
        setErrorMsg(err.message || 'X canlı yayını / videosu çözümlenemedi.');
        return;
      } finally {
        setIsParsingTwitter(false);
      }
    }

    // 3. Standart doğrudan MP4 veya HLS linki
    onCastMedia({
      url: url.trim(),
      title: customTitle || (isHls ? 'Canlı TV Yayını' : 'Doğrudan Video'),
      subtitle: isHls ? 'HLS Canlı Akış (.m3u8)' : 'MP4 Medya',
      isLive: isHls,
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Medya veya Yayın URL'si</Text>

        {/* Canlı Format Rozeti */}
        {isTwitterBroadcast ? (
          <View style={[styles.typeBadge, styles.badgeTwitterBroadcast]}>
            <View style={styles.liveRedPulse} />
            <Text style={styles.badgeTwitterBroadcastText}>X CANLI YAYIN</Text>
          </View>
        ) : isTwitter ? (
          <View style={[styles.typeBadge, styles.badgeTwitter]}>
            <Ionicons name="logo-twitter" size={12} color="#38BDF8" style={{ marginRight: 4 }} />
            <Text style={styles.badgeTwitterText}>Twitter / X</Text>
          </View>
        ) : isHls ? (
          <View style={[styles.typeBadge, styles.badgeHls]}>
            <View style={styles.livePulse} />
            <Text style={styles.badgeHlsText}>HLS CANLI (.m3u8)</Text>
          </View>
        ) : isMp4 ? (
          <View style={[styles.typeBadge, styles.badgeMp4]}>
            <Text style={styles.badgeMp4Text}>MP4 Video</Text>
          </View>
        ) : null}
      </View>

      {/* URL Giriş Alanı */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={(text) => {
            setUrl(text);
            setErrorMsg(null);
            if (twitterResult) setTwitterResult(null);
          }}
          placeholder="https://x.com/i/broadcasts/... veya .m3u8 / .mp4"
          placeholderTextColor="#64748B"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        {url.length > 0 ? (
          <TouchableOpacity onPress={() => setUrl('')} style={styles.inlineBtn}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handlePaste} style={styles.pasteBtn}>
            <Ionicons name="clipboard-outline" size={15} color="#38BDF8" />
            <Text style={styles.pasteBtnText}>Yapıştır</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Twitter / Canlı Yayın Tespit Edildiğinde Çözümleme Aksiyonu */}
      {isTwitter && !twitterResult && (
        <TouchableOpacity
          style={[styles.parseTwitterBtn, isTwitterBroadcast && styles.parseBroadcastBtn]}
          onPress={handleParseTwitter}
          disabled={isParsingTwitter}
          activeOpacity={0.8}
        >
          {isParsingTwitter ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name={isTwitterBroadcast ? 'radio' : 'sparkles'}
                size={16}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.parseTwitterBtnText}>
                {isTwitterBroadcast
                  ? 'X Canlı Yayınını Çözümle (.m3u8)'
                  : 'X / Twitter Ham Videoyu Çözümle'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Twitter / Canlı Yayın Çözümlenmiş Sonuç Kartı */}
      {twitterResult && (
        <View style={styles.twitterPreview}>
          <View style={styles.twitterAuthorRow}>
            {twitterResult.posterUrl ? (
              <Image source={{ uri: twitterResult.posterUrl }} style={styles.thumbnail} />
            ) : (
              <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                <Ionicons
                  name={twitterResult.isLive ? 'radio' : 'videocam'}
                  size={24}
                  color={twitterResult.isLive ? '#EF4444' : '#38BDF8'}
                />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={styles.authorBadgeLine}>
                <Text style={styles.twitterAuthorName}>{twitterResult.authorName}</Text>
                {twitterResult.isLive && (
                  <View style={styles.liveTag}>
                    <Text style={styles.liveTagText}>CANLI</Text>
                  </View>
                )}
              </View>
              <Text style={styles.twitterAuthorHandle}>{twitterResult.authorHandle}</Text>
              {twitterResult.text ? (
                <Text style={styles.twitterSnippet} numberOfLines={2}>
                  {twitterResult.text}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Kalite ve Akış Seçenekleri */}
          <Text style={styles.variantsLabel}>
            {twitterResult.isLive ? 'Canlı Akış Kaynağı:' : 'Mevcut Çözünürlükler:'}
          </Text>
          <View style={styles.variantsRow}>
            {twitterResult.variants.map((v, idx) => {
              const isSelected = selectedVariant?.url === v.url;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.variantChip,
                    isSelected && styles.variantChipSelected,
                    twitterResult.isLive && styles.variantChipLive,
                  ]}
                  onPress={() => setSelectedVariant(v)}
                >
                  <Ionicons
                    name={twitterResult.isLive ? 'radio-outline' : 'videocam-outline'}
                    size={13}
                    color={isSelected ? '#38BDF8' : '#94A3B8'}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.variantChipText, isSelected && styles.variantChipTextSelected]}>
                    {v.resolution || 'Akış'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Hata Mesajı */}
      {errorMsg && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color="#EF4444" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {/* Cast Başlat Butonu */}
      <TouchableOpacity
        style={[
          styles.castSubmitBtn,
          (disabled || isParsingTwitter) && styles.castSubmitBtnDisabled,
        ]}
        onPress={handleStartCast}
        disabled={disabled || isParsingTwitter}
        activeOpacity={0.8}
      >
        {isParsingTwitter ? (
          <>
            <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.castSubmitBtnText}>Yayın Çözümleniyor...</Text>
          </>
        ) : (
          <>
            <Ionicons name="tv-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.castSubmitBtnText}>TV'ye Aktar (Cast)</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTwitterBroadcast: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  badgeTwitterBroadcastText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveRedPulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginRight: 5,
  },
  badgeTwitter: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  badgeTwitterText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeHls: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeHlsText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 5,
  },
  badgeMp4: {
    backgroundColor: 'rgba(129, 140, 248, 0.15)',
  },
  badgeMp4Text: {
    color: '#818CF8',
    fontSize: 11,
    fontWeight: '700',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    paddingVertical: 8,
  },
  inlineBtn: {
    padding: 4,
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  pasteBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  parseTwitterBtn: {
    marginTop: 10,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parseBroadcastBtn: {
    backgroundColor: '#DC2626',
  },
  parseTwitterBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  twitterPreview: {
    marginTop: 12,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  twitterAuthorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorBadgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  twitterAuthorName: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  liveTag: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  liveTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  twitterAuthorHandle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  twitterSnippet: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 4,
  },
  variantsLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 10,
    marginBottom: 6,
    fontWeight: '600',
  },
  variantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  variantChipLive: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  variantChipSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: '#38BDF8',
  },
  variantChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  variantChipTextSelected: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 6,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    flex: 1,
  },
  castSubmitBtn: {
    backgroundColor: '#0284C7',
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  castSubmitBtnDisabled: {
    opacity: 0.6,
  },
  castSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
