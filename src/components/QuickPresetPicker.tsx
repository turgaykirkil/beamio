import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DEMO_PRESETS } from '../services/castService';
import { MediaPreset } from '../types/cast';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSelectPreset: (preset: MediaPreset) => void;
}

export const QuickPresetPicker: React.FC<Props> = ({ onSelectPreset }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="flash-outline" size={16} color="#F59E0B" />
        <Text style={styles.title}>Hızlı Test Yayınları</Text>
      </View>
      <Text style={styles.subtitle}>
        Tek dokunuşla MP4 veya HLS Canlı Akışını TV'de deneyin
      </Text>

      <View style={styles.presetsList}>
        {DEMO_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={styles.presetCard}
            onPress={() => onSelectPreset(preset)}
            activeOpacity={0.7}
          >
            <Image source={{ uri: preset.posterUrl }} style={styles.presetPoster} />
            <View style={styles.presetInfo}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.badge,
                    preset.type === 'live' ? styles.badgeLive : styles.badgeVod,
                  ]}
                >
                  <Text style={styles.badgeText}>{preset.badge}</Text>
                </View>
              </View>
              <Text style={styles.presetTitle} numberOfLines={1}>
                {preset.title}
              </Text>
              <Text style={styles.presetSubtitle} numberOfLines={1}>
                {preset.subtitle}
              </Text>
            </View>
            <View style={styles.playIconWrapper}>
              <Ionicons name="play" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
  },
  presetsList: {
    gap: 10,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetPoster: {
    width: 64,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0F172A',
  },
  presetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  badgeVod: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  presetSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  playIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
