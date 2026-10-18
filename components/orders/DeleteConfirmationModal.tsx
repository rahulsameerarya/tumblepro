import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Order } from '../../utils/storage';

interface DeleteConfirmationModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export default function DeleteConfirmationModal({
  visible,
  order,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  const [loading, setLoading] = useState(false);

  if (!order) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Warning Icon & Header */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="trash" size={32} color="#DC2626" />
            </View>
            <Text style={styles.title}>Delete Order #{order.orderNumber}?</Text>
            <Text style={styles.subtitle}>
              This will permanently remove the order record from the CRM. This action cannot be undone.
            </Text>
          </View>

          {/* Order Details Preview Box */}
          <View style={styles.body}>
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Customer:</Text>
                <Text style={styles.detailVal}>{order.customerName} ({order.customerPhone})</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Store Hub:</Text>
                <Text style={styles.detailVal}>{order.storeName.replace('TumblePro - ', '')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Bag Tag:</Text>
                <Text style={styles.detailVal}>{order.bagTagNumber || order.tagInfo?.tagId || 'N/A'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>Bill Amount:</Text>
                <Text style={[styles.detailVal, { color: Colors.primary, fontWeight: '900' }]}>
                  ₹{order.totalAmount} ({order.paymentStatus})
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="trash" size={16} color="#FFFFFF" />
                  <Text style={styles.deleteBtnText}>Yes, Delete Order</Text>
                </>
              )}
            </TouchableOpacity>
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
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 460,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: '#FEF2F2',
    borderBottomWidth: 1,
    borderBottomColor: '#FEE2E2',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#991B1B',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#7F1D1D',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '600',
  },
  body: {
    padding: 18,
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2C59',
    maxWidth: 260,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
