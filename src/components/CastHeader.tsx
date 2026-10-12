import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CastButton, useCastDevice } from 'react-native-google-cast';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onOpenDeviceModal: () => void;
  discoveredDevicesCount: number;
}

export const CastHeader: React.FC<Props> = ({ onOpenDeviceModal, discoveredDevicesCount }) => {
  const connectedDevice = useCastDevice();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.logoIcon}>
          <Ionicons name="tv-outline" size={24} color="#38BDF8" />
        </View>
        <View style={styles.titleTextContainer}>
          <Text style={styles.title}>Beamio</Text>
          <Text style={styles.subtitle}>Smart Web & Video Caster</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        {/* Cihaz Durum Rozeti */}
        <TouchableOpacity
          style={[styles.devicePill, connectedDevice ? styles.devicePillConnected : null]}
          onPress={onOpenDeviceModal}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.statusDot,
              connectedDevice ? styles.statusDotConnected : styles.statusDotSearching,
            ]}
          />
          <Text style={styles.devicePillText} numberOfLines={1}>
            {connectedDevice ? connectedDevice.friendlyName : `${discoveredDevicesCount} Cihaz Bulundu`}
          </Text>
          <Ionicons name="chevron-down" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Google Cast Resmi Butonu */}
        <View style={styles.castButtonWrapper}>
          <CastButton style={styles.castButton} tintColor="#38BDF8" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#0F172A',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  titleTextContainer: {
    flex: 1,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    maxWidth: 150,
    borderWidth: 1,
    borderColor: '#334155',
  },
  devicePillConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusDotSearching: {
    backgroundColor: '#F59E0B',
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  devicePillText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
  },
  castButtonWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  castButton: {
    width: 24,
    height: 24,
  },
});
