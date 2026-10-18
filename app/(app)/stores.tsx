import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import RoleSwitcherBar from '../../components/common/RoleSwitcherBar';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/Colors';
import { Store } from '../../utils/storage';

export default function StoresScreen() {
  const { stores, allOrders, addNewStore, setActiveStoreFilter } = useOrders();
  const { user, isSuperAdmin, isStoreManager } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);

  // New store form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [pincodesStr, setPincodesStr] = useState('');
  const [areasStr, setAreasStr] = useState('');
  const [capacity, setCapacity] = useState('160');

  // Enforce isolation: Store Manager only sees their own store!
  const visibleStores = isSuperAdmin
    ? stores
    : stores.filter((s) => s.id === user?.storeId);

  const handleCreateStore = async () => {
    if (!name.trim() || !code.trim() || !pincodesStr.trim()) {
      Alert.alert('Required', 'Please enter store name, store code, and pincodes');
      return;
    }

    const newStore: Store = {
      id: `store-${code.toLowerCase().trim()}`,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim() || 'Regional Operations Hub',
      phone: phone.trim() || '+91 98300 00000',
      email: managerEmail.trim() || `${code.toLowerCase()}@tumblepro.com`,
      pincodes: pincodesStr.split(',').map((p) => p.trim()).filter(Boolean),
      areas: areasStr.split(',').map((a) => a.trim()).filter(Boolean),
      managerName: managerName.trim() || 'Store Manager',
      managerEmail: managerEmail.trim() || `${code.toLowerCase()}@tumblepro.com`,
      managerPhone: phone.trim() || '+91 98300 00000',
      capacityPerDay: parseInt(capacity, 10) || 160,
      color: '#0F2C59',
      status: 'active',
      lat: 22.5850,
      lng: 88.4600,
    };

    await addNewStore(newStore);
    Alert.alert('Store Created! 🏬', `Added ${newStore.name} covering pincodes: ${newStore.pincodes.join(', ')}`);
    setShowAddModal(false);
    setName('');
    setCode('');
    setPincodesStr('');
  };

  return (
    <View style={styles.container}>
      <RoleSwitcherBar />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="business" size={22} color={Colors.primary} />
              <Text style={styles.title}>
                {isSuperAdmin ? '4 Store Hubs Network' : 'My Store Details'}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {isSuperAdmin
                ? `${stores.length} Configured Hubs • Kolkata, Itanagar & Assam`
                : `Store Tenant Isolation Active • ID: ${user?.storeId || 'N/A'}`}
            </Text>
          </View>

          {isSuperAdmin && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addBtnText}>+ Add Hub</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.webContainer}>
          {/* Security & Tenant Isolation Banner */}
          <View style={[styles.securityBanner, isSuperAdmin ? styles.superBanner : styles.storeBanner]}>
            <Ionicons
              name={isSuperAdmin ? 'globe-outline' : 'shield-checkmark-outline'}
              size={20}
              color={isSuperAdmin ? Colors.primary : Colors.success}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.securityTitle, isSuperAdmin ? { color: Colors.primary } : { color: Colors.success }]}>
                {isSuperAdmin
                  ? 'Super Admin Multi-Store Network Access'
                  : 'Store Tenant Isolation: STRICTLY ENFORCED'}
              </Text>
              <Text style={styles.securitySub}>
                {isSuperAdmin
                  ? 'Consolidated view across all 4 regional hubs with cross-hub lead rerouting and fleet analytics.'
                  : `You have access strictly to ${user?.storeName?.replace('TumblePro - ', '')}. Other regional stores are isolated and hidden.`}
              </Text>
            </View>
          </View>

          {/* Stores List */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>
              {isSuperAdmin ? `4 Operational Store Hubs (${visibleStores.length})` : 'My Store Hub Profile'}
            </Text>
            {isSuperAdmin && (
              <TouchableOpacity onPress={() => router.push('/(app)/customer-portal')}>
                <Text style={styles.testRouteLink}>Test GPS Routing →</Text>
              </TouchableOpacity>
            )}
          </View>

          {visibleStores.map((store, index) => {
            const storeOrders = allOrders.filter((o) => o.storeId === store.id);
            const storeRevenue = storeOrders
              .filter((o) => o.paymentStatus === 'Paid')
              .reduce((s, o) => s + o.totalAmount, 0);

            return (
              <View key={store.id} style={[styles.storeCard, { borderTopColor: store.color || Colors.primary }]}>
                {/* Store Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.codeBadge, { backgroundColor: (store.color || Colors.primary) + '18' }]}>
                      <Text style={[styles.codeText, { color: store.color || Colors.primary }]}>
                        {store.code}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storeName}>
                        {store.name.replace('TumblePro - ', '')}
                      </Text>
                      <Text style={styles.addressText} numberOfLines={1}>{store.address}</Text>
                    </View>
                  </View>
                  <View style={styles.statusBadge}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.statusText}>{store.status.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Total Orders</Text>
                    <Text style={styles.statVal}>{storeOrders.length}</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Paid Revenue</Text>
                    <Text style={[styles.statVal, { color: Colors.success }]}>
                      ₹{storeRevenue.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Capacity</Text>
                    <Text style={styles.statVal}>{store.capacityPerDay} / day</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>GPS Coords</Text>
                    <Text style={styles.statVal}>{store.lat ? `${store.lat.toFixed(2)}, ${store.lng.toFixed(2)}` : 'Set'}</Text>
                  </View>
                </View>

                {/* Manager & Contact */}
                <View style={styles.infoRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="person-circle-outline" size={16} color={Colors.primary} />
                    <Text style={styles.managerText}>Manager: {store.managerName}</Text>
                  </View>
                  <Text style={styles.phoneText}>{store.phone}</Text>
                </View>

                {/* Pincodes & Areas */}
                <View style={styles.pincodeSection}>
                  <Text style={styles.pincodeHeader}>AUTOMATIC SERVICE PINCODES:</Text>
                  <View style={styles.pincodesList}>
                    {store.pincodes.map((pin) => (
                      <View key={pin} style={styles.pinTag}>
                        <Text style={styles.pinTagText}>{pin}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.areasRow}>
                    <Text style={styles.areasLabel}>Key Localities: </Text>
                    <Text style={styles.areasText}>{store.areas.join(' • ')}</Text>
                  </View>
                </View>

                {/* Quick Link to Hub Orders */}
                {isSuperAdmin && (
                  <TouchableOpacity
                    style={styles.viewStoreOrdersBtn}
                    onPress={() => {
                      setActiveStoreFilter(store.id);
                      router.push('/(app)/orders');
                    }}
                  >
                    <Text style={styles.viewStoreOrdersText}>
                      View {store.name.replace('TumblePro - ', '')} Orders ({storeOrders.length}) →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Add New Hub Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Store Hub</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <Input
                label="Store Name *"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Guwahati Express Hub"
              />
              <Input
                label="3-Letter Store Code *"
                value={code}
                onChangeText={setCode}
                placeholder="e.g. GHY"
                autoCapitalize="characters"
              />
              <Input
                label="Service Pincodes (comma-separated) *"
                value={pincodesStr}
                onChangeText={setPincodesStr}
                placeholder="e.g. 781001, 781005, 781006"
              />
              <Input
                label="Covered Localities / Areas"
                value={areasStr}
                onChangeText={setAreasStr}
                placeholder="e.g. Pan Bazaar, Dispur, GS Road"
              />
              <Input
                label="Store Address"
                value={address}
                onChangeText={setAddress}
                placeholder="Full street address"
              />
              <Input
                label="Manager Name"
                value={managerName}
                onChangeText={setManagerName}
                placeholder="e.g. Rohit Bora"
              />
              <Input
                label="Store Contact Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98450 11223"
                keyboardType="phone-pad"
              />
              <Input
                label="Max Daily Washing Capacity"
                value={capacity}
                onChangeText={setCapacity}
                placeholder="160"
                keyboardType="numeric"
              />

              <View style={{ marginTop: 14, gap: 8, marginBottom: 20 }}>
                <Button title="Save & Activate Store Hub" onPress={handleCreateStore} />
                <Button title="Cancel" onPress={() => setShowAddModal(false)} variant="secondary" />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  scroll: { padding: 16, paddingBottom: 40 },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  superBanner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  storeBanner: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  securityTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  securitySub: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
    marginTop: 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  testRouteLink: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '800',
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderTopWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
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
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  addressText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.success,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#F1F5F9',
    borderBottomColor: '#F1F5F9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    height: '80%',
    alignSelf: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  managerText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  phoneText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  pincodeSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pincodeHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  pincodesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pinTag: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pinTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  areasRow: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  areasLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  areasText: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 14,
  },
  viewStoreOrdersBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  viewStoreOrdersText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
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
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
});
