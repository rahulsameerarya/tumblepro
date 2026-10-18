import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useOrders } from '../../../contexts/OrderContext';
import { useAuth } from '../../../contexts/AuthContext';
import StatusStepper from '../../../components/orders/StatusStepper';
import LaundryTagCard from '../../../components/orders/LaundryTagCard';
import AssignDeliveryModal from '../../../components/orders/AssignDeliveryModal';
import PaymentModal from '../../../components/orders/PaymentModal';
import EditOrderModal from '../../../components/orders/EditOrderModal';
import DeleteConfirmationModal from '../../../components/orders/DeleteConfirmationModal';
import InvoiceModal from '../../../components/orders/InvoiceModal';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';
import { Colors } from '../../../constants/Colors';
import { ORDER_STATUSES, OrderStatus, LEGACY_STATUS_MAP } from '../../../constants/Orders';
import { DEFAULT_PRICE_LIST } from '../../../constants/Pricing';
import { Order, OrderItem } from '../../../utils/storage';

const SERVICE_LABELS: Record<string, string> = {
  wash_fold: 'Wash & Fold',
  wash_iron: 'Wash & Iron',
  dry_clean: 'Dry Clean',
  iron_only: 'Iron Only',
  shoe_cleaning: 'Shoe Spa & Cleaning',
  sofa_cleaning: 'Sofa & Upholstery Cleaning',
  carpet_cleaning: 'Carpet & Curtain Spa',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    getOrder,
    updateStatus,
    updatePayment,
    removeOrder,
    updateOrder,
    deliveryBoys,
    assignDeliveryBoy,
    reassignStore,
    differentiateAndGenerateTags,
    stores,
  } = useOrders();
  const { isSuperAdmin, isStoreManager, user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReassignStoreModal, setShowReassignStoreModal] = useState(false);
  const [showDifferentiateModal, setShowDifferentiateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showSetRatesModal, setShowSetRatesModal] = useState(false);
  const [editingRates, setEditingRates] = useState<{ [key: string]: number }>({});
  const [targetDeliveryDate, setTargetDeliveryDate] = useState<string>('');
  const [targetDeliverySlot, setTargetDeliverySlot] = useState<string>('Evening (5 PM - 8 PM)');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedPacking, setSelectedPacking] = useState<'Hanger Cover' | 'Fold & Pack'>('Hanger Cover');
  const [itemPackings, setItemPackings] = useState<{ [key: string]: 'Hanger Cover' | 'Fold & Pack' }>({});

  useEffect(() => {
    if (id) loadOrder();
  }, [id]);

  async function loadOrder() {
    const o = await getOrder(id);
    setOrder(o);
    if (o?.packingType) {
      setSelectedPacking(o.packingType);
    }
    if (o?.items) {
      const packMap: { [key: string]: 'Hanger Cover' | 'Fold & Pack' } = {};
      o.items.forEach((it, idx) => {
        packMap[it.itemId || String(idx)] = it.packingType || o.packingType || 'Hanger Cover';
      });
      setItemPackings(packMap);
    }
  }

  const openSetRatesModal = () => {
    if (!order) return;
    const rates: { [key: string]: number } = {};
    (order.items || []).forEach((it, idx) => {
      const key = it.itemId || String(idx);
      rates[key] = it.unitPrice || 0;
    });
    setEditingRates(rates);
    setShowSetRatesModal(true);
  };

  const handleAutoApplyStandardRates = async () => {
    if (!order) return;
    setLoading(true);
    const updatedItems: OrderItem[] = (order.items || []).map((it) => {
      const found = DEFAULT_PRICE_LIST.find(
        (p) => p.id === it.itemId || p.name.toLowerCase() === it.itemName.toLowerCase()
      );
      let rate = 45;
      if (found) {
        if (
          found.prices.shoe_cleaning &&
          (order.serviceType === 'shoe_cleaning' ||
            (found.category === 'Shoe & Furniture Spa' && found.subCategory === 'Footwear'))
        ) {
          rate = found.prices.shoe_cleaning;
        } else if (
          found.prices.sofa_cleaning &&
          (order.serviceType === 'sofa_cleaning' ||
            (found.category === 'Shoe & Furniture Spa' && found.subCategory === 'Upholstery'))
        ) {
          rate = found.prices.sofa_cleaning;
        } else if (
          found.prices.carpet_cleaning &&
          (order.serviceType === 'carpet_cleaning' || found.category === 'Shoe & Furniture Spa')
        ) {
          rate = found.prices.carpet_cleaning;
        } else {
          const p = (found.prices as any)[order.serviceType];
          rate =
            typeof p === 'number' && p > 0
              ? p
              : found.prices.dry_clean ||
                found.prices.wash_iron ||
                found.prices.wash_fold ||
                45;
        }
      }
      return {
        ...it,
        unitPrice: rate,
      };
    });

    const newTotal = updatedItems.reduce(
      (sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0),
      0
    );
    await handleSaveEdit({ items: updatedItems, totalAmount: newTotal });
    setToastMessage(`Standard rates applied! Bill updated to ₹${newTotal.toLocaleString('en-IN')}`);
    setTimeout(() => setToastMessage(null), 3500);
    setLoading(false);
  };

  const handleSaveRates = async () => {
    if (!order) return;
    setLoading(true);
    const updatedItems: OrderItem[] = (order.items || []).map((it, idx) => {
      const key = it.itemId || String(idx);
      const r = editingRates[key];
      return {
        ...it,
        unitPrice: typeof r === 'number' && !isNaN(r) ? r : it.unitPrice || 0,
      };
    });
    const newTotal = updatedItems.reduce(
      (sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0),
      0
    );
    await handleSaveEdit({ items: updatedItems, totalAmount: newTotal });
    setShowSetRatesModal(false);
    setToastMessage(`Rates saved! Bill confirmed at ₹${newTotal.toLocaleString('en-IN')}`);
    setTimeout(() => setToastMessage(null), 3500);
    setLoading(false);
  };

  async function handleStatusUpdate(status: OrderStatus | string) {
    if (!order) return;

    // Prerequisites when moving from 'Lead Received' -> 'Assigned for Pickup'
    if (order.status === 'Lead Received' && status === 'Assigned for Pickup') {
      // 1. Check price
      const hasUnsetPrice =
        !order.totalAmount ||
        order.totalAmount <= 0 ||
        (order.items && order.items.some((it) => !it.unitPrice || it.unitPrice === 0));
      if (hasUnsetPrice) {
        Alert.alert(
          'Pricing Required',
          'Please set the garment rates and total amount before advancing to "Assigned for Pickup".',
          [
            { text: 'Auto-Apply Standard Rates', onPress: handleAutoApplyStandardRates },
            { text: 'Set Rates Manually', onPress: openSetRatesModal },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // 2. Check delivery date
      if (!order.deliveryDate) {
        Alert.alert(
          'Delivery Schedule Required',
          'Please set the target delivery date commitment before assigning pickup.',
          [
            { text: 'Set Delivery Date', onPress: openDeliveryScheduler },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // 3. Check delivery boy assignment (if doorstep delivery)
      if (order.deliveryMode === 'pickup_delivery' && !order.assignedDeliveryBoyId) {
        Alert.alert(
          'Delivery Boy Required',
          `Please assign a delivery fleet agent from ${order.storeName.replace(
            'TumblePro - ',
            ''
          )} for doorstep collection.`,
          [
            { text: 'Assign Delivery Boy', onPress: () => setShowAssignModal(true) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
    }

    setLoading(true);
    await updateStatus(order.id, status);
    await loadOrder();
    setLoading(false);
  }

  async function handlePayment(paymentStatus: Order['paymentStatus']) {
    if (!order) return;
    await updatePayment(order.id, paymentStatus, 'UPI');
    await loadOrder();
  }

  const handleCall = (phone?: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Calling', `Dialing ${phone}`);
    });
  };

  const handleReassignStore = async (targetStoreId: string) => {
    if (!order) return;
    await reassignStore(order.id, targetStoreId, 'Super Admin manual reroute');
    await loadOrder();
    setShowReassignStoreModal(false);
    Alert.alert('Store Updated', `Order reassigned to selected hub.`);
  };

  // Stage 2: Store Manager differentiates garments and triggers individual cloth tags
  const handleConfirmDifferentiation = async () => {
    if (!order) return;
    setLoading(true);
    const updatedItems: OrderItem[] = (order.items || []).map((it, idx) => ({
      ...it,
      packingType: itemPackings[it.itemId || String(idx)] || selectedPacking || 'Hanger Cover',
    }));
    await differentiateAndGenerateTags(order.id, updatedItems, selectedPacking);
    await loadOrder();
    setLoading(false);
    setShowDifferentiateModal(false);
    Alert.alert('Tags Generated', 'Individual garment tags created with per-item packing types.');
  };

  const handleSaveEdit = async (updatedFields: Partial<Order>) => {
    if (!order) return;
    setLoading(true);
    const updated = await updateOrder(order.id, updatedFields);
    if (updated) {
      setOrder(updated);
      setToastMessage('Order details updated successfully!');
      setTimeout(() => setToastMessage(null), 3500);
    }
    setLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!order) return;
    await removeOrder(order.id);
    setShowDeleteModal(false);
    router.replace('/(app)/orders');
  };

  const openDeliveryScheduler = () => {
    if (order?.deliveryDate) {
      const d = new Date(order.deliveryDate);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setTargetDeliveryDate(`${yyyy}-${mm}-${dd}`);
      const h = d.getHours();
      if (h < 13) setTargetDeliverySlot('Morning (9 AM - 1 PM)');
      else if (h < 17) setTargetDeliverySlot('Afternoon (1 PM - 5 PM)');
      else setTargetDeliverySlot('Evening (5 PM - 8 PM)');
    } else {
      const d = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      setTargetDeliveryDate(`${yyyy}-${mm}-${dd}`);
      setTargetDeliverySlot('Evening (5 PM - 8 PM)');
    }
    setShowDeliveryModal(true);
  };

  const handleSaveDeliveryDate = async () => {
    if (!order || !targetDeliveryDate) return;
    setLoading(true);
    let hour = 18;
    if (targetDeliverySlot.startsWith('Morning')) hour = 10;
    else if (targetDeliverySlot.startsWith('Afternoon')) hour = 14;

    const parts = targetDeliveryDate.split('-').map(Number);
    let dateObj: Date;
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      dateObj = new Date(parts[0], parts[1] - 1, parts[2], hour, 0, 0);
    } else {
      dateObj = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    }

    const iso = dateObj.toISOString();
    await handleSaveEdit({ deliveryDate: iso });
    setShowDeliveryModal(false);
    setToastMessage(
      `Delivery committed for ${dateObj.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
      })} (${targetDeliverySlot.split(' ')[0]})`
    );
    setTimeout(() => setToastMessage(null), 3500);
    setLoading(false);
  };

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  // Resolve status indices
  const normalizedStatus = (LEGACY_STATUS_MAP[order.status] || order.status) as OrderStatus;
  const currentIdx = ORDER_STATUSES.indexOf(normalizedStatus);
  const nextStatus = currentIdx < ORDER_STATUSES.length - 1 ? ORDER_STATUSES[currentIdx + 1] : null;
  const prevStatus = currentIdx > 0 ? ORDER_STATUSES[currentIdx - 1] : null;

  const createdDate = new Date(order.createdAt).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalPieces = order.items ? order.items.reduce((s, it) => s + (it.quantity || 1), 0) : 0;
  const bagTagNum = order.bagTagNumber || `BAG-${order.tagInfo?.tagId?.split('-')[1] || 'HUB'}-${order.orderNumber}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.orderNum}>Order #{order.orderNumber}</Text>
            <Text style={styles.orderDate}>{createdDate}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => setShowInvoiceModal(true)} style={styles.invoiceBtn}>
              <Ionicons name="document-text-outline" size={15} color="#FFFFFF" />
              <Text style={styles.invoiceBtnText}>Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEditModal(true)} style={styles.editBtn}>
              <Ionicons name="pencil-outline" size={16} color={Colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowDeleteModal(true)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.webContainer}>
          {/* Order Lifecycle Progress */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Order & Laundry Lifecycle</Text>
              <Badge label={order.status} />
            </View>
            <StatusStepper currentStatus={order.status} />

            {/* Lead Received Readiness Checklist */}
            {order.status === 'Lead Received' && (
              <View style={styles.prereqBox}>
                <Text style={styles.prereqTitle}>📋 Dispatch Prerequisites Checklist:</Text>
                <View style={styles.prereqChipsRow}>
                  {/* 1. Price */}
                  <TouchableOpacity
                    style={[
                      styles.prereqChip,
                      order.totalAmount > 0 ? styles.prereqChipOk : styles.prereqChipWarn,
                    ]}
                    onPress={openSetRatesModal}
                  >
                    <Ionicons
                      name={order.totalAmount > 0 ? 'checkmark-circle' : 'alert-circle'}
                      size={14}
                      color={order.totalAmount > 0 ? Colors.success : '#D97706'}
                    />
                    <Text
                      style={[
                        styles.prereqChipText,
                        order.totalAmount > 0 ? styles.prereqChipTextOk : styles.prereqChipTextWarn,
                      ]}
                    >
                      {order.totalAmount > 0 ? `Price: ₹${order.totalAmount}` : 'Set Rates *'}
                    </Text>
                  </TouchableOpacity>

                  {/* 2. Target Delivery Date */}
                  <TouchableOpacity
                    style={[
                      styles.prereqChip,
                      order.deliveryDate ? styles.prereqChipOk : styles.prereqChipWarn,
                    ]}
                    onPress={openDeliveryScheduler}
                  >
                    <Ionicons
                      name={order.deliveryDate ? 'checkmark-circle' : 'alert-circle'}
                      size={14}
                      color={order.deliveryDate ? Colors.success : '#D97706'}
                    />
                    <Text
                      style={[
                        styles.prereqChipText,
                        order.deliveryDate ? styles.prereqChipTextOk : styles.prereqChipTextWarn,
                      ]}
                    >
                      {order.deliveryDate
                        ? `Delivery: ${new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}`
                        : 'Set Delivery Date *'}
                    </Text>
                  </TouchableOpacity>

                  {/* 3. Delivery Boy (if pickup_delivery) */}
                  {order.deliveryMode === 'pickup_delivery' && (
                    <TouchableOpacity
                      style={[
                        styles.prereqChip,
                        order.assignedDeliveryBoyId ? styles.prereqChipOk : styles.prereqChipWarn,
                      ]}
                      onPress={() => setShowAssignModal(true)}
                    >
                      <Ionicons
                        name={order.assignedDeliveryBoyId ? 'checkmark-circle' : 'alert-circle'}
                        size={14}
                        color={order.assignedDeliveryBoyId ? Colors.success : '#D97706'}
                      />
                      <Text
                        style={[
                          styles.prereqChipText,
                          order.assignedDeliveryBoyId
                            ? styles.prereqChipTextOk
                            : styles.prereqChipTextWarn,
                        ]}
                      >
                        {order.assignedDeliveryBoyName
                          ? `Boy: ${order.assignedDeliveryBoyName}`
                          : 'Assign Boy *'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Lifecycle Action Buttons */}
            <View style={styles.statusBtns}>
              {prevStatus && (
                <Button
                  title={`← ${prevStatus}`}
                  onPress={() => handleStatusUpdate(prevStatus)}
                  variant="secondary"
                  size="sm"
                  style={{ flex: 1 }}
                  loading={loading}
                />
              )}
              {nextStatus && (
                <Button
                  title={`Advance to ${nextStatus} →`}
                  onPress={() => handleStatusUpdate(nextStatus)}
                  size="sm"
                  style={{ flex: 1 }}
                  loading={loading}
                />
              )}
            </View>
          </View>

          {/* Target Delivery Schedule Commitment Card */}
          <Text style={styles.sectionHeader}>Target Delivery Schedule</Text>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                <Text style={styles.cardTitle}>Delivery Commitment</Text>
              </View>
              <TouchableOpacity
                style={styles.setDeliveryBtn}
                onPress={openDeliveryScheduler}
              >
                <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                <Text style={styles.setDeliveryBtnText}>
                  {order.deliveryDate ? 'Reschedule' : 'Set Delivery Date'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.deliveryScheduleBox}>
              <View
                style={[
                  styles.deliveryIconCircle,
                  { backgroundColor: order.deliveryDate ? '#DCFCE7' : '#FEF3C7' },
                ]}
              >
                <Ionicons
                  name={order.deliveryDate ? 'checkmark-circle' : 'alert-circle'}
                  size={24}
                  color={order.deliveryDate ? Colors.success : '#D97706'}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.deliveryDateTitle}>
                  {order.deliveryDate
                    ? new Date(order.deliveryDate).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Target Delivery Not Scheduled'}
                </Text>
                <Text style={styles.deliveryDateDesc}>
                  {order.deliveryDate
                    ? 'Guaranteed doorstep return / counter pickup deadline set by store.'
                    : 'Set target completion date once garments arrive and are inspected at store.'}
                </Text>
              </View>
            </View>
          </View>

          {/* TWO-STAGE TAGGING WORKFLOW */}
          <Text style={styles.sectionHeader}>Two-Stage Anti-Mixup Tagging</Text>

          {/* Stage 1: Doorstep Pickup Bag Tag */}
          <View style={styles.card}>
            <View style={styles.stageHeaderRow}>
              <View style={styles.stageNumberBadge}>
                <Text style={styles.stageNumberText}>STAGE 1</Text>
              </View>
              <Text style={styles.stageTitle}>Doorstep Pickup Bag Tag</Text>
            </View>

            <View style={styles.hamperTagBanner}>
              <View style={styles.hamperLeft}>
                <Ionicons name="bag" size={26} color={order.bagTagColor || Colors.primary} />
                <View>
                  <Text style={styles.hamperBagTagCode}>{bagTagNum}</Text>
                  <Text style={styles.hamperBagSub}>
                    {order.tagInfo?.bagCount || 1} Pickup Bag{(order.tagInfo?.bagCount || 1) > 1 ? 's' : ''} • Holds all {totalPieces} items
                  </Text>
                </View>
              </View>
              <View style={styles.hamperStatusBadge}>
                <Text style={styles.hamperStatusText}>
                  {order.pickedUpAt ? '🟢 Bag Tagged' : '🟡 Assigned at Pickup'}
                </Text>
              </View>
            </View>
            <Text style={styles.stageHelpText}>
              🔒 At doorstep collection, the delivery boy assigns this bag tag number. All clothes of {order.customerName} are secured together to prevent mix-up during transit.
            </Text>
          </View>

          {/* Stage 2: Store Clothes Intake & Garment Tags */}
          <View style={styles.card}>
            <View style={styles.stageHeaderRow}>
              <View style={[styles.stageNumberBadge, { backgroundColor: order.clothesDifferentiated ? Colors.success : Colors.secondary }]}>
                <Text style={styles.stageNumberText}>STAGE 2</Text>
              </View>
              <Text style={styles.stageTitle}>Store Clothes Intake & Garment Tags</Text>
            </View>

            {order.clothesDifferentiated ? (
              <View style={styles.differentiatedBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                  <Text style={styles.differentiatedTitle}>Garment Tags Generated</Text>
                </View>
                <Text style={styles.differentiatedSub}>
                  Sorted by {order.differentiatedBy || 'Store Manager'} • {totalPieces} individual garment tags ready for washing/packing.
                </Text>

                {/* Printable Individual Garment Tags Slip */}
                <View style={{ marginTop: 12 }}>
                  <LaundryTagCard tagInfo={order.tagInfo} order={order} />
                </View>
              </View>
            ) : (
              <View style={styles.pendingDifferentiationBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="alert-circle" size={22} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingDiffTitle}>Pending Store Intake & Garment Tags</Text>
                    <Text style={styles.pendingDiffSub}>
                      Clothes are currently sealed in pickup bag <Text style={{ fontWeight: '800' }}>{bagTagNum}</Text>. When the bag arrives at the store hub, open and generate individual printable garment tags.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.differentiateActionBtn}
                  onPress={() => setShowDifferentiateModal(true)}
                >
                  <Ionicons name="pricetags" size={16} color="#FFFFFF" />
                  <Text style={styles.differentiateActionBtnText}>
                    🏷️ Generate Garment Tag
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Store & Pincode Routing Info */}
          <Text style={styles.sectionHeader}>Store Assignment & Routing</Text>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="business" size={16} color={Colors.primary} />
                <Text style={styles.storeTitle}>{order.storeName.replace('TumblePro - ', '')}</Text>
              </View>
              {isSuperAdmin && (
                <TouchableOpacity
                  style={styles.changeStoreBtn}
                  onPress={() => setShowReassignStoreModal(true)}
                >
                  <Text style={styles.changeStoreText}>Re-route Hub</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.routingDetails}>
              <View style={styles.routingRow}>
                <Text style={styles.routingLabel}>Customer Pincode:</Text>
                <Text style={styles.routingVal}>{order.pincode} ({order.area})</Text>
              </View>
              <View style={styles.routingRow}>
                <Text style={styles.routingLabel}>Routing Rule:</Text>
                <Text style={styles.routingValHighlight}>{order.routingReason}</Text>
              </View>
            </View>
          </View>

          {/* Delivery Partner Assignment Section */}
          <Text style={styles.sectionHeader}>Delivery Boy Assignment</Text>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons
                  name="bicycle"
                  size={18}
                  color={order.assignedDeliveryBoyName ? Colors.success : Colors.warning}
                />
                <Text style={styles.cardTitle}>
                  {order.assignedDeliveryBoyName ? 'Assigned Collector' : 'Pending Lead Assignment'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.assignLeadBtn}
                onPress={() => setShowAssignModal(true)}
              >
                <Ionicons name="swap-horizontal" size={14} color="#FFFFFF" />
                <Text style={styles.assignLeadText}>
                  {order.assignedDeliveryBoyName ? 'Change Boy' : 'Assign Boy'}
                </Text>
              </TouchableOpacity>
            </View>

            {order.assignedDeliveryBoyName ? (
              <View style={styles.assignedBoyBox}>
                <View style={styles.boyAvatar}>
                  <Text style={styles.boyAvatarText}>{order.assignedDeliveryBoyName[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assignedBoyName}>{order.assignedDeliveryBoyName}</Text>
                  <Text style={styles.assignedBoyPhone}>{order.assignedDeliveryBoyPhone || '+91 98111 22334'}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callBoyBtn}
                  onPress={() => handleCall(order.assignedDeliveryBoyPhone)}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.unassignedPrompt}>
                <Text style={styles.unassignedPromptText}>
                  This pickup lead needs to be assigned to a delivery boy from {order.storeName.replace('TumblePro - ', '')}.
                </Text>
                <Button
                  title="🛵 Dispatch to Delivery Boy"
                  onPress={() => setShowAssignModal(true)}
                  size="sm"
                  style={{ marginTop: 8 }}
                />
              </View>
            )}
          </View>

          {/* Customer Information */}
          <Text style={styles.sectionHeader}>Customer Details</Text>
          <View style={styles.card}>
            <View style={styles.custRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.custName}>{order.customerName}</Text>
                <Text style={styles.custPhone}>{order.customerPhone}</Text>
              </View>
              <TouchableOpacity
                style={styles.callCustBtn}
                onPress={() => handleCall(order.customerPhone)}
              >
                <Ionicons name="call" size={15} color="#FFFFFF" />
                <Text style={styles.callCustText}>Call</Text>
              </TouchableOpacity>
            </View>

            {order.customerAddress && (
              <View style={styles.addressBox}>
                <Ionicons name="location-outline" size={14} color={Colors.primary} />
                <Text style={styles.addressVal}>
                  {order.customerAddress} • PIN {order.pincode}
                </Text>
              </View>
            )}

            {order.specialInstructions && (
              <View style={styles.notesBox}>
                <Ionicons name="document-text-outline" size={14} color={Colors.primary} />
                <Text style={styles.notesVal}>{order.specialInstructions}</Text>
              </View>
            )}
          </View>

          {/* Laundry Items & Bill */}
          <Text style={styles.sectionHeader}>Laundry Items & Bill</Text>
          <View style={styles.card}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTypeName}>{SERVICE_LABELS[order.serviceType] ?? order.serviceType}</Text>
              <Text style={styles.deliveryModeText}>
                {order.deliveryMode === 'pickup_delivery' ? 'Home Pickup & Drop' : 'Store Walk-in'}
              </Text>
            </View>

            <View style={styles.itemsTable}>
              {order.items.map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.quantity} × {item.itemName}
                  </Text>
                  <Text style={styles.itemPrice}>
                    ₹{(item.quantity * item.unitPrice).toLocaleString('en-IN')}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalAmount}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
            </View>

            {/* Rates Confirmation Alert if 0 or Unset */}
            {(!order.totalAmount || order.totalAmount === 0 || (order.items && order.items.some((it) => !it.unitPrice || it.unitPrice === 0))) ? (
              <View style={styles.pricingPendingCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="alert-circle" size={22} color="#D97706" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pricingPendingTitle}>Rates Pending Confirmation</Text>
                    <Text style={styles.pricingPendingSub}>
                      This order was received from the customer portal without prices. Store manager must set garment rates before advancing lead.
                    </Text>
                  </View>
                </View>

                <View style={styles.pricingPendingActions}>
                  <TouchableOpacity
                    style={styles.autoRateActionBtn}
                    onPress={handleAutoApplyStandardRates}
                  >
                    <Ionicons name="flash" size={14} color="#FFFFFF" />
                    <Text style={styles.autoRateActionBtnText}>⚡ Auto-Apply Standard Rates</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.manualRateActionBtn}
                    onPress={openSetRatesModal}
                  >
                    <Ionicons name="pencil" size={14} color={Colors.primary} />
                    <Text style={styles.manualRateActionBtnText}>✏️ Set Custom Rates</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.pricingConfirmedRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
                  <Text style={styles.pricingConfirmedText}>Garment Rates Confirmed</Text>
                </View>
                <TouchableOpacity
                  style={styles.reEditRatesBtn}
                  onPress={openSetRatesModal}
                >
                  <Ionicons name="pencil" size={12} color={Colors.primary} />
                  <Text style={styles.reEditRatesText}>Edit Rates</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Payment & Checkout Actions */}
            <View style={styles.paymentActions}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={styles.payLabel}>
                  Payment: <Text style={{ color: order.paymentStatus === 'Paid' ? Colors.success : Colors.danger, fontWeight: '800' }}>{order.paymentStatus}</Text>
                  {order.paymentMethod ? ` (${order.paymentMethod})` : ''}
                </Text>
                {order.paymentStatus === 'Paid' && (
                  <View style={styles.paidBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                    <Text style={styles.paidBadgeText}>Settled</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.openPaymentBtn}
                onPress={() => setShowPaymentModal(true)}
              >
                <Ionicons name="card" size={18} color="#FFFFFF" />
                <Text style={styles.openPaymentBtnText}>
                  {order.paymentStatus === 'Paid'
                    ? `✓ Paid (₹${order.totalAmount}) • View Payment Details`
                    : `💳 Collect Payment ₹${order.totalAmount} (Cash / UPI / Gateway)`}
                </Text>
              </TouchableOpacity>

              <View style={[styles.payBtnRow, { marginTop: 8 }]}>
                <Button
                  title={order.paymentStatus === 'Paid' ? '✓ Mark Paid' : 'Quick Paid'}
                  onPress={() => handlePayment('Paid')}
                  variant={order.paymentStatus === 'Paid' ? 'primary' : 'secondary'}
                  size="sm"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Mark Unpaid"
                  onPress={() => handlePayment('Unpaid')}
                  variant={order.paymentStatus === 'Unpaid' ? 'danger' : 'secondary'}
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>

              <TouchableOpacity
                style={styles.viewInvoiceActionBtn}
                onPress={() => setShowInvoiceModal(true)}
              >
                <Ionicons name="receipt-outline" size={17} color={Colors.primary} />
                <Text style={styles.viewInvoiceActionText}>
                  📄 Generate GST Tax Invoice / Bill Receipt
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Differentiate Clothes & Generate Tags Modal */}
      <Modal visible={showDifferentiateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="pricetags" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Generate Garment Tag</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDifferentiateModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Text style={styles.modalSub}>
                Pickup Bag <Text style={{ fontWeight: '800', color: Colors.primary }}>{bagTagNum}</Text> has arrived at the store hub. Review the garments to generate individual anti-mixup tags:
              </Text>

              {/* Header & Quick Batch Buttons */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, marginTop: 4 }}>
                <Text style={styles.diffPackingTitle}>Assign Packing Style Per Garment:</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity
                    style={styles.diffBatchBtn}
                    onPress={() => {
                      const updated: { [key: string]: 'Hanger Cover' | 'Fold & Pack' } = {};
                      order.items.forEach((it, idx) => {
                        updated[it.itemId || String(idx)] = 'Hanger Cover';
                      });
                      setItemPackings(updated);
                    }}
                  >
                    <Text style={styles.diffBatchText}>All Hanger</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.diffBatchBtn}
                    onPress={() => {
                      const updated: { [key: string]: 'Hanger Cover' | 'Fold & Pack' } = {};
                      order.items.forEach((it, idx) => {
                        updated[it.itemId || String(idx)] = 'Fold & Pack';
                      });
                      setItemPackings(updated);
                    }}
                  >
                    <Text style={styles.diffBatchText}>All Fold</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Items List with Per-Item Packing Switchers */}
              <View style={styles.diffItemsBox}>
                {order.items.map((it, idx) => {
                  const key = it.itemId || String(idx);
                  const currentPack = itemPackings[key] || 'Hanger Cover';
                  return (
                    <View key={idx} style={styles.diffItemSplitRow}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.diffItemName}>{it.itemName}</Text>
                        <Text style={styles.diffItemQty}>
                          {it.quantity} pc{it.quantity > 1 ? 's' : ''} • ₹{it.quantity * it.unitPrice}
                        </Text>
                      </View>

                      {/* Per-Item Packing Buttons */}
                      <View style={styles.itemPackingPillRow}>
                        <TouchableOpacity
                          style={[
                            styles.itemPackingPill,
                            currentPack === 'Hanger Cover' && styles.itemPackingPillHangerActive,
                          ]}
                          onPress={() =>
                            setItemPackings((prev) => ({ ...prev, [key]: 'Hanger Cover' }))
                          }
                        >
                          <Ionicons
                            name="shirt-outline"
                            size={13}
                            color={currentPack === 'Hanger Cover' ? '#fff' : Colors.primary}
                          />
                          <Text
                            style={[
                              styles.itemPackingPillText,
                              currentPack === 'Hanger Cover' && styles.itemPackingPillTextActive,
                            ]}
                          >
                            Hanger
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.itemPackingPill,
                            currentPack === 'Fold & Pack' && styles.itemPackingPillFoldActive,
                          ]}
                          onPress={() =>
                            setItemPackings((prev) => ({ ...prev, [key]: 'Fold & Pack' }))
                          }
                        >
                          <Ionicons
                            name="cube-outline"
                            size={13}
                            color={currentPack === 'Fold & Pack' ? '#fff' : Colors.primary}
                          />
                          <Text
                            style={[
                              styles.itemPackingPillText,
                              currentPack === 'Fold & Pack' && styles.itemPackingPillTextActive,
                            ]}
                          >
                            Fold & Pack
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Live Split Summary */}
              {(() => {
                let hCount = 0;
                let fCount = 0;
                order.items.forEach((it, idx) => {
                  const p = itemPackings[it.itemId || String(idx)] || 'Hanger Cover';
                  if (p === 'Hanger Cover') hCount += it.quantity || 1;
                  else fCount += it.quantity || 1;
                });
                return (
                  <View style={styles.splitSummaryBanner}>
                    <Ionicons name="sparkles" size={16} color={Colors.primary} />
                    <Text style={styles.splitSummaryText}>
                      Tags to generate: <Text style={{ fontWeight: '900', color: Colors.primary }}>{hCount} on Hanger Cover</Text> • <Text style={{ fontWeight: '900', color: Colors.secondaryDark }}>{fCount} on Fold & Pack</Text> ({hCount + fCount} total tags)
                    </Text>
                  </View>
                );
              })()}

              <View style={{ marginTop: 16, gap: 10 }}>
                <Button
                  title="🏷️ Generate Garment Tag"
                  onPress={handleConfirmDifferentiation}
                  loading={loading}
                  size="md"
                />
                <Button
                  title="Cancel"
                  onPress={() => setShowDifferentiateModal(false)}
                  variant="secondary"
                  size="sm"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Assign Delivery Boy Modal */}
      <AssignDeliveryModal
        visible={showAssignModal}
        order={order}
        deliveryBoys={deliveryBoys}
        onClose={() => {
          setShowAssignModal(false);
          loadOrder();
        }}
        onAssign={async (orderId, boyId) => {
          await assignDeliveryBoy(orderId, boyId);
          await loadOrder();
        }}
      />

      {/* Super Admin Re-route Store Modal */}
      <Modal visible={showReassignStoreModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Re-route to Another Hub</Text>
              <TouchableOpacity onPress={() => setShowReassignStoreModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {stores.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.storeOption, order.storeId === s.id && styles.storeOptionActive]}
                  onPress={() => handleReassignStore(s.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeOptionName}>{s.name.replace('TumblePro - ', '')}</Text>
                    <Text style={styles.storeOptionPincodes}>Pincodes: {s.pincodes.join(', ')}</Text>
                  </View>
                  {order.storeId === s.id && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Interactive Payment Checkout Modal */}
      {order && (
        <PaymentModal
          visible={showPaymentModal}
          order={order}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={async (method) => {
            await updatePayment(order.id, 'Paid', method);
            await loadOrder();
          }}
        />
      )}

      {/* Edit Order Modal */}
      <EditOrderModal
        visible={showEditModal}
        order={order}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={showDeleteModal}
        order={order}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* Target Delivery Date Scheduler Modal */}
      <Modal visible={showDeliveryModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="calendar" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Set Target Delivery Date</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDeliveryModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Text style={styles.modalSub}>
                Commit a guaranteed delivery completion date for Order #{order.orderNumber} ({order.customerName}).
              </Text>

              {/* Quick Preset Buttons */}
              <Text style={styles.deliveryModalLabel}>Quick Turnaround Presets:</Text>
              <View style={styles.deliveryPresetsRow}>
                {[
                  { label: 'Tomorrow', days: 1 },
                  { label: 'In 2 Days', days: 2 },
                  { label: 'In 3 Days', days: 3 },
                  { label: 'In 5 Days (Spa)', days: 5 },
                ].map((preset) => {
                  const target = new Date(Date.now() + preset.days * 24 * 60 * 60 * 1000);
                  const yyyy = target.getFullYear();
                  const mm = String(target.getMonth() + 1).padStart(2, '0');
                  const dd = String(target.getDate()).padStart(2, '0');
                  const isoDate = `${yyyy}-${mm}-${dd}`;
                  const isSelected = targetDeliveryDate === isoDate;
                  return (
                    <TouchableOpacity
                      key={preset.label}
                      style={[styles.deliveryPresetPill, isSelected && styles.deliveryPresetPillActive]}
                      onPress={() => setTargetDeliveryDate(isoDate)}
                    >
                      <Text
                        style={[
                          styles.deliveryPresetText,
                          isSelected && styles.deliveryPresetTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Date Input */}
              <Text style={[styles.deliveryModalLabel, { marginTop: 14 }]}>
                Custom Target Delivery Date (YYYY-MM-DD):
              </Text>
              <TextInput
                style={styles.deliveryDateInput}
                value={targetDeliveryDate}
                onChangeText={setTargetDeliveryDate}
                placeholder="2026-10-21"
                placeholderTextColor={Colors.textMuted}
                // @ts-ignore
                type={Platform.OS === 'web' ? 'date' : undefined}
              />

              {/* Time Slot Selector */}
              <Text style={[styles.deliveryModalLabel, { marginTop: 14 }]}>
                Preferred Delivery Time Slot:
              </Text>
              <View style={styles.deliverySlotCol}>
                {[
                  'Morning (9 AM - 1 PM)',
                  'Afternoon (1 PM - 5 PM)',
                  'Evening (5 PM - 8 PM)',
                ].map((slot) => {
                  const isSelected = targetDeliverySlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.deliverySlotPill, isSelected && styles.deliverySlotPillActive]}
                      onPress={() => setTargetDeliverySlot(slot)}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={16}
                        color={isSelected ? Colors.primary : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.deliverySlotText,
                          isSelected && styles.deliverySlotTextActive,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ marginTop: 20, gap: 10 }}>
                <Button
                  title="💾 Save Delivery Commitment"
                  onPress={handleSaveDeliveryDate}
                  loading={loading}
                  size="md"
                />
                <Button
                  title="Cancel"
                  onPress={() => setShowDeliveryModal(false)}
                  variant="secondary"
                  size="sm"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Set Rates & Confirm Bill Modal */}
      <Modal visible={showSetRatesModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pricetag" size={20} color={Colors.primary} />
                <Text style={styles.modalTitle}>Set Garment Rates & Confirm Bill</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSetRatesModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Text style={styles.modalSub}>
                Enter unit price for each item in Order #{order.orderNumber} ({order.customerName}).
              </Text>

              {/* One-Click Auto-Fill Standard Rates */}
              <TouchableOpacity
                style={styles.modalAutoRateHeaderBtn}
                onPress={() => {
                  const updated: { [key: string]: number } = {};
                  (order.items || []).forEach((it, idx) => {
                    const key = it.itemId || String(idx);
                    const found = DEFAULT_PRICE_LIST.find(
                      (p) =>
                        p.id === it.itemId ||
                        p.name.toLowerCase() === it.itemName.toLowerCase()
                    );
                    let rate = 45;
                    if (found) {
                      if (
                        found.prices.shoe_cleaning &&
                        (order.serviceType === 'shoe_cleaning' ||
                          (found.category === 'Shoe & Furniture Spa' &&
                            found.subCategory === 'Footwear'))
                      ) {
                        rate = found.prices.shoe_cleaning;
                      } else if (
                        found.prices.sofa_cleaning &&
                        (order.serviceType === 'sofa_cleaning' ||
                          (found.category === 'Shoe & Furniture Spa' &&
                            found.subCategory === 'Upholstery'))
                      ) {
                        rate = found.prices.sofa_cleaning;
                      } else if (
                        found.prices.carpet_cleaning &&
                        (order.serviceType === 'carpet_cleaning' ||
                          found.category === 'Shoe & Furniture Spa')
                      ) {
                        rate = found.prices.carpet_cleaning;
                      } else {
                        const p = (found.prices as any)[order.serviceType];
                        rate =
                          typeof p === 'number' && p > 0
                            ? p
                            : found.prices.dry_clean ||
                              found.prices.wash_iron ||
                              found.prices.wash_fold ||
                              45;
                      }
                    }
                    updated[key] = rate;
                  });
                  setEditingRates(updated);
                }}
              >
                <Ionicons name="flash" size={15} color="#FFFFFF" />
                <Text style={styles.modalAutoRateHeaderText}>⚡ Auto-Fill Standard Rates from Catalog</Text>
              </TouchableOpacity>

              {/* Items List */}
              <View style={{ marginTop: 12, gap: 8 }}>
                {order.items.map((it, idx) => {
                  const key = it.itemId || String(idx);
                  const currentRate = editingRates[key] ?? it.unitPrice ?? 0;
                  const itemTotal = (it.quantity || 1) * currentRate;

                  return (
                    <View key={idx} style={styles.rateItemCard}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={styles.rateItemName}>{it.itemName}</Text>
                        <Text style={styles.rateItemQty}>
                          {it.quantity} pc{it.quantity > 1 ? 's' : ''}
                        </Text>
                      </View>

                      <View style={styles.rateInputWrap}>
                        <Text style={styles.rateRupee}>₹</Text>
                        <TextInput
                          style={styles.rateModalInput}
                          value={String(currentRate)}
                          onChangeText={(val) => {
                            const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
                            setEditingRates((prev) => ({ ...prev, [key]: parsed }));
                          }}
                          keyboardType="numeric"
                        />
                        <Text style={styles.rateLineTotal}>= ₹{itemTotal}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Calculated Total */}
              {(() => {
                const total = order.items.reduce((sum, it, idx) => {
                  const key = it.itemId || String(idx);
                  const r = editingRates[key] ?? it.unitPrice ?? 0;
                  return sum + (it.quantity || 1) * r;
                }, 0);

                return (
                  <View style={styles.modalTotalSummary}>
                    <Text style={styles.modalTotalSummaryLabel}>Total Bill Amount:</Text>
                    <Text style={styles.modalTotalSummaryVal}>₹{total.toLocaleString('en-IN')}</Text>
                  </View>
                );
              })()}

              <View style={{ marginTop: 18, gap: 10 }}>
                <Button
                  title="💾 Save & Confirm Bill Amount"
                  onPress={handleSaveRates}
                  loading={loading}
                  size="md"
                />
                <Button
                  title="Cancel"
                  onPress={() => setShowSetRatesModal(false)}
                  variant="secondary"
                  size="sm"
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Printable GST Tax Invoice Modal */}
      <InvoiceModal
        visible={showInvoiceModal}
        order={order}
        onClose={() => setShowInvoiceModal(false)}
      />

      {/* Floating Success Toast */}
      {toastMessage && (
        <View style={styles.floatingToast}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.floatingToastText}>{toastMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    gap: 8,
  },
  loadingText: { fontSize: 13, color: Colors.textMuted },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNum: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  orderDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  invoiceBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingToast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#16A34A',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 9999,
  },
  floatingToastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  scroll: { padding: 14, paddingBottom: 40 },
  webContainer: { maxWidth: 960, width: '100%', alignSelf: 'center' },
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 4,
  },
  statusBtns: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },

  // Stage 1 & 2 styles
  stageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  stageNumberBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stageNumberText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  hamperTagBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: 8,
  },
  hamperLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  hamperBagTagCode: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.primary,
  },
  hamperBagSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  hamperStatusBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  hamperStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  stageHelpText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },

  // Differentiation box
  pendingDifferentiationBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  pendingDiffTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  pendingDiffSub: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
    marginTop: 2,
  },
  differentiateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  differentiateActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  differentiatedBanner: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  differentiatedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  differentiatedSub: {
    fontSize: 11,
    color: '#047857',
    marginBottom: 6,
  },

  // Routing Details
  storeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  changeStoreBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeStoreText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  routingDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  routingLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  routingVal: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  routingValHighlight: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    maxWidth: 240,
    textAlign: 'right',
  },

  // Fleet Assignment
  assignLeadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  assignLeadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  assignedBoyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  boyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boyAvatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  assignedBoyName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  assignedBoyPhone: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  callBoyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unassignedPrompt: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  unassignedPromptText: {
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
  },

  // Customer Section
  custRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  custName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  custPhone: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  callCustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callCustText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressVal: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  notesVal: {
    fontSize: 11,
    color: Colors.primary,
    flex: 1,
  },

  // Items table
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceTypeName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  deliveryModeText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  itemsTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  paymentActions: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  payLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  payBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  modalSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  diffItemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  diffItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  diffItemName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  diffItemQty: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  diffPackingTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  diffPackingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  diffPackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  diffPackBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  diffPackText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  diffPackTextActive: {
    color: '#FFFFFF',
  },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  storeOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  storeOptionName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  storeOptionPincodes: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  openPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  openPaymentBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.success,
  },
  diffBatchBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  diffBatchText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  diffItemSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemPackingPillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  itemPackingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemPackingPillHangerActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  itemPackingPillFoldActive: {
    backgroundColor: Colors.secondaryDark,
    borderColor: Colors.secondaryDark,
  },
  itemPackingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  itemPackingPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  splitSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primarySubtle,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  splitSummaryText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
    lineHeight: 16,
  },

  // Delivery Schedule Commitment styles
  setDeliveryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  setDeliveryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  deliveryScheduleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryDateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  deliveryDateDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  viewInvoiceActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  viewInvoiceActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },

  // Delivery Modal styles
  deliveryModalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  deliveryPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  deliveryPresetPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliveryPresetPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  deliveryPresetText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  deliveryPresetTextActive: {
    color: '#FFFFFF',
  },
  deliveryDateInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  deliverySlotCol: {
    gap: 8,
  },
  deliverySlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  deliverySlotPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  deliverySlotText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  deliverySlotTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // Dispatch Prerequisites Checklist styles
  prereqBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 12,
  },
  prereqTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 8,
  },
  prereqChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  prereqChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  prereqChipOk: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  prereqChipWarn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F59E0B',
  },
  prereqChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  prereqChipTextOk: {
    color: '#166534',
  },
  prereqChipTextWarn: {
    color: '#B45309',
  },

  // Pricing Pending Banner in Bill card
  pricingPendingCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginVertical: 10,
  },
  pricingPendingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  pricingPendingSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  pricingPendingActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  autoRateActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  autoRateActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  manualRateActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  manualRateActionBtnText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  pricingConfirmedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginVertical: 8,
  },
  pricingConfirmedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  reEditRatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  reEditRatesText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },

  // Set Rates Modal styles
  modalAutoRateHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  modalAutoRateHeaderText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  rateItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rateItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  rateItemQty: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  rateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rateRupee: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  rateModalInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    minWidth: 60,
    textAlign: 'center',
  },
  rateLineTotal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    minWidth: 55,
    textAlign: 'right',
  },
  modalTotalSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  modalTotalSummaryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalTotalSummaryVal: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
});
