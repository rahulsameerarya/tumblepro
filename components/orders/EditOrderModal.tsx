import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { SERVICE_TYPES, DELIVERY_MODES } from '../../constants/Orders';
import { DEFAULT_PRICE_LIST, PriceItem } from '../../constants/Pricing';
import { Order, OrderItem } from '../../utils/storage';

interface EditOrderModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onSave: (updatedFields: Partial<Order>) => Promise<void>;
}

export default function EditOrderModal({
  visible,
  order,
  onClose,
  onSave,
}: EditOrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [serviceType, setServiceType] = useState('wash_fold');
  const [deliveryMode, setDeliveryMode] = useState('pickup_delivery');
  const [packingType, setPackingType] = useState<'Hanger Cover' | 'Fold & Pack'>('Hanger Cover');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  useEffect(() => {
    if (order && visible) {
      setCustomerName(order.customerName || '');
      setCustomerPhone(order.customerPhone || '');
      setCustomerAddress(order.customerAddress || '');
      setPincode(order.pincode || '');
      setServiceType(order.serviceType || 'wash_fold');
      setDeliveryMode(order.deliveryMode || 'pickup_delivery');
      setPackingType(order.packingType || 'Hanger Cover');
      setSpecialInstructions(order.specialInstructions || '');
      setItems(order.items ? JSON.parse(JSON.stringify(order.items)) : []);
      setErrorMsg(null);
      setShowCatalog(false);
    }
  }, [order, visible]);

  const totalPieces = items.reduce((s, it) => s + (it.quantity || 1), 0);
  const totalAmount = items.reduce((s, it) => s + (it.quantity || 1) * (it.unitPrice || 0), 0);

  const updateItemQty = (index: number, delta: number) => {
    setItems((prev) => {
      const next = [...prev];
      const newQty = (next[index].quantity || 1) + delta;
      if (newQty <= 0) {
        return next.filter((_, i) => i !== index);
      }
      next[index] = { ...next[index], quantity: newQty };
      return next;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], unitPrice: Math.max(0, newPrice) };
      return next;
    });
  };

  const autoApplyStandardRates = () => {
    setItems((prev) =>
      prev.map((it) => {
        const found = DEFAULT_PRICE_LIST.find(
          (p) => p.id === it.itemId || p.name.toLowerCase() === it.itemName.toLowerCase()
        );
        let rate = 45;
        if (found) {
          if (found.prices.shoe_cleaning && (serviceType === 'shoe_cleaning' || (found.category === 'Shoe & Furniture Spa' && found.subCategory === 'Footwear'))) {
            rate = found.prices.shoe_cleaning;
          } else if (found.prices.sofa_cleaning && (serviceType === 'sofa_cleaning' || (found.category === 'Shoe & Furniture Spa' && found.subCategory === 'Upholstery'))) {
            rate = found.prices.sofa_cleaning;
          } else if (found.prices.carpet_cleaning && (serviceType === 'carpet_cleaning' || found.category === 'Shoe & Furniture Spa')) {
            rate = found.prices.carpet_cleaning;
          } else {
            const p = (found.prices as any)[serviceType];
            rate = typeof p === 'number' && p > 0 ? p : (found.prices.dry_clean || found.prices.wash_iron || found.prices.wash_fold || 45);
          }
        }
        return { ...it, unitPrice: rate };
      })
    );
  };

  const addItemFromCatalog = (priceItem: PriceItem) => {
    const existingIdx = items.findIndex((it) => it.itemId === priceItem.id);
    const unitPrice = priceItem.prices[serviceType as keyof typeof priceItem.prices] || 30;

    if (existingIdx >= 0) {
      updateItemQty(existingIdx, 1);
    } else {
      setItems((prev) => [
        ...prev,
        {
          itemId: priceItem.id,
          itemName: priceItem.name,
          quantity: 1,
          unitPrice,
          packingType,
        },
      ]);
    }
  };

  const handleSave = async () => {
    if (!customerName.trim()) {
      setErrorMsg('Customer name is required.');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMsg('Customer phone is required.');
      return;
    }
    if (items.length === 0) {
      setErrorMsg('Order must contain at least one item.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        pincode: pincode.trim(),
        serviceType,
        deliveryMode,
        packingType,
        specialInstructions: specialInstructions.trim(),
        items,
        totalAmount,
      });
      onClose();
    } catch {
      setErrorMsg('Failed to save order changes.');
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="create-outline" size={22} color={Colors.primary} />
              <View>
                <Text style={styles.title}>Edit Order #{order.orderNumber}</Text>
                <Text style={styles.subtitle}>Update customer details, items, service & instructions</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {errorMsg && (
              <View style={styles.errorAlert}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorAlertText}>{errorMsg}</Text>
              </View>
            )}

            {/* Section 1: Customer Info */}
            <Text style={styles.sectionTitle}>Customer Information</Text>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={customerName}
                onChangeText={(t) => { setCustomerName(t); setErrorMsg(null); }}
                placeholder="Customer Full Name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Phone Number *</Text>
                <TextInput
                  style={styles.input}
                  value={customerPhone}
                  onChangeText={(t) => { setCustomerPhone(t); setErrorMsg(null); }}
                  placeholder="Phone Number"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={[styles.formGroup, { width: 130 }]}>
                <Text style={styles.label}>Pincode</Text>
                <TextInput
                  style={styles.input}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="6-digit PIN"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Delivery Address & Locality</Text>
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                value={customerAddress}
                onChangeText={setCustomerAddress}
                placeholder="House / Flat No, Street, Locality"
                placeholderTextColor={Colors.textMuted}
                multiline
              />
            </View>

            {/* Section 2: Service & Delivery */}
            <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Service & Delivery</Text>
            <View style={styles.chipGrid}>
              {SERVICE_TYPES.map((s) => {
                const isSel = serviceType === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.serviceChip, isSel && styles.serviceChipActive]}
                    onPress={() => setServiceType(s.id)}
                  >
                    <Text style={styles.serviceChipIcon}>{s.icon}</Text>
                    <Text style={[styles.serviceChipText, isSel && styles.serviceChipTextActive]}>
                      {s.label || s.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={[styles.chipGrid, { marginTop: 8 }]}>
              {DELIVERY_MODES.map((m) => {
                const isSel = deliveryMode === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.modeChip, isSel && styles.modeChipActive]}
                    onPress={() => setDeliveryMode(m.id)}
                  >
                    <Text style={styles.modeChipIcon}>{m.icon}</Text>
                    <Text style={[styles.modeChipText, isSel && styles.modeChipTextActive]}>
                      {m.label || m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Packing Type */}
            <View style={styles.packingRow}>
              <Text style={styles.label}>Default Packing:</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.packToggle, packingType === 'Hanger Cover' && styles.packToggleActive]}
                  onPress={() => setPackingType('Hanger Cover')}
                >
                  <Text style={[styles.packToggleText, packingType === 'Hanger Cover' && styles.packToggleTextActive]}>
                    🧥 Hanger Cover
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.packToggle, packingType === 'Fold & Pack' && styles.packToggleActive]}
                  onPress={() => setPackingType('Fold & Pack')}
                >
                  <Text style={[styles.packToggleText, packingType === 'Fold & Pack' && styles.packToggleTextActive]}>
                    📦 Fold & Pack
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Section 3: Clothes in Order */}
            <View style={styles.itemsHeaderRow}>
              <Text style={styles.sectionTitle}>
                Clothes In Order ({totalPieces} pcs • ₹{totalAmount})
              </Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={styles.autoRateBtn}
                  onPress={autoApplyStandardRates}
                >
                  <Ionicons name="flash" size={13} color="#FFFFFF" />
                  <Text style={styles.autoRateBtnText}>Standard Rates</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={() => setShowCatalog(!showCatalog)}
                >
                  <Ionicons name={showCatalog ? 'chevron-up' : 'add-circle-outline'} size={15} color={Colors.primary} />
                  <Text style={styles.addMoreBtnText}>{showCatalog ? 'Close' : '+ Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Current Items List */}
            {items.map((it, idx) => (
              <View key={it.itemId || idx} style={styles.itemRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.itemRowName}>{it.itemName}</Text>
                  <View style={styles.itemPriceInputRow}>
                    <Text style={styles.rupeePrefix}>₹</Text>
                    <TextInput
                      style={styles.rateInput}
                      value={String(it.unitPrice ?? 0)}
                      onChangeText={(val) => {
                        const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
                        updateItemPrice(idx, parsed);
                      }}
                      keyboardType="numeric"
                    />
                    <Text style={styles.itemRowSub}>/ pc = ₹{(it.quantity || 1) * (it.unitPrice || 0)}</Text>
                  </View>
                </View>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.miniQtyBtn} onPress={() => updateItemQty(idx, -1)}>
                    <Text style={styles.miniQtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{it.quantity || 1}</Text>
                  <TouchableOpacity style={styles.miniQtyBtn} onPress={() => updateItemQty(idx, 1)}>
                    <Text style={styles.miniQtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(idx)}>
                    <Ionicons name="trash-outline" size={16} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Catalog Quick Picker */}
            {showCatalog && (
              <View style={styles.catalogBox}>
                <Text style={styles.catalogTitle}>Tap to add garments to order:</Text>
                <View style={styles.catalogChips}>
                  {DEFAULT_PRICE_LIST.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.catalogChip}
                      onPress={() => addItemFromCatalog(p)}
                    >
                      <Text style={styles.catalogChipIcon}>{p.icon || '👕'}</Text>
                      <Text style={styles.catalogChipText}>{p.name}</Text>
                      <Text style={styles.catalogChipPrice}>
                        +₹{p.prices[serviceType as keyof typeof p.prices] || 30}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Special Instructions */}
            <View style={[styles.formGroup, { marginTop: 12 }]}>
              <Text style={styles.label}>Special Laundry Instructions</Text>
              <TextInput
                style={[styles.input, { minHeight: 50, textAlignVertical: 'top' }]}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                placeholder="e.g. Starch shirts, handle silk sarees with care"
                placeholderTextColor={Colors.textMuted}
                multiline
              />
            </View>
          </ScrollView>

          {/* Footer Bar */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.footerTotalLabel}>Updated Total ({totalPieces} pcs)</Text>
              <Text style={styles.footerTotalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={loading}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    maxWidth: 600,
    maxHeight: '92%',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 18,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DC2626',
    marginBottom: 12,
  },
  errorAlertText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F2C59',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F2C59',
    fontWeight: '600',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  serviceChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  serviceChipIcon: { fontSize: 16 },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  serviceChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  modeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  modeChipIcon: { fontSize: 16 },
  modeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modeChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  packingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  packToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  packToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  packToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  packToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  itemsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  addMoreBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  autoRateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0F2C59',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autoRateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  itemPriceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rupeePrefix: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C59',
  },
  rateInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C59',
    minWidth: 50,
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemRowName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2C59',
  },
  itemRowSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniQtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  miniQtyBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F2C59',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F2C59',
    minWidth: 18,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 5,
    marginLeft: 6,
  },
  catalogBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  catalogTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 8,
  },
  catalogChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxHeight: 150,
  },
  catalogChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  catalogChipIcon: { fontSize: 14 },
  catalogChipText: { fontSize: 11, fontWeight: '700', color: '#0F2C59' },
  catalogChipPrice: { fontSize: 11, fontWeight: '800', color: Colors.success },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerTotalLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  footerTotalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F2C59',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
