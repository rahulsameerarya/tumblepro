import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/OrderNotificationModal';
import { Colors } from '../../constants/Colors';
import { SERVICE_TYPES } from '../../constants/Orders';
import { DEFAULT_PRICE_LIST, PriceItem, ITEM_CATEGORIES, ItemCategory } from '../../constants/Pricing';
import { findNearestStore, Order } from '../../utils/storage';

// 4 Official TumblePro Store Hub Locations
const OFFICIAL_STORE_HUBS = [
  {
    name: '1. Newtown Store, CC Block',
    pin: '700156',
    flat: 'Flat 304, Sunshine Towers',
    area: 'CC Block, Action Area 1',
    landmark: 'Near Axis Mall',
    city: 'Kolkata',
    state: 'West Bengal',
  },
  {
    name: '2. Sepa Store, Itanagar',
    pin: '790102',
    flat: 'House 12, Valley View',
    area: 'Main Seppa Bazaar',
    landmark: 'Near SBI Bank',
    city: 'Seppa',
    state: 'Arunachal Pradesh',
  },
  {
    name: '3. Tinsukhia Store, Assam',
    pin: '786125',
    flat: 'Quarter 4B, Railway Colony',
    area: 'AT Road, Thana Chariali',
    landmark: 'Near Thana Chariali',
    city: 'Tinsukia',
    state: 'Assam',
  },
  {
    name: '4. NaharLagun, Itanagar',
    pin: '791110',
    flat: 'Flat 201, River View',
    area: 'E-Sector, Daily Market',
    landmark: 'Near Daily Market',
    city: 'Naharlagun',
    state: 'Arunachal Pradesh',
  },
];

const INDIAN_STATES = [
  'West Bengal',
  'Arunachal Pradesh',
  'Assam',
  'Delhi',
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Uttar Pradesh',
  'Bihar',
  'Meghalaya',
  'Nagaland',
  'Manipur',
  'Mizoram',
  'Tripura',
  'Sikkim',
  'Other',
];

