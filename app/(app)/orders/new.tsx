import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOrders, CreateOrderInput } from '../../../contexts/OrderContext';
import { useAuth } from '../../../contexts/AuthContext';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { OrderSuccessModal, ErrorBanner } from '../../../components/ui/OrderNotificationModal';
import { Colors } from '../../../constants/Colors';
import { SERVICE_TYPES, DELIVERY_MODES } from '../../../constants/Orders';
import { DEFAULT_PRICE_LIST, PriceItem, ITEM_CATEGORIES, ItemCategory } from '../../../constants/Pricing';
import { OrderItem, findNearestStore, Order } from '../../../utils/storage';

const OFFICIAL_STORE_PINS = [
  { pin: '700156', area: 'CC Block, Action Area 1', hub: '1. Newtown Store, CC Block' },
  { pin: '790102', area: 'Main Market, Seppa', hub: '2. Sepa Store, Itanagar' },
  { pin: '786125', area: 'Thana Chariali, Tinsukia', hub: '3. Tinsukhia Store, Assam' },
  { pin: '791110', area: 'E-Sector, Naharlagun', hub: '4. NaharLagun, Itanagar' },
];

interface SelectedItem {
  item: PriceItem;
  quantity: number;
}

export default function NewOrderScreen() {
  const { createOrder, stores } = useOrders();
  const { user, isStoreManager } = useAuth();

  // Customer Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState(
    isStoreManager && user?.storeId
      ? stores.find((s) => s.id === user.storeId)?.pincodes[0] || '700156'
      : '700156'
  );
  const [instructions, setInstructions] = useState('');
  const [bagCount, setBagCount] = useState(1);

  // GPS Live Location State
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatusMsg, setGeoStatusMsg] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Service & Delivery
  const [serviceType, setServiceType] = useState('wash_fold');
  const [deliveryMode, setDeliveryMode] = useState('pickup_delivery');
  const [packingType, setPackingType] = useState<'Hanger Cover' | 'Fold & Pack'>('Hanger Cover');

  // Items State (Pre-selected default sample items)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([
    { item: DEFAULT_PRICE_LIST[0], quantity: 2 }, // Formal Shirt
    { item: DEFAULT_PRICE_LIST[9], quantity: 3 }, // Men Vest (Undergarment)
    { item: DEFAULT_PRICE_LIST[10], quantity: 3 }, // Briefs/Boxers (Undergarment)
  ]);

  // Catalog item search & filter
  const [activeCategory, setActiveCategory] = useState<ItemCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCatalog, setShowCatalog] = useState(true);

  // Notifications & Form Validation
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  // Live Auto-Route preview
  const routingPreview = useMemo(() => {
    return findNearestStore(stores, pincode, address, geoCoords ?? undefined);
  }, [stores, pincode, address, geoCoords]);

  // Filter catalog items
  const filteredCatalog = useMemo(() => {
    return DEFAULT_PRICE_LIST.filter((item) => {
      const matchCat = activeCategory === 'All' || item.category === activeCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  function getPrice(item: PriceItem) {
    if (
      item.prices.shoe_cleaning &&
      (serviceType === 'shoe_cleaning' ||
        (item.category === 'Shoe & Furniture Spa' && item.subCategory === 'Footwear'))
    ) {
      return item.prices.shoe_cleaning;
    }
    if (
      item.prices.sofa_cleaning &&
      (serviceType === 'sofa_cleaning' ||
        (item.category === 'Shoe & Furniture Spa' && item.subCategory === 'Upholstery'))
    ) {
      return item.prices.sofa_cleaning;
    }
    if (
      item.prices.carpet_cleaning &&
      (serviceType === 'carpet_cleaning' || item.category === 'Shoe & Furniture Spa')
    ) {
      return item.prices.carpet_cleaning;
    }
    const p = (item.prices as any)[serviceType];
    if (typeof p === 'number' && p > 0) return p;
    return item.prices.dry_clean || item.prices.wash_iron || item.prices.wash_fold || 50;
  }

  function addItem(item: PriceItem) {
    setSelectedItems((prev) => {
      const existing = prev.find((s) => s.item.id === item.id);
      if (existing) {
        return prev.map((s) =>
          s.item.id === item.id ? { ...s, quantity: s.quantity + 1 } : s
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
    setErrorMessage(null);
  }

  function updateQty(itemId: string, delta: number) {
    setSelectedItems((prev) =>
      prev
        .map((s) => (s.item.id === itemId ? { ...s, quantity: s.quantity + delta } : s))
        .filter((s) => s.quantity > 0)
    );
  }

  function getItemQty(itemId: string): number {
    return selectedItems.find((s) => s.item.id === itemId)?.quantity || 0;
  }

  const totalAmount = selectedItems.reduce(
    (sum, s) => sum + s.quantity * getPrice(s.item),
    0
  );

  const totalItemCount = selectedItems.reduce((sum, s) => sum + s.quantity, 0);

  // Live GPS Geolocation
  const handleDetectGPS = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatusMsg('Geolocation not supported by browser.');
      return;
    }
    setGeoLoading(true);
    setGeoStatusMsg('Detecting GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setGeoCoords(coords);
        const routing = findNearestStore(stores, '', '', coords);
        setPincode(routing.store.pincodes[0]);
        setAddress(`GPS Location (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}) - near ${routing.store.areas[0]}`);
        setGeoStatusMsg(`📍 Live GPS: Nearest is ${routing.store.name.replace('TumblePro - ', '')} (${routing.distanceKm ?? 'nearby'} km away)`);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoStatusMsg('Could not detect GPS. Please pick a store pin below.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  async function handleSubmit() {
    setErrorMessage(null);
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors({ name: true });
      const msg = 'Please enter Customer Full Name at the top of the form.';
      setErrorMessage(msg);
      setToastMessage({ type: 'error', text: msg });
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!phone.trim()) {
      setFieldErrors({ phone: true });
      const msg = 'Please enter Customer Phone Number.';
      setErrorMessage(msg);
      setToastMessage({ type: 'error', text: msg });
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (!pincode.trim() || pincode.trim().length < 5) {
      setFieldErrors({ pincode: true });
      const msg = 'Please provide a valid 6-digit delivery pincode.';
      setErrorMessage(msg);
      setToastMessage({ type: 'error', text: msg });
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    if (selectedItems.length === 0) {
      const msg = 'Please select at least one garment or undergarment to place an order.';
      setErrorMessage(msg);
      setToastMessage({ type: 'error', text: msg });
      return;
    }

    setLoading(true);
    const items: OrderItem[] = selectedItems.map((s) => ({
      itemId: s.item.id,
      itemName: s.item.name,
      quantity: s.quantity,
      unitPrice: getPrice(s.item),
    }));

    const input: CreateOrderInput = {
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerAddress: address.trim(),
      pincode: pincode.trim(),
      serviceType,
      deliveryMode,
      packingType,
      items,
      bagCount,
      coords: geoCoords ?? undefined,
      specialInstructions: instructions.trim(),
      pickupDate: 'Today, ASAP',
      deliveryDate: 'Tomorrow, Evening',
      explicitStoreId: isStoreManager ? user?.storeId : undefined,
    };

    try {
      const order = await createOrder(input);
      setCreatedOrder(order);
      setToastMessage({
        type: 'success',
        text: `Order #${order.orderNumber} successfully placed & auto-routed!`,
      });
    } catch (err: any) {
      console.error('Failed to create order:', err);
      const msg = err?.message || 'Failed to create order due to a system error. Please retry.';
      setErrorMessage(msg);
      setToastMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  }

  const fillSampleCustomer = () => {
    setName('Mrs. Prerna Nath');
    setPhone('+91 98301 99221');
    setAddress('Flat 402, CC Block, Action Area 1');
    setPincode('700156');
    setFieldErrors({});
    setErrorMessage(null);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setSelectedItems([
      { item: DEFAULT_PRICE_LIST[0], quantity: 2 },
      { item: DEFAULT_PRICE_LIST[9], quantity: 2 },
    ]);
    setInstructions('');
    setCreatedOrder(null);
    setErrorMessage(null);
    setFieldErrors({});
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.webContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.headerTitle}>New Store Lead & Order</Text>
              <Text style={styles.headerSub}>
                {isStoreManager ? user?.storeName : 'Multi-Store Automatic Pincode & GPS Routing'}
              </Text>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Visual Error Banner */}
            <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />

            {/* Real-Time Pincode & GPS Routing Preview */}
            <View style={styles.routingPreviewBox}>
              <View style={styles.routingTop}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="git-branch" size={16} color={Colors.primary} />
                  <Text style={styles.routingTitle}>NEAREST HUB AUTO-DETECTION</Text>
                </View>
                <TouchableOpacity
                  style={styles.gpsSmallBtn}
                  onPress={handleDetectGPS}
                  disabled={geoLoading}
                >
                  {geoLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="locate" size={12} color="#FFFFFF" />
                      <Text style={styles.gpsSmallBtnText}>Live GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {geoStatusMsg && (
                <View style={styles.geoMsgPill}>
                  <Text style={styles.geoMsgText}>{geoStatusMsg}</Text>
                </View>
              )}

              <Text style={styles.routingTarget}>{routingPreview.store.name.replace('TumblePro - ', '')}</Text>
              <Text style={styles.routingReason}>{routingPreview.reason}</Text>
            </View>

            {/* Customer Details Section */}
            <View style={styles.card}>
              <View style={styles.sectionTitleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <Ionicons name="person-outline" size={16} color={Colors.primary} />
                  <Text style={styles.sectionTitleText}>Customer & Doorstep Pickup Bag</Text>
                </View>
                <TouchableOpacity
                  style={styles.autofillBtn}
                  onPress={fillSampleCustomer}
                >
                  <Ionicons name="flash" size={12} color={Colors.primary} />
                  <Text style={styles.autofillBtnText}>⚡ Fill Sample</Text>
                </TouchableOpacity>
              </View>

              <Input
                label="Customer Full Name *"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: false }));
                  setErrorMessage(null);
                }}
                placeholder="e.g. Mrs. Prerna Nath"
              />
              {fieldErrors.name && (
                <Text style={styles.fieldErrorNotice}>⚠️ Customer Full Name is required</Text>
              )}

              <Input
                label="Customer Phone *"
                value={phone}
                onChangeText={(t) => {
                  setPhone(t);
                  if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: false }));
                  setErrorMessage(null);
                }}
                placeholder="e.g. +91 98301 99221"
                keyboardType="phone-pad"
              />
              {fieldErrors.phone && (
                <Text style={styles.fieldErrorNotice}>⚠️ Customer Phone Number is required</Text>
              )}

              {/* 4 Official Store Pincode Quick Chips */}
              <View style={styles.pincodeChipsRow}>
                {OFFICIAL_STORE_PINS.map((p) => {
                  const isSelected = pincode === p.pin;
                  return (
                    <TouchableOpacity
                      key={p.pin}
                      style={[styles.pinChip, isSelected && styles.pinChipActive]}
                      onPress={() => {
                        setPincode(p.pin);
                        setAddress(`Flat 402, ${p.area}`);
                        setGeoCoords(null);
                        setGeoStatusMsg(`Selected hub: ${p.hub}`);
                      }}
                    >
                      <Text style={[styles.pinChipText, isSelected && styles.pinChipTextActive]}>
                        PIN {p.pin} • {p.area}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Input
                label="Delivery Pincode *"
                value={pincode}
                onChangeText={(t) => {
                  setPincode(t);
                  setGeoCoords(null);
                }}
                placeholder="e.g. 700156"
                keyboardType="numeric"
              />
              <Input
                label="Customer Address & Locality"
                value={address}
                onChangeText={setAddress}
                placeholder="Building, Road, Landmark, Locality"
                multiline
              />

              {/* Stage 1: Doorstep Pickup Bag Counter */}
              <View style={styles.bagCounterBox}>
                <View>
                  <Text style={styles.bagCounterTitle}>Doorstep Pickup Bags</Text>
                  <Text style={styles.bagCounterSub}>
                    Stage 1: All clothes kept in one pickup bag per customer
                  </Text>
                </View>
                <View style={styles.counterRow}>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setBagCount(Math.max(1, bagCount - 1))}
                  >
                    <Text style={styles.counterBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{bagCount}</Text>
                  <TouchableOpacity
                    style={styles.counterBtn}
                    onPress={() => setBagCount(bagCount + 1)}
                  >
                    <Text style={styles.counterBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Service & Delivery Mode */}
            <View style={styles.card}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles-outline" size={16} color={Colors.primary} />
                <Text style={styles.sectionTitleText}>Service & Delivery Mode</Text>
              </View>

              <View style={styles.cardRow}>
                {DELIVERY_MODES.map((mode) => (
                  <TouchableOpacity
                    key={mode.id}
                    style={[styles.modeCard, deliveryMode === mode.id && styles.modeCardActive]}
                    onPress={() => setDeliveryMode(mode.id)}
                  >
                    <Text style={styles.modeIcon}>{mode.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.modeLabel, deliveryMode === mode.id && styles.modeLabelActive]}>
                        {mode.label || (mode as any).name}
                      </Text>
                      <Text style={styles.modeSub}>{mode.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.serviceGroupLabel}>1. Core Clothes Care (Select Primary Service):</Text>
              <View style={styles.serviceGrid}>
                {[
                  { id: 'wash_iron', label: 'Wash & Steam Iron', icon: '👔', desc: 'Washed & steam pressed • Most Popular' },
                  { id: 'wash_fold', label: 'Wash & Fold', icon: '🫧', desc: 'Washed, dried & folded' },
                  { id: 'dry_clean', label: 'Dry Clean', icon: '✨', desc: 'Suits, blazers & delicate fabrics' },
                ].map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      serviceType === service.id && styles.serviceCardActive,
                    ]}
                    onPress={() => setServiceType(service.id)}
                  >
                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.serviceLabel,
                          serviceType === service.id && styles.serviceLabelActive,
                        ]}
                      >
                        {service.label}
                      </Text>
                      <Text style={styles.serviceSub}>{service.desc}</Text>
                    </View>
                    {serviceType === service.id && (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Specialty Spa & Cleaning Add-ons */}
              <View style={styles.specialtyBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="sparkles" size={15} color={Colors.primary} />
                  <Text style={styles.specialtyTitle}>Specialty Spa Add-ons (Can combine in this order):</Text>
                </View>
                <Text style={styles.specialtySub}>
                  No separate order needed! Add shoe spa or sofa cleaning directly along with regular clothes:
                </Text>

                <View style={styles.specialtyChipsRow}>
                  {[
                    { cat: 'Shoe & Furniture Spa', label: '👟 Shoe Spa', srv: 'shoe_cleaning' },
                    { cat: 'Shoe & Furniture Spa', label: '🛋️ Sofa & Carpet Spa', srv: 'sofa_cleaning' },
                    { cat: 'Undergarments', label: '🩲 Undergarments', srv: serviceType },
                    { cat: 'All', label: '🔥 Steam Iron Only', srv: 'iron_only' },
                  ].map((s, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.specialtyChipBtn,
                        (serviceType === s.srv || activeCategory === s.cat) && styles.specialtyChipBtnActive,
                      ]}
                      onPress={() => {
                        setServiceType(s.srv);
                        if (s.cat !== 'All') {
                          setActiveCategory(s.cat as any);
                          setShowCatalog(true);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.specialtyChipBtnText,
                          (serviceType === s.srv || activeCategory === s.cat) && styles.specialtyChipBtnTextActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Finishing & Packaging Style */}
              <View style={styles.packingSection}>
                <Text style={styles.packingTitle}>Tag Packing Style:</Text>
                <View style={styles.packingRow}>
                  <TouchableOpacity
                    style={[
                      styles.packOptionBtn,
                      packingType === 'Hanger Cover' && styles.packOptionBtnActive,
                    ]}
                    onPress={() => setPackingType('Hanger Cover')}
                  >
                    <Ionicons
                      name="shirt-outline"
                      size={16}
                      color={packingType === 'Hanger Cover' ? '#FFFFFF' : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.packOptionText,
                        packingType === 'Hanger Cover' && styles.packOptionTextActive,
                      ]}
                    >
                      Hanger Cover
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.packOptionBtn,
                      packingType === 'Fold & Pack' && styles.packOptionBtnActive,
                    ]}
                    onPress={() => setPackingType('Fold & Pack')}
                  >
                    <Ionicons
                      name="cube-outline"
                      size={16}
                      color={packingType === 'Fold & Pack' ? '#FFFFFF' : Colors.primary}
                    />
                    <Text
                      style={[
                        styles.packOptionText,
                        packingType === 'Fold & Pack' && styles.packOptionTextActive,
                      ]}
                    >
                      Fold & Pack
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Selected Laundry Items */}
            <View style={styles.card}>
              <View style={styles.cartHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="basket-outline" size={16} color={Colors.primary} />
                  <Text style={styles.sectionTitleText}>
                    Selected Clothes ({totalItemCount} pcs)
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.toggleCatalogBtn}
                  onPress={() => setShowCatalog(!showCatalog)}
                >
                  <Ionicons
                    name={showCatalog ? 'chevron-up' : 'add-circle-outline'}
                    size={14}
                    color={Colors.primary}
                  />
                  <Text style={styles.toggleCatalogText}>
                    {showCatalog ? 'Hide Catalog' : '+ Add More Items'}
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedItems.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Text style={styles.emptyCartText}>No clothes selected yet. Pick items from catalog below.</Text>
                </View>
              ) : (
                selectedItems.map((s) => (
                  <View key={s.item.id} style={styles.selectedItemRow}>
                    <Text style={styles.itemIcon}>{s.item.icon || '👕'}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{s.item.name}</Text>
                      <Text style={styles.itemCategoryBadge}>
                        {s.item.category} • ₹{getPrice(s.item)} / pc
                      </Text>
                    </View>
                    <View style={styles.qtyControls}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQty(s.item.id, -1)}
                      >
                        <Ionicons name="remove" size={14} color={Colors.textPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{s.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQty(s.item.id, 1)}
                      >
                        <Ionicons name="add" size={14} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.itemTotal}>₹{s.quantity * getPrice(s.item)}</Text>
                  </View>
                ))
              )}

              {/* Item Catalog Grid */}
              {showCatalog && (
                <View style={{ marginTop: 14 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryScroll}
                  >
                    {ITEM_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoryChip,
                          activeCategory === cat && styles.categoryChipActive,
                        ]}
                        onPress={() => setActiveCategory(cat)}
                      >
                        <Text
                          style={[
                            styles.categoryChipText,
                            activeCategory === cat && styles.categoryChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.itemSearchWrap}>
                    <Ionicons name="search-outline" size={14} color={Colors.textMuted} />
                    <TextInput
                      style={styles.itemSearchInput}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      placeholder="Search vest, briefs, saree, suit, towel..."
                      placeholderTextColor={Colors.textMuted}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={14} color={Colors.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.catalogGrid}>
                    {filteredCatalog.map((item) => {
                      const qty = getItemQty(item.id);
                      return (
                        <View
                          key={item.id}
                          style={[styles.catalogCard, qty > 0 && styles.catalogCardActive]}
                        >
                          <View style={styles.catalogCardTop}>
                            <Text style={styles.catalogIcon}>{item.icon || '👕'}</Text>
                            <Text style={styles.catalogPrice}>₹{getPrice(item)}</Text>
                          </View>
                          <Text style={styles.catalogName} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={styles.catalogSubCat}>
                            {item.subCategory || item.category}
                          </Text>
                          <View style={styles.catalogQtyRow}>
                            <TouchableOpacity
                              style={styles.catalogMiniBtn}
                              onPress={() => updateQty(item.id, -1)}
                              disabled={qty === 0}
                            >
                              <Text
                                style={[
                                  styles.catalogMiniBtnText,
                                  qty === 0 && { opacity: 0.3 },
                                ]}
                              >
                                −
                              </Text>
                            </TouchableOpacity>
                            <Text style={styles.catalogQtyText}>{qty}</Text>
                            <TouchableOpacity
                              style={styles.catalogMiniBtn}
                              onPress={() => addItem(item)}
                            >
                              <Text style={styles.catalogMiniBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Special Instructions */}
            <View style={styles.card}>
              <Input
                label="Special Laundry & Delivery Instructions"
                value={instructions}
                onChangeText={setInstructions}
                placeholder="e.g. Handle silk sarees with care, starch shirts"
                multiline
              />
            </View>

            {/* Total Bill & Submit */}
            <View style={styles.bottomBar}>
              {errorMessage && (
                <View style={styles.bottomErrorAlert}>
                  <Ionicons name="alert-circle" size={20} color="#DC2626" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bottomErrorAlertTitle}>Action Required</Text>
                    <Text style={styles.bottomErrorAlertText}>{errorMessage}</Text>
                  </View>
                </View>
              )}
              <View style={styles.bottomBarInner}>
                <View>
                  <Text style={styles.totalLabel}>Total Est. Bill ({totalItemCount} pcs)</Text>
                  <Text style={styles.totalAmount}>₹{totalAmount.toLocaleString('en-IN')}</Text>
                </View>
                <Button
                  title={loading ? 'Routing Order...' : 'Create Order & Assign'}
                  onPress={handleSubmit}
                  loading={loading}
                  size="md"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <View
          style={[
            styles.floatingToast,
            toastMessage.type === 'error' ? styles.toastError : styles.toastSuccess,
          ]}
        >
          <Ionicons
            name={toastMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'}
            size={22}
            color="#FFFFFF"
          />
          <Text style={styles.floatingToastText}>{toastMessage.text}</Text>
          <TouchableOpacity onPress={() => setToastMessage(null)} style={{ padding: 4 }}>
            <Ionicons name="close" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Visual Success Modal */}
      <OrderSuccessModal
        visible={!!createdOrder}
        order={createdOrder}
        onClose={() => {
          setCreatedOrder(null);
          router.replace('/(app)/orders');
        }}
        onNewOrder={resetForm}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  webContainer: { maxWidth: 960, width: '100%', alignSelf: 'center', flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  headerSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  scroll: { padding: 14, paddingBottom: 40 },
  routingPreviewBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    marginBottom: 12,
  },
  routingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  routingTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  gpsSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpsSmallBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  geoMsgPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  geoMsgText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
  },
  routingTarget: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
  },
  routingReason: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  autofillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  autofillBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  pincodeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  pinChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pinChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  pinChipText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pinChipTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  bagCounterBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  bagCounterTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F2C59',
  },
  bagCounterSub: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  counterBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  counterBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  counterVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F2C59',
    minWidth: 22,
    textAlign: 'center',
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  modeCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  modeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  modeIcon: { fontSize: 22 },
  modeLabel: { fontSize: 14, fontWeight: '800', color: '#0F2C59' },
  modeLabelActive: { color: Colors.primary, fontWeight: '900' },
  modeSub: { fontSize: 11, color: '#475569', fontWeight: '600', marginTop: 2 },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  serviceCard: {
    flex: 1,
    minWidth: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  serviceCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  serviceIcon: { fontSize: 22 },
  serviceLabel: { fontSize: 14, fontWeight: '800', color: '#0F2C59' },
  serviceLabelActive: { color: Colors.primary, fontWeight: '900' },
  serviceSub: { fontSize: 11, color: '#475569', fontWeight: '600', marginTop: 2 },
  serviceGroupLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C59',
    marginTop: 12,
    marginBottom: 8,
  },
  specialtyBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  specialtyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  specialtySub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  specialtyChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  specialtyChipBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  specialtyChipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  specialtyChipBtnTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  packingSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  packingTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  packingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  packOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  packOptionBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  packOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  packOptionTextActive: {
    color: '#FFFFFF',
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  toggleCatalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
  },
  toggleCatalogText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyCartBox: {
    padding: 16,
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  selectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  itemIcon: { fontSize: 24, marginRight: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '800', color: '#0F2C59' },
  itemCategoryBadge: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  qtyText: { fontSize: 15, fontWeight: '900', color: '#0F2C59', minWidth: 22, textAlign: 'center' },
  itemTotal: { fontSize: 16, fontWeight: '900', color: '#0F2C59', minWidth: 50, textAlign: 'right' },
  categoryScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  categoryChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  itemSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginVertical: 10,
  },
  itemSearchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  catalogGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catalogCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  catalogCardActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  catalogCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catalogIcon: { fontSize: 22 },
  catalogPrice: { fontSize: 14, fontWeight: '900', color: Colors.success },
  catalogName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2C59',
    marginTop: 6,
  },
  catalogSubCat: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginBottom: 8,
  },
  catalogQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  catalogMiniBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catalogMiniBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F2C59',
  },
  catalogQtyText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F2C59',
  },
  bottomBar: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  totalLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F2C59',
  },
  bottomErrorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#DC2626',
    width: '100%',
  },
  bottomErrorAlertTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#B91C1C',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  bottomErrorAlertText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7F1D1D',
    marginTop: 1,
  },
  fieldErrorNotice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 4,
  },
  floatingToast: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    maxWidth: 500,
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
    zIndex: 9999,
  },
  toastError: {
    backgroundColor: '#DC2626',
  },
  toastSuccess: {
    backgroundColor: '#16A34A',
  },
  floatingToastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
});
