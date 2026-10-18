import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Order } from '../../utils/storage';
import { router } from 'expo-router';

interface OrderSuccessModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onNewOrder?: () => void;
}

export function OrderSuccessModal({
  visible,
  order,
  onClose,
  onNewOrder,
}: OrderSuccessModalProps) {
  if (!order) return null;

  const totalPieces = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const tagColor = order.tagInfo?.colorHex || Colors.primary;

  const handleViewOrder = () => {
    onClose();
    router.push(`/(app)/orders/${order.id}` as any);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header with celebratory icon */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            </View>
            <Text style={styles.title}>Order Placed & Routed! 🎉</Text>
            <Text style={styles.subtitle}>
              Successfully added to CRM and auto-routed to nearest hub
            </Text>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Key Order Metrics Grid */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Order Number</Text>
                <Text style={styles.orderNumberText}>{order.orderNumber}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Assigned Hub</Text>
                <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 8 }}>
                  <Text style={styles.hubNameText}>{order.storeName}</Text>
                  <Text style={styles.routingReasonText}>{order.routingReason}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Unique Anti-Mixup Tag Preview */}
              <View style={[styles.tagBanner, { backgroundColor: tagColor + '18', borderColor: tagColor + '55' }]}>
                <View style={styles.tagHeaderRow}>
                  <View style={[styles.tagDot, { backgroundColor: tagColor }]} />
                  <Text style={[styles.basketLabel, { color: tagColor }]}>
                    {order.tagInfo?.basketLabel || 'BASKET-A'}
                  </Text>
                </View>
                <Text style={styles.tagIdCode}>{order.tagInfo?.tagId}</Text>
                <Text style={styles.tagNote}>
                  🔒 Clothes will be tagged with this unique ID upon pickup to prevent separation mix-ups.
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Customer</Text>
                <Text style={styles.summaryVal}>{order.customerName} ({order.customerPhone})</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Pickup Address</Text>
                <Text style={styles.summaryVal} numberOfLines={2}>
                  {order.customerAddress} • PIN {order.pincode}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Load Details</Text>
                <Text style={styles.summaryVal}>
                  {order.tagInfo?.bagCount || 1} Bag(s) • {totalPieces} Garment(s)
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Estimated Total</Text>
                <Text style={styles.totalPrice}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.primaryActionBtn} onPress={handleViewOrder}>
              <Ionicons name="receipt-outline" size={18} color="#fff" />
              <Text style={styles.primaryActionText}>View Order & QR Tag Slip</Text>
            </TouchableOpacity>

            {onNewOrder && (
              <TouchableOpacity
                style={styles.secondaryActionBtn}
                onPress={() => {
                  onNewOrder();
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
                <Text style={styles.secondaryActionText}>+ Create Another Order</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
              <Text style={styles.closeActionText}>Close & Return</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Inline Error Banner / Alert ────────────────────────────────
interface ErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <View style={styles.errorBox}>
      <Ionicons name="alert-circle" size={20} color={Colors.danger} />
      <View style={{ flex: 1 }}>
        <Text style={styles.errorTitle}>Action Required</Text>
        <Text style={styles.errorMessage}>{message}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.errorDismissBtn}>
        <Ionicons name="close" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
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
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    padding: 22,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconCircle: {
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F2C59',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  body: {
    padding: 18,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryKey: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '700',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2C59',
    maxWidth: 240,
    textAlign: 'right',
  },
  orderNumberText: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  hubNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2C59',
  },
  routingReasonText: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  tagBanner: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    marginVertical: 4,
  },
  tagHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  basketLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagIdCode: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F2C59',
    letterSpacing: 0.8,
    marginVertical: 4,
  },
  tagNote: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.success,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 10,
  },
  secondaryActionText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  closeActionBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 6,
  },
  closeActionText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B91C1C',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  errorMessage: {
    fontSize: 13,
    color: '#7F1D1D',
    marginTop: 2,
    fontWeight: '700',
  },
  errorDismissBtn: {
    padding: 6,
  },
});
