import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import GoogleCast, { useCastDevice, useDevices } from 'react-native-google-cast';
import type { Device } from 'react-native-google-cast';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const DeviceModal: React.FC<Props> = ({ visible, onClose }) => {
  const devices = useDevices();
  const currentDevice = useCastDevice();

  const handleSelectDevice = async (device: Device) => {
    try {
      const sessionManager = GoogleCast.getSessionManager();
      await sessionManager.startSession(device.deviceId);
      onClose();
    } catch (err: any) {
      console.error('Cihaza bağlanırken hata oluştu:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      const sessionManager = GoogleCast.getSessionManager();
      await sessionManager.endCurrentSession(true);
      onClose();
    } catch (err: any) {
      console.error('Bağlantı kesilirken hata:', err);
    }
  };

  const handleRescan = async () => {
    try {
      const dm = GoogleCast.getDiscoveryManager();
      await dm.stopDiscovery();
      await dm.startDiscovery();
    } catch (err: any) {
      console.error('Yeniden tarama hatası:', err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Modal Başlığı */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <Ionicons name="hardware-chip-outline" size={22} color="#38BDF8" />
              <Text style={styles.modalTitle}>Cast Cihazları</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleRescan} style={styles.rescanBtn} activeOpacity={0.7}>
                <Ionicons name="refresh" size={18} color="#38BDF8" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Aktif Bağlantı Durumu */}
          {currentDevice && (
            <View style={styles.connectedCard}>
              <View style={styles.connectedInfo}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.connectedDeviceName}>{currentDevice.friendlyName}</Text>
                  <Text style={styles.connectedDeviceModel}>{currentDevice.modelName || 'Android TV / Cast Alıcı'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectBtn}>
                <Text style={styles.disconnectBtnText}>Bağlantıyı Kes</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bulunan Cihazlar Listesi */}
          <Text style={styles.sectionSubtitle}>
            Aynı Wi-Fi Ağındaki Alıcılar ({devices.length})
          </Text>

          {devices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color="#38BDF8" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Cihaz Aranıyor...</Text>
              <Text style={styles.emptyDescription}>
                iPhone'unuzun ve TV'nizin (Mi Box, Android TV, Chromecast) aynı Wi-Fi ağına bağlı olduğundan emin olun.
              </Text>
              <TouchableOpacity
                style={styles.nativePickerBtn}
                onPress={async () => {
                  try {
                    await GoogleCast.showCastDialog();
                    onClose();
                  } catch (e) {
                    console.log(e);
                  }
                }}
              >
                <Text style={styles.nativePickerBtnText}>iOS Cast Menüsünü Aç</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(item) => item.deviceId}
              renderItem={({ item }) => {
                const isCurrent = currentDevice?.deviceId === item.deviceId;
                return (
                  <TouchableOpacity
                    style={[styles.deviceItem, isCurrent && styles.deviceItemActive]}
                    onPress={() => handleSelectDevice(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.deviceIconWrapper}>
                      <Ionicons
                        name={item.modelName?.toLowerCase().includes('tv') ? 'tv' : 'radio'}
                        size={22}
                        color={isCurrent ? '#10B981' : '#38BDF8'}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.itemDeviceName}>{item.friendlyName}</Text>
                      <Text style={styles.itemDeviceIp}>
                        {item.modelName || 'Chromecast'} • {item.ipAddress || 'Yerel Ağ'}
                      </Text>
                    </View>
                    {isCurrent ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Bağlı</Text>
                      </View>
                    ) : (
                      <Ionicons name="arrow-forward-circle-outline" size={22} color="#64748B" />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rescanBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#1E293B',
  },
  connectedCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  connectedDeviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  connectedDeviceModel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  disconnectBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  disconnectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  nativePickerBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  nativePickerBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  deviceItemActive: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  deviceIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDeviceName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  itemDeviceIp: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
