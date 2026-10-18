import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { DeliveryBoy, Order } from '../../utils/storage';

interface AssignDeliveryModalProps {
  visible: boolean;
  order: Order | null;
  deliveryBoys: DeliveryBoy[];
  onClose: () => void;
  onAssign: (orderId: string, deliveryBoyId: string) => Promise<void>;
}

export default function AssignDeliveryModal({
  visible,
  order,
  deliveryBoys,
  onClose,
  onAssign,
}: AssignDeliveryModalProps) {
  if (!order) return null;

  // Ensure Newtown delivery boy displays as "Sudu"
  const sanitizedDeliveryBoys = deliveryBoys.map((b) => {
    if (b.id === 'del-nwt-1' || b.name === 'Subhash Roy') {
      return { ...b, name: 'Sudu' };
    }
    return b;
  });

  const handleSelectBoy = async (boy: DeliveryBoy) => {
    try {
      await onAssign(order.id, boy.id);
      Alert.alert(
        'Lead Dispatched! 🛵',
        `Pickup lead for order ${order.orderNumber} successfully assigned to ${boy.name} (${boy.vehicleNumber}).`
      );
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to assign delivery boy');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Ionicons name="bicycle" size={20} color={Colors.primary} />
                <Text style={styles.title}>Assign Delivery Partner</Text>
              </View>
              <Text style={styles.subtitle}>
                Order #{order.orderNumber} • {order.customerName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#0F2C59" />
            </TouchableOpacity>
          </View>

          {/* Customer Pickup Target Summary */}
          <View style={styles.targetBox}>
            <View style={styles.targetRow}>
              <Ionicons name="location" size={16} color={Colors.primary} />
              <Text style={styles.targetAddress} numberOfLines={2}>
                {order.customerAddress} (PIN: {order.pincode})
              </Text>
            </View>
            <View style={styles.targetMeta}>
              <Text style={styles.targetMetaText}>
                Slot: <Text style={{ color: '#0F2C59', fontWeight: '800' }}>{order.pickupDate || 'Today, ASAP'}</Text>
              </Text>
              <Text style={styles.targetMetaText}>
                Hub: <Text style={{ color: Colors.primary, fontWeight: '800' }}>{order.storeName.replace('TumblePro - ', '')}</Text>
              </Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>
            Available Fleet ({sanitizedDeliveryBoys.length} at this Hub)
          </Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {sanitizedDeliveryBoys.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="bicycle-outline" size={36} color={Colors.textMuted} />
                <Text style={styles.emptyText}>No delivery boys registered for this hub yet.</Text>
              </View>
            ) : (
              sanitizedDeliveryBoys.map((boy) => {
                const isCurrent = order.assignedDeliveryBoyId === boy.id;
                const isAvailable = boy.status === 'available';

                return (
                  <TouchableOpacity
                    key={boy.id}
                    style={[styles.boyCard, isCurrent && styles.boyCardSelected]}
                    onPress={() => handleSelectBoy(boy)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.avatar, { backgroundColor: boy.avatarColor || Colors.primary }]}>
                      <Text style={styles.avatarText}>{boy.name[0]}</Text>
                    </View>

                    <View style={styles.boyInfo}>
                      <View style={styles.boyNameRow}>
                        <Text style={styles.boyName}>{boy.name}</Text>
                        {isCurrent && (
                          <View style={styles.assignedBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#15803D" />
                            <Text style={styles.assignedBadgeText}>Assigned</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.vehicleText}>{boy.vehicleNumber}</Text>
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Ionicons name="star" size={13} color="#D97706" />
                          <Text style={styles.statVal}>{boy.rating}</Text>
                        </View>
                        <Text style={styles.statDot}>•</Text>
                        <Text style={styles.statVal}>{boy.activeOrdersCount || 0} active</Text>
                        <Text style={styles.statDot}>•</Text>
                        <View style={[styles.statusPill, isAvailable ? styles.statusAvail : styles.statusBusy]}>
                          <Text style={[styles.statusPillText, isAvailable ? styles.statusAvailText : styles.statusBusyText]}>
                            {isAvailable ? 'Available' : 'On Route'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.assignAction}>
                      <View style={[styles.assignPill, isCurrent && styles.assignPillActive]}>
                        <Text style={[styles.assignPillText, isCurrent && styles.assignPillTextActive]}>
                          {isCurrent ? 'Current' : 'Dispatch'}
                        </Text>
                        <Ionicons
                          name={isCurrent ? 'checkmark' : 'arrow-forward'}
                          size={14}
                          color={isCurrent ? '#FFFFFF' : Colors.primary}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          <View style={styles.footerNote}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.footerText}>
              Assigned delivery partners receive real-time push dispatch notifications on their mobile app with client GPS location & tag info.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 44, 89, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    maxWidth: 520,
    width: '100%',
    maxHeight: '88%',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    padding: 18,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F2C59',
  },
  subtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  targetAddress: {
    flex: 1,
    fontSize: 13,
    color: '#0F2C59',
    fontWeight: '700',
    lineHeight: 18,
  },
  targetMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  targetMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  list: {
    maxHeight: 300,
  },
  emptyBox: {
    alignItems: 'center',
    padding: 30,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '600',
  },
  boyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  boyCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  boyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  boyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  boyName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F2C59',
  },
  assignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  assignedBadgeText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '800',
  },
  vehicleText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statVal: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '700',
  },
  statDot: {
    fontSize: 10,
    color: '#94A3B8',
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusAvail: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  statusAvailText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBusy: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusBusyText: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '800',
  },
  assignAction: {
    paddingLeft: 8,
  },
  assignPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  assignPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  assignPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  assignPillTextActive: {
    color: '#FFFFFF',
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    fontWeight: '600',
  },
});
