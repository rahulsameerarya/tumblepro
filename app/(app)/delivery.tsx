import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import RoleSwitcherBar from '../../components/common/RoleSwitcherBar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PaymentModal from '../../components/orders/PaymentModal';
import { Colors } from '../../constants/Colors';
import { Order } from '../../utils/storage';

export default function DeliveryScreen() {
  const { orders, deliveryBoys, markClothesCollected, updateStatus, updatePayment } = useOrders();
  const { user, isDeliveryBoy, isStoreManager, isSuperAdmin } = useAuth();
  const [selectedPaymentOrder, setSelectedPaymentOrder] = useState<Order | null>(null);

  // Filter orders needing collection vs deliveries
  const pickupLeads = orders.filter((o) =>
    ['Lead Received', 'Assigned for Pickup'].includes(o.status)
  );

  const activeDeliveries = orders.filter((o) =>
    ['Picked Up (Bag Tagged)', 'Picked Up', 'Ready', 'Out for Delivery'].includes(o.status)
  );

  const completedToday = orders.filter((o) => o.status === 'Delivered');

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Calling', `Dialing ${phone}`);
    });
  };

  // Stage 1 Collection: Delivery boy assigns Pickup Bag Tag Number only
  const handleMarkCollected = async (order: Order) => {
    const defaultBagTag = order.bagTagNumber || `BAG-${order.storeName.slice(0, 3).toUpperCase()}-${order.orderNumber}`;

    Alert.alert(
      'Assign Pickup Bag Tag (Stage 1) 🏷️',
      `Doorstep Pickup for ${order.customerName}:\n\n` +
      `Assign Pickup Bag Tag [${defaultBagTag}] to customer pickup bag.\n\n` +
      `All clothes will be sealed inside this pickup bag. Individual cloth tags will be generated after store manager differentiation at the hub.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Seal Bag Tag',
          onPress: async () => {
            await markClothesCollected(order.id, defaultBagTag, order.tagInfo?.colorHex, order.tagInfo?.bagCount || 1);
            Alert.alert(
              'Pickup Bag Tagged!',
              `Bag Tag ${defaultBagTag} assigned. Pickup bag is now sealed and in-transit to store hub.`
            );
          },
        },
      ]
    );
  };

  const handleStartOutForDelivery = async (orderId: string) => {
    await updateStatus(orderId, 'Out for Delivery');
    Alert.alert('Status Updated', 'Order marked as Out for Delivery');
  };

  const handleMarkDelivered = async (order: Order) => {
    if (order.paymentStatus !== 'Paid') {
      Alert.alert(
        'Payment Pending ⚠️',
        `₹${order.totalAmount} has not been collected yet for ${order.customerName}.\n\nWould you like to collect payment via UPI QR / Cash now or confirm delivery as Cash?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: '💳 Collect Payment Now',
            onPress: () => setSelectedPaymentOrder(order),
          },
          {
            text: 'Deliver & Mark Cash Paid',
            onPress: async () => {
              await updateStatus(order.id, 'Delivered');
              await updatePayment(order.id, 'Paid', 'Cash on Delivery');
              Alert.alert('Delivery Completed!', `Clean clothes delivered and cash payment recorded.`);
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Complete Delivery 📦',
      `Confirm delivery of clean laundry for ${order.customerName}? (Paid ₹${order.totalAmount})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Delivered',
          onPress: async () => {
            await updateStatus(order.id, 'Delivered');
            Alert.alert('Success!', `Clean clothes delivered to ${order.customerName}.`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Role / Tenant Switcher */}
      <RoleSwitcherBar />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="bicycle" size={22} color={Colors.primary} />
              <Text style={styles.title}>
                {isDeliveryBoy ? 'My Delivery Fleet Tasks' : 'Fleet & Collection Dispatch'}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {user?.storeName?.replace('TumblePro - ', '') || 'All Hubs'} • {pickupLeads.length} Doorstep Pickups • {activeDeliveries.length} Deliveries
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.webContainer}>
          {/* Banner highlighting Two-Stage Tagging Delivery App Concept */}
          <View style={styles.appBanner}>
            <Ionicons name="pricetag" size={22} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Two-Stage Anti-Mixup Flow for Delivery Boy</Text>
              <Text style={styles.bannerText}>
                At doorstep collection, delivery boys assign <Text style={{ fontWeight: '800' }}>ONLY the Pickup Bag Tag Number</Text>. All customer clothes are kept in this sealed bag. Individual garment tags are generated later at the store hub.
              </Text>
            </View>
          </View>

          {/* Section 1: Pickup Leads & Collections */}
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="bicycle" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                Doorstep Pickup Leads for Collection ({pickupLeads.length})
              </Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{pickupLeads.length}</Text>
            </View>
          </View>

          {pickupLeads.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={36} color={Colors.success} />
              <Text style={styles.emptyTitle}>All Doorstep Pickups Completed!</Text>
              <Text style={styles.emptySub}>No pending pickup leads currently in this hub queue.</Text>
            </View>
          ) : (
            pickupLeads.map((order) => {
              const defaultBagTag = order.bagTagNumber || `BAG-${order.storeName.slice(0, 3).toUpperCase()}-${order.orderNumber}`;
              return (
                <View key={order.id} style={styles.card}>
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                      <Text style={styles.hubRoute}>📍 Hub: {order.storeName.replace('TumblePro - ', '')}</Text>
                    </View>
                    <Badge label={order.status} />
                  </View>

                  {/* Pickup Bag Tag Assignment Banner */}
                  <View style={styles.hamperPreviewBox}>
                    <View style={styles.hamperPreviewLeft}>
                      <Ionicons name="bag-handle" size={22} color={Colors.primary} />
                      <View>
                        <Text style={styles.hamperTagCode}>{defaultBagTag}</Text>
                        <Text style={styles.hamperTagSub}>
                          Pickup Bag Tag • Holds {order.items.reduce((s, i) => s + i.quantity, 0)} garments
                        </Text>
                      </View>
                    </View>
                    <View style={styles.stageOnePill}>
                      <Text style={styles.stageOneText}>Stage 1 Bag Tag</Text>
                    </View>
                  </View>

                  {/* Customer Details */}
                  <View style={styles.infoBox}>
                    <View style={styles.row}>
                      <Ionicons name="person" size={14} color={Colors.primary} />
                      <Text style={styles.customerName}>{order.customerName}</Text>
                      <TouchableOpacity
                        style={styles.callPill}
                        onPress={() => handleCall(order.customerPhone)}
                      >
                        <Ionicons name="call" size={12} color="#FFFFFF" />
                        <Text style={styles.callPillText}>{order.customerPhone}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.row}>
                      <Ionicons name="location" size={14} color={Colors.textMuted} />
                      <Text style={styles.addressText} numberOfLines={2}>
                        {order.customerAddress} (PIN: {order.pincode})
                      </Text>
                    </View>

                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>
                        📦 Est. Items: <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{order.items.reduce((s, i) => s + i.quantity, 0)} pcs</Text>
                      </Text>
                      <Text style={styles.metaText}>
                        🛵 Fleet: <Text style={{ color: Colors.primary, fontWeight: '700' }}>{order.assignedDeliveryBoyName || 'Unassigned Lead'}</Text>
                      </Text>
                    </View>
                  </View>

                  {/* Action */}
                  <View style={styles.actionsRow}>
                    {order.status === 'Assigned for Pickup' ? (
                      <Button
                        title={`🏷️ Assign Pickup Bag Tag [${defaultBagTag}] & Confirm Pickup`}
                        onPress={() => handleMarkCollected(order)}
                        size="md"
                        style={{ flex: 1 }}
                      />
                    ) : (
                      <View style={styles.unassignedNotice}>
                        <Ionicons name="alert-circle" size={16} color={Colors.warning} />
                        <Text style={styles.unassignedText}>
                          Store Manager needs to assign this lead to a delivery boy first.
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}

          {/* Section 2: Deliveries (Drop-offs to Customer) */}
          <View style={[styles.sectionTitleRow, { marginTop: 20 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="cube-outline" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                Clean Clothes Deliveries ({activeDeliveries.length})
              </Text>
            </View>
          </View>

          {activeDeliveries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="cube-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptySub}>No orders currently out for delivery or ready.</Text>
            </View>
          ) : (
            activeDeliveries.map((order) => (
              <View key={order.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
                    <Text style={styles.hubRoute}>
                      Bag Tag: {order.bagTagNumber || order.tagInfo?.tagId}
                    </Text>
                  </View>
                  <Badge label={order.status} />
                </View>

                <View style={styles.infoBox}>
                  <View style={styles.row}>
                    <Ionicons name="person" size={14} color={Colors.primary} />
                    <Text style={styles.customerName}>{order.customerName}</Text>
                    <Text style={styles.amountText}>₹{order.totalAmount} ({order.paymentStatus})</Text>
                  </View>
                  <Text style={styles.addressText}>{order.customerAddress} • PIN {order.pincode}</Text>
                </View>

                <View style={styles.actionsRow}>
                  {order.status === 'Ready' && (
                    <Button
                      title="🛵 Start Out for Delivery"
                      onPress={() => handleStartOutForDelivery(order.id)}
                      variant="secondary"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                  )}
                  {order.status === 'Out for Delivery' && (
                    <View style={{ width: '100%', gap: 8 }}>
                      <Button
                        title={
                          order.paymentStatus === 'Paid'
                            ? `✓ Paid (₹${order.totalAmount}) • View Receipt`
                            : `💳 Collect Payment (₹${order.totalAmount} UPI QR / Cash)`
                        }
                        onPress={() => setSelectedPaymentOrder(order)}
                        variant={order.paymentStatus === 'Paid' ? 'secondary' : 'primary'}
                        size="sm"
                        style={{ width: '100%' }}
                      />
                      <Button
                        title="✅ Confirm Delivered"
                        onPress={() => handleMarkDelivered(order)}
                        size="md"
                        style={{ width: '100%' }}
                      />
                    </View>
                  )}
                  {(order.status === 'Picked Up (Bag Tagged)' || order.status === 'Picked Up') && (
                    <View style={styles.inTransitBox}>
                      <Ionicons name="time-outline" size={16} color={Colors.primary} />
                      <Text style={styles.inTransitText}>
                        Pickup bag sealed with tag <Text style={{ fontWeight: '800' }}>{order.bagTagNumber || order.tagInfo?.tagId}</Text>. Traveling to store hub for garment differentiation.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}

          {/* Store Delivery Fleet Summary */}
          <View style={[styles.sectionTitleRow, { marginTop: 24 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="people" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                Store Delivery Fleet ({deliveryBoys.length} Agents)
              </Text>
            </View>
          </View>

          <View style={styles.fleetCard}>
            {deliveryBoys.map((boy) => (
              <View key={boy.id} style={styles.fleetRow}>
                <View style={[styles.fleetAvatar, { backgroundColor: boy.avatarColor }]}>
                  <Text style={styles.fleetAvatarText}>{boy.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fleetName}>{boy.name}</Text>
                  <Text style={styles.fleetSub}>{boy.vehicleNumber} • {boy.phone}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={[styles.statusDotWrap, boy.status === 'available' ? styles.statusAvailBg : styles.statusBusyBg]}>
                    <Text style={[styles.fleetStatusText, boy.status === 'available' ? styles.statusAvailColor : styles.statusBusyColor]}>
                      {boy.status === 'available' ? 'Available' : 'On Pickup'}
                    </Text>
                  </View>
                  <Text style={styles.fleetTasks}>{boy.activeOrdersCount} tasks</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Payment Modal for Delivery Fleet */}
      <PaymentModal
        visible={!!selectedPaymentOrder}
        order={selectedPaymentOrder}
        onClose={() => setSelectedPaymentOrder(null)}
        onSuccess={async (method) => {
          if (selectedPaymentOrder) {
            await updatePayment(selectedPaymentOrder.id, 'Paid', method);
            setSelectedPaymentOrder(null);
            Alert.alert('Payment Collected! 🎉', `Payment verified via ${method} for Order #${selectedPaymentOrder.orderNumber}`);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  webContainer: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  scroll: { padding: 16, paddingBottom: 40 },
  appBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  bannerTitle: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  bannerText: { fontSize: 11, color: Colors.textSecondary, marginTop: 2, lineHeight: 16 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  countBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  hubRoute: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  hamperPreviewBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  hamperPreviewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hamperTagCode: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
  },
  hamperTagSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  stageOnePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stageOneText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    flex: 1,
  },
  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  callPillText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  addressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  amountText: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.success,
  },
  actionsRow: {
    marginTop: 6,
  },
  unassignedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warningBg,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  unassignedText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    fontWeight: '600',
  },
  inTransitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  inTransitText: {
    fontSize: 11,
    color: Colors.primary,
    flex: 1,
    lineHeight: 15,
  },
  fleetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  fleetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  fleetAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fleetAvatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  fleetName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  fleetSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  statusDotWrap: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusAvailBg: { backgroundColor: Colors.successBg },
  statusBusyBg: { backgroundColor: Colors.warningBg },
  statusAvailColor: { color: Colors.success },
  statusBusyColor: { color: Colors.warning },
  fleetStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fleetTasks: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
