import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import Badge from '../ui/Badge';
import { Order } from '../../utils/storage';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
  showStoreBadge?: boolean;
}

const SERVICE_LABELS: Record<string, string> = {
  wash_fold: 'Wash & Fold',
  wash_iron: 'Wash & Iron',
  dry_clean: 'Dry Clean',
  iron_only: 'Iron Only',
};

export default function OrderCard({ order, onPress, showStoreBadge = true }: OrderCardProps) {
  const createdDate = new Date(order.createdAt);
  const dateStr = createdDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const tagColorHex = order.tagInfo?.colorHex || Colors.primary;
  const tagBasketLabel = order.tagInfo?.basketLabel || 'TAG-A';
  const tagId = order.tagInfo?.tagId || `TAG-${order.orderNumber}`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Top Bar: Order # and Status */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <Text style={styles.date}>{dateStr}</Text>
        </View>
        <Badge label={order.status} />
      </View>

      {/* Unique Clothes Separation Tag Banner */}
      <View style={[styles.tagBanner, { backgroundColor: tagColorHex + '18', borderColor: tagColorHex + '44' }]}>
        <View style={styles.tagLeft}>
          <View style={[styles.tagDot, { backgroundColor: tagColorHex }]} />
          <Text style={[styles.tagBasket, { color: tagColorHex }]}>{tagBasketLabel}</Text>
          <Text style={styles.tagCode}>{tagId}</Text>
        </View>
        <Text style={styles.bagCounter}>
          {order.tagInfo?.bagCount || 1} Bag{(order.tagInfo?.bagCount || 1) > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Store & Delivery Boy Assignment Line */}
      <View style={styles.dispatchRow}>
        {showStoreBadge && (
          <View style={styles.storeBadge}>
            <Ionicons name="business" size={11} color={Colors.primaryLight} />
            <Text style={styles.storeText} numberOfLines={1}>
              {order.storeName ? order.storeName.replace('TumblePro - ', '') : 'Store Hub'}
            </Text>
          </View>
        )}

        <View style={styles.deliveryBadge}>
          <Ionicons
            name="bicycle"
            size={12}
            color={order.assignedDeliveryBoyName ? Colors.success : Colors.warning}
          />
          <Text
            style={[
              styles.deliveryText,
              { color: order.assignedDeliveryBoyName ? Colors.success : Colors.warning },
            ]}
            numberOfLines={1}
          >
            {order.assignedDeliveryBoyName ? order.assignedDeliveryBoyName : 'Unassigned Lead'}
          </Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.row}>
        <Ionicons name="person-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.customerName}>{order.customerName}</Text>
        <Text style={styles.phone}>{order.customerPhone}</Text>
      </View>

      {/* Address & Pincode */}
      {order.customerAddress ? (
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.addressText} numberOfLines={1}>
            {order.customerAddress} ({order.pincode})
          </Text>
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.itemCount}>
          <Ionicons name="water-outline" size={13} color={Colors.primary} />
          <Text style={styles.serviceText}>
            {SERVICE_LABELS[order.serviceType] ?? order.serviceType} (
            {order.items ? order.items.reduce((s, i) => s + i.quantity, 0) : 0} pcs)
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
          <View
            style={[
              styles.payBadge,
              order.paymentStatus === 'Paid' ? styles.paid : styles.unpaid,
            ]}
          >
            <Text
              style={[
                styles.payText,
                { color: order.paymentStatus === 'Paid' ? Colors.success : Colors.danger },
              ]}
            >
              {order.paymentStatus}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNum: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  date: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  tagBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    marginBottom: 8,
  },
  tagLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagBasket: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tagCode: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  bagCounter: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  dispatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    maxWidth: '50%',
  },
  storeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    flex: 1,
  },
  deliveryText: {
    fontSize: 10,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  phone: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  payBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paid: {
    backgroundColor: Colors.successBg,
  },
  unpaid: {
    backgroundColor: Colors.dangerBg,
  },
  payText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