export default function CustomerPortalScreen() {
  const { stores, createOrder } = useOrders();
  const { switchAccount, presetUsers } = useAuth();

  // Structured Address Form State (matching Image 1 exactly)
  const [country, setCountry] = useState('India');
  const [fullName, setFullName] = useState('Rahul Nair');
  const [mobileNumber, setMobileNumber] = useState('+91 98451 22334');
  const [pincode, setPincode] = useState('700156');
  const [flatBuilding, setFlatBuilding] = useState('Flat 304, Sunshine Towers');
  const [areaStreet, setAreaStreet] = useState('Action Area 1, CC Block');
  const [landmark, setLandmark] = useState('Near Axis Mall');
  const [townCity, setTownCity] = useState('Kolkata');
  const [selectedState, setSelectedState] = useState('West Bengal');
  const [showStatePicker, setShowStatePicker] = useState(false);

  // Selected Service (includes shoe cleaning, sofa cleaning, etc.)
  const [selectedService, setSelectedService] = useState('wash_fold');
  const [instructions, setInstructions] = useState('Handle white clothes with care; inspect stains on cuffs.');

  // GPS Live Location State
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoStatusMsg, setGeoStatusMsg] = useState<string | null>(null);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Dynamic order items (Prices are HIDDEN from customer, only quantity is configured)
  const [selectedItems, setSelectedItems] = useState<{ item: PriceItem; quantity: number }[]>([
    { item: DEFAULT_PRICE_LIST[0], quantity: 3 }, // Formal Shirt
    { item: DEFAULT_PRICE_LIST[1], quantity: 2 }, // T-Shirt
    { item: DEFAULT_PRICE_LIST[9], quantity: 3 }, // Men Vest (Undergarment)
    { item: DEFAULT_PRICE_LIST[10], quantity: 3 }, // Briefs / Boxers
    { item: DEFAULT_PRICE_LIST.find((it) => it.id === 'shoe_sneakers') || DEFAULT_PRICE_LIST[15], quantity: 1 }, // Shoe Spa
  ]);

  const [activeCatalogCategory, setActiveCatalogCategory] = useState<ItemCategory>('All');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Synthesized Full Structured Address
  const fullAddress = useMemo(() => {
    return [
      flatBuilding.trim(),
      areaStreet.trim(),
      landmark.trim() ? `Landmark: ${landmark.trim()}` : '',
      townCity.trim(),
      selectedState ? `${selectedState} - ${pincode.trim()}` : pincode.trim(),
      country,
    ]
      .filter(Boolean)
      .join(', ');
  }, [flatBuilding, areaStreet, landmark, townCity, selectedState, pincode, country]);

  // Live detection of nearest store based on GPS or pincode & address
  const routingPreview = useMemo(() => {
    return findNearestStore(stores, pincode, fullAddress, geoCoords ?? undefined);
  }, [stores, pincode, fullAddress, geoCoords]);

  // GPS Live Location Trigger
  const handleDetectGPS = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatusMsg('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoStatusMsg('Detecting live GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setGeoCoords(coords);
        const routing = findNearestStore(stores, '', '', coords);

        setPincode(routing.store.pincodes[0]);
        setTownCity(routing.store.areas[0] || 'Local City');
        setGeoStatusMsg(`📍 Live GPS: Nearest hub is ${routing.store.name.replace('TumblePro - ', '')} (${routing.distanceKm ?? 'nearby'} km away)`);
        setGeoLoading(false);
        setErrorMessage(null);
      },
      (err) => {
        setGeoLoading(false);
        setGeoStatusMsg('Could not detect GPS location. Select one of the 4 store locations below:');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleQuickHubSelect = (hub: typeof OFFICIAL_STORE_HUBS[0]) => {
    setPincode(hub.pin);
    setFlatBuilding(hub.flat);
    setAreaStreet(hub.area);
    setLandmark(hub.landmark);
    setTownCity(hub.city);
    setSelectedState(hub.state);
    setGeoCoords(null);
    setGeoStatusMsg(`Selected hub: ${hub.name} (PIN ${hub.pin})`);
    setErrorMessage(null);
  };

  const updateItemQty = (itemId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((s) => (s.item.id === itemId ? { ...s, quantity: s.quantity + delta } : s))
        .filter((s) => s.quantity > 0)
    );
  };

  const addItemToCart = (item: PriceItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((s) => s.item.id === item.id);
      if (existing) {
        return prev.map((s) => (s.item.id === item.id ? { ...s, quantity: s.quantity + 1 } : s));
      }
      return [...prev, { item, quantity: 1 }];
    });
    setErrorMessage(null);
  };

  const totalPieces = selectedItems.reduce((sum, s) => sum + s.quantity, 0);

  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name (First and Last name).');
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMessage('Please enter your mobile number.');
      return;
    }
    if (!pincode.trim() || pincode.trim().length < 5) {
      setErrorMessage('Please enter a valid 6-digit PIN code.');
      return;
    }
    if (!flatBuilding.trim()) {
      setErrorMessage('Please enter Flat, House no., Building, Company, Apartment.');
      return;
    }
    if (!areaStreet.trim()) {
      setErrorMessage('Please enter Area, Street, Sector, Village.');
      return;
    }
    if (!townCity.trim()) {
      setErrorMessage('Please enter your Town / City.');
      return;
    }
    if (selectedItems.length === 0) {
      setErrorMessage('Please add at least one item, garment, or shoe to your pickup request.');
      return;
    }

    setLoading(true);
    try {
      // NOTE: Unit prices are set to 0 for customer booking request,
      // or catalog defaults which the store manager will review & adjust in CRM!
      const order = await createOrder({
        customerName: fullName.trim(),
        customerPhone: mobileNumber.trim(),
        customerAddress: fullAddress,
        pincode: pincode.trim(),
        area: areaStreet.trim(),
        serviceType: selectedService,
        deliveryMode: 'pickup_delivery',
        bagCount: 1, // Default 1 bag assigned at doorstep pickup
        specialInstructions: instructions.trim(),
        coords: geoCoords ?? undefined,
        items: selectedItems.map((s) => ({
          itemId: s.item.id,
          itemName: s.item.name,
          quantity: s.quantity,
          unitPrice: 0, // Hidden from customer; store manager assesses and sets in CRM!
        })),
      });

      setPlacedOrder(order);
    } catch {
      setErrorMessage('Failed to place order due to a network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJumpToStoreManager = async () => {
    if (!placedOrder) return;
    const mgr = presetUsers.find(
      (u) => u.role === 'store_manager' && u.storeId === placedOrder.storeId
    );
    if (mgr) {
      await switchAccount(mgr);
    }
    router.replace('/(app)/dashboard');
  };

  // ─── Post-Booking Confirmation Screen (No Prices Shown) ─────────
  if (placedOrder) {
    return (
      <View style={styles.container}>
        <View style={styles.webContainer}>
          <ScrollView contentContainerStyle={styles.successScroll}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={68} color={Colors.success} />
            </View>
            <Text style={styles.successTitle}>Doorstep Pickup Booked! 🎉</Text>
            <Text style={styles.successSub}>
              Order <Text style={{ fontWeight: '800', color: Colors.primary }}>#{placedOrder.orderNumber}</Text> has been received and routed to your nearest store hub.
            </Text>

            {/* Confirmation Summary Card */}
            <View style={styles.confirmationCard}>
              <View style={styles.confRow}>
                <Text style={styles.confKey}>Order Number:</Text>
                <Text style={styles.confVal}>#{placedOrder.orderNumber}</Text>
              </View>

              <View style={styles.confRow}>
                <Text style={styles.confKey}>Assigned Store Hub:</Text>
                <View style={{ alignItems: 'flex-end', flex: 1, marginLeft: 8 }}>
                  <Text style={styles.confHubName}>{placedOrder.storeName.replace('TumblePro - ', '')}</Text>
                  <Text style={styles.confRoutingReason}>{placedOrder.routingReason}</Text>
                </View>
              </View>

              <View style={styles.confDivider} />

              <View style={styles.confRow}>
                <Text style={styles.confKey}>Customer:</Text>
                <Text style={styles.confVal}>{placedOrder.customerName} ({placedOrder.customerPhone})</Text>
              </View>

              <View style={styles.confRow}>
                <Text style={styles.confKey}>Pickup Address:</Text>
                <Text style={styles.confVal} numberOfLines={3}>
                  {placedOrder.customerAddress}
                </Text>
              </View>

              <View style={styles.confRow}>
                <Text style={styles.confKey}>Service Selected:</Text>
                <Text style={styles.confVal}>
                  {SERVICE_TYPES.find((s) => s.id === placedOrder.serviceType)?.label || placedOrder.serviceType}
                </Text>
              </View>

              <View style={styles.confRow}>
                <Text style={styles.confKey}>Total Items Scheduled:</Text>
                <Text style={styles.confItemsVal}>{totalPieces} Items</Text>
              </View>

              {/* Items List Preview */}
              <View style={styles.orderItemsListWrap}>
                <Text style={styles.orderItemsTitle}>Items to be Collected:</Text>
                <View style={styles.itemSummaryHeaderRow}>
                  <Text style={styles.itemSummaryColHeaderName}>Item Name</Text>
                  <Text style={styles.itemSummaryColHeaderQty}>Quantity</Text>
                </View>
                {placedOrder.items.map((it, idx) => (
                  <View key={idx} style={styles.itemSummaryRow}>
                    <Text style={styles.itemSummaryName}>• {it.itemName}</Text>
                    <Text style={styles.itemSummaryQty}>{it.quantity}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.priceNoticeBox}>
                <Ionicons name="information-circle" size={18} color={Colors.primary} />
                <Text style={styles.priceNoticeText}>
                  Rates & final invoice will be inspected and confirmed by the store manager upon clothes collection. You will receive an invoice via SMS/WhatsApp.
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={{ width: '100%', gap: 10 }}>
              <Button
                title={`👉 Open Store Manager View (${placedOrder.storeName.replace('TumblePro - ', '')})`}
                onPress={handleJumpToStoreManager}
                size="lg"
              />
              <Button
                title="Book Another Pickup"
                onPress={() => {
                  setPlacedOrder(null);
                  setErrorMessage(null);
                }}
                variant="secondary"
              />
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ─── Main Customer Booking Form ─────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.headerTitle}>TumblePro™ Customer Portal</Text>
            <Text style={styles.headerSubtitle}>Doorstep Laundry, Shoe & Sofa Spa Booking</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/dashboard')} style={styles.crmLinkBtn}>
            <Text style={styles.crmLinkText}>CRM Dashboard →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.webContainer}>
            {/* Error Notification Banner */}
            {errorMessage && (
              <ErrorBanner message={errorMessage} onDismiss={() => setErrorMessage(null)} />
            )}

            {/* GPS Geolocation & Live Nearest Store Radar */}
            <View style={styles.radarCard}>
              <View style={styles.radarHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="navigate-circle" size={20} color={Colors.primary} />
                  <Text style={styles.radarTitle}>NEAREST STORE RADAR (GPS & PINCODE)</Text>
                </View>
                <TouchableOpacity
                  style={styles.gpsDetectBtn}
                  onPress={handleDetectGPS}
                  disabled={geoLoading}
                >
                  {geoLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="locate" size={14} color="#FFFFFF" />
                      <Text style={styles.gpsDetectText}>Detect My Live Location</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {geoStatusMsg && (
                <View style={styles.geoStatusBox}>
                  <Text style={styles.geoStatusText}>{geoStatusMsg}</Text>
                </View>
              )}

              {/* Dynamic Auto-Route Banner */}
              <View style={styles.routedStoreBanner}>
                <View style={styles.routedLeft}>
                  <View style={styles.radarPing} />
                  <View>
                    <Text style={styles.routedStoreName}>
                      {routingPreview.store.name.replace('TumblePro - ', '')}
                    </Text>
                    <Text style={styles.routedReason}>{routingPreview.reason}</Text>
                  </View>
                </View>
                <View style={styles.routedRightBadge}>
                  <Text style={styles.routedBadgeCode}>{routingPreview.store.code}</Text>
                  <Text style={styles.routedBadgeStatus}>🟢 Open for Pickup</Text>
                </View>
              </View>

              {/* Quick Select Buttons for the 4 Official Stores */}
              <Text style={styles.quickHubTitle}>Or Select from 4 Operating Hubs:</Text>
              <View style={styles.hubsGrid}>
                {OFFICIAL_STORE_HUBS.map((hub) => {
                  const isSelected = pincode === hub.pin;
                  return (
                    <TouchableOpacity
                      key={hub.pin}
                      style={[styles.hubChip, isSelected && styles.hubChipActive]}
                      onPress={() => handleQuickHubSelect(hub)}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={[styles.hubCode, isSelected && styles.hubCodeActive]}>
                          PIN {hub.pin}
                        </Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />}
                      </View>
                      <Text style={[styles.hubName, isSelected && styles.hubNameActive]}>{hub.name}</Text>
                      <Text style={styles.hubState}>{hub.city}, {hub.state}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ─── Structured Address Form (Exact Match to User Image 1) ─── */}
            <View style={styles.formCard}>
              <View style={styles.formSectionHeader}>
                <Ionicons name="location" size={18} color={Colors.primary} />
                <Text style={styles.formSectionTitle}>Pickup Address Details</Text>
              </View>

              {/* 1. Country/Region */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Country/Region</Text>
                <View style={styles.countryDropdown}>
                  <Text style={styles.countryText}>🇮🇳 India</Text>
                  <Ionicons name="chevron-down" size={16} color="#64748B" />
                </View>
              </View>

              {/* 2. Full name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full name (First and Last name) *</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="First and Last name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* 3. Mobile number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile number *</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
                <Text style={styles.helperText}>May be used to assist delivery</Text>
              </View>

              {/* 4. Pincode */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Pincode *</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={pincode}
                  onChangeText={(t) => {
                    setPincode(t);
                    setGeoCoords(null);
                  }}
                  placeholder="6 digits [0-9] PIN code"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              {/* 5. Flat, House no., Building, Company, Apartment */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Flat, House no., Building, Company, Apartment *</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={flatBuilding}
                  onChangeText={setFlatBuilding}
                  placeholder="e.g. Flat 304, Sunshine Towers"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* 6. Area, Street, Sector, Village */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Area, Street, Sector, Village *</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={areaStreet}
                  onChangeText={setAreaStreet}
                  placeholder="e.g. Action Area 1, CC Block"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* 7. Landmark */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Landmark</Text>
                <TextInput
                  style={styles.textInputBox}
                  value={landmark}
                  onChangeText={setLandmark}
                  placeholder="E.g. near apollo hospital"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* 8. Town/City and State Row */}
              <View style={styles.townStateRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Town/City *</Text>
                  <TextInput
                    style={styles.textInputBox}
                    value={townCity}
                    onChangeText={setTownCity}
                    placeholder="e.g. Kolkata"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>State *</Text>
                  <TouchableOpacity
                    style={styles.stateSelectBox}
                    onPress={() => setShowStatePicker(!showStatePicker)}
                  >
                    <Text style={styles.stateSelectText} numberOfLines={1}>
                      {selectedState || 'Choose a state'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* State Picker Dropdown Grid */}
              {showStatePicker && (
                <View style={styles.stateDropdownCard}>
                  <Text style={styles.stateDropdownTitle}>Select State / Region:</Text>
                  <View style={styles.stateOptionsGrid}>
                    {INDIAN_STATES.map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.stateOptionChip, selectedState === st && styles.stateOptionChipActive]}
                        onPress={() => {
                          setSelectedState(st);
                          setShowStatePicker(false);
                        }}
                      >
                        <Text style={[styles.stateOptionText, selectedState === st && styles.stateOptionTextActive]}>
                          {st}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* ─── Service Selection (Includes Shoe & Sofa Cleaning) ─── */}
            <View style={styles.formCard}>
              <View style={styles.formSectionHeader}>
                <Ionicons name="sparkles" size={18} color={Colors.primary} />
                <Text style={styles.formSectionTitle}>Select Primary Laundry Service</Text>
              </View>

              <Text style={styles.serviceCategoryLabel}>Core Clothes Care (Select One):</Text>
              <View style={styles.servicesGrid}>
                {[
                  { id: 'wash_iron', label: 'Wash & Steam Iron', icon: '👔', desc: 'Washed, dried & steam pressed • Most Popular' },
                  { id: 'wash_fold', label: 'Wash & Fold', icon: '🫧', desc: 'Washed, dried & neatly folded' },
                  { id: 'dry_clean', label: 'Dry Clean', icon: '✨', desc: 'Suits, sarees, blazers & delicate fabrics' },
                ].map((service) => {
                  const isSelected = selectedService === service.id;
                  return (
                    <TouchableOpacity
                      key={service.id}
                      style={[styles.serviceOption, isSelected && styles.serviceOptionActive]}
                      onPress={() => setSelectedService(service.id)}
                    >
                      <Text style={styles.serviceIcon}>{service.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.serviceLabel, isSelected && styles.serviceLabelActive]}>
                          {service.label}
                        </Text>
                        <Text style={styles.serviceSub}>{service.desc}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Specialty Spa & Cleaning Add-ons */}
              <View style={styles.mixedOrderBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Ionicons name="sparkles" size={15} color={Colors.primary} />
                  <Text style={styles.mixedOrderTitle}>Specialty Spa Add-ons (Combine in Same Order):</Text>
                </View>
                <Text style={styles.mixedOrderSub}>
                  No separate pickup needed! You can add shoes, sofa, and regular clothes together. Tap below to browse items:
                </Text>

                <View style={styles.specialtyChipsGrid}>
                  {[
                    { cat: 'Shoe & Furniture Spa', label: '👟 Shoe Spa (Sneakers & Leather)', srv: 'shoe_cleaning' },
                    { cat: 'Shoe & Furniture Spa', label: '🛋️ Sofa & Carpet Spa', srv: 'sofa_cleaning' },
                    { cat: 'Undergarments', label: '🩲 Undergarments', srv: selectedService },
                    { cat: 'All', label: '🔥 Steam Iron Only', srv: 'iron_only' },
                  ].map((s, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.specialtyPillBtn,
                        (selectedService === s.srv || activeCatalogCategory === s.cat) && styles.specialtyPillBtnActive,
                      ]}
                      onPress={() => {
                        setSelectedService(s.srv);
                        if (s.cat !== 'All') {
                          setActiveCatalogCategory(s.cat as any);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.specialtyPillText,
                          (selectedService === s.srv || activeCatalogCategory === s.cat) && styles.specialtyPillTextActive,
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* ─── Items to Collect (PRICES ARE COMPLETELY HIDDEN) ──── */}
            <View style={styles.formCard}>
              <View style={styles.cartHeaderRow}>
                <View>
                  <Text style={styles.formSectionTitle}>Clothes & Items for Collection</Text>
                  <Text style={styles.cartCountSub}>{totalPieces} Items selected for doorstep pickup</Text>
                </View>
                <View style={styles.noPriceBadge}>
                  <Text style={styles.noPriceBadgeText}>Rates Assessed in CRM</Text>
                </View>
              </View>

              {/* Selected Items List without prices */}
              {selectedItems.map((sel) => (
                <View key={sel.item.id} style={styles.cartItemRow}>
                  <Text style={styles.cartItemIcon}>{sel.item.icon || '👕'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{sel.item.name}</Text>
                    <Text style={styles.cartItemCat}>{sel.item.category}</Text>
                  </View>
                  <View style={styles.cartQtyControls}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateItemQty(sel.item.id, -1)}
                    >
                      <Ionicons name="remove" size={16} color="#0F2C59" />
                    </TouchableOpacity>
                    <Text style={styles.qtyVal}>{sel.quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateItemQty(sel.item.id, 1)}
                    >
                      <Ionicons name="add" size={16} color="#0F2C59" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Category Filter for Catalog */}
              <Text style={styles.addMoreHeader}>+ Add More Items to Pickup Bag:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryPillsScroll}
              >
                {ITEM_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryPill, activeCatalogCategory === cat && styles.categoryPillActive]}
                    onPress={() => setActiveCatalogCategory(cat)}
                  >
                    <Text style={[styles.categoryPillText, activeCatalogCategory === cat && styles.categoryPillTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Fast Add Chips (Shoe Spa, Sofa, Undergarments, Apparel) */}
              <View style={styles.quickAddRow}>
                {DEFAULT_PRICE_LIST.filter(
                  (it) => activeCatalogCategory === 'All' || it.category === activeCatalogCategory
                ).map((it) => (
                  <TouchableOpacity
                    key={it.id}
                    style={styles.quickAddChip}
                    onPress={() => addItemToCart(it)}
                  >
                    <Text style={styles.quickAddIcon}>{it.icon}</Text>
                    <Text style={styles.quickAddText}>+ {it.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Special Instructions */}
            <View style={styles.formCard}>
              <Input
                label="Special Laundry & Delivery Instructions"
                value={instructions}
                onChangeText={setInstructions}
                placeholder="e.g. Wash undergarments separately, sneaker cleaning, starch shirts"
                multiline
              />
            </View>

            {/* Booking CTA (No prices) */}
            <View style={styles.ctaBox}>
              <Button
                title={loading ? 'Booking Pickup...' : `Book Free Doorstep Pickup • (${totalPieces} items)`}
                onPress={handlePlaceOrder}
                loading={loading}
                size="lg"
              />
              <Text style={styles.ctaSub}>
                Routed to <Text style={{ fontWeight: '800', color: Colors.primary }}>{routingPreview.store.name.replace('TumblePro - ', '')}</Text>. Rates will be confirmed by store manager upon collection.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F2C59',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '600',
  },
  crmLinkBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  crmLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  scroll: {
    paddingBottom: 40,
  },
  webContainer: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
  },

  // Radar Card
  radarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  radarTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gpsDetectText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  geoStatusBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  geoStatusText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  routedStoreBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 14,
  },
  routedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  radarPing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
  },
  routedStoreName: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
  },
  routedReason: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
  routedRightBadge: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  routedBadgeCode: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.primary,
  },
  routedBadgeStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
    marginTop: 2,
  },
  quickHubTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  hubsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hubChip: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  hubChipActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  hubCode: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C59',
  },
  hubCodeActive: {
    color: Colors.primary,
  },
  hubName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F2C59',
    marginTop: 3,
  },
  hubNameActive: {
    color: Colors.primary,
  },
  hubState: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  // Form Cards
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  formSectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F2C59',
  },

  // Structured Address Form Inputs (Image 1 Style)
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2C59',
    marginBottom: 6,
  },
  textInputBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F2C59',
  },
  countryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  countryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2C59',
  },
  helperText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  townStateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stateSelectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  stateSelectText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F2C59',
    flex: 1,
  },
  stateDropdownCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginTop: 6,
    marginBottom: 12,
  },
  stateDropdownTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  stateOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stateOptionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stateOptionChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stateOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F2C59',
  },
  stateOptionTextActive: {
    color: '#FFFFFF',
  },

  // Services Grid
  servicesGrid: {
    gap: 10,
  },
  serviceOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  serviceOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: '#EFF6FF',
  },
  serviceIcon: {
    fontSize: 26,
  },
  serviceLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2C59',
  },
  serviceLabelActive: {
    color: Colors.primary,
  },
  serviceSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  serviceCategoryLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C59',
    marginBottom: 8,
  },
  mixedOrderBanner: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  mixedOrderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  mixedOrderSub: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  specialtyChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  specialtyPillBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  specialtyPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  specialtyPillTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },

  // Cart / Items (NO PRICES)
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartCountSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  noPriceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  noPriceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  cartItemIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F2C59',
  },
  cartItemCat: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  cartQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  qtyVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F2C59',
    minWidth: 22,
    textAlign: 'center',
  },
  addMoreHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C59',
    marginTop: 14,
    marginBottom: 8,
  },
  categoryPillsScroll: {
    gap: 6,
    paddingBottom: 8,
  },
  categoryPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  categoryPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  quickAddRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  quickAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  quickAddIcon: {
    fontSize: 14,
  },
  quickAddText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F2C59',
  },

  // CTA Box
  ctaBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  ctaSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
    fontWeight: '600',
  },

  // Confirmation View Styles
  successScroll: {
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F2C59',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
    fontWeight: '600',
  },
  confirmationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    padding: 16,
    width: '100%',
    marginBottom: 16,
    gap: 10,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  confRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  confKey: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '700',
  },
  confVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F2C59',
    textAlign: 'right',
    maxWidth: 240,
  },
  confHubName: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  confRoutingReason: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  confItemsVal: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
  },
  confDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  orderItemsListWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginVertical: 4,
  },
  orderItemsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C59',
    marginBottom: 6,
  },
  itemSummaryHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 4,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemSummaryColHeaderName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemSummaryColHeaderQty: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  itemSummaryName: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
  },
  itemSummaryQty: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '800',
  },
  priceNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: 4,
  },
  priceNoticeText: {
    flex: 1,
    fontSize: 11,
    color: '#1E40AF',
    lineHeight: 16,
    fontWeight: '600',
  },
});
