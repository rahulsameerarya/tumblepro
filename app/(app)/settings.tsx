import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useOrders } from '../../contexts/OrderContext';
import { Colors } from '../../constants/Colors';
import { DEFAULT_PRICE_LIST } from '../../constants/Pricing';
import {
  STORE_CREDENTIALS,
  StoredUser,
  Store,
  DeliveryBoy,
  generateId,
  simpleHash,
} from '../../utils/storage';
import Button from '../../components/ui/Button';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const {
    user,
    logout,
    presetUsers,
    usersList,
    switchAccount,
    addNewUserAccount,
    isSuperAdmin,
    isStoreManager,
    isDeliveryBoy,
  } = useAuth();
  const { stores, addNewStore, addNewDeliveryBoy } = useOrders();

  // Add User Account Modal State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState<StoredUser['role']>('store_manager');
  const [userStoreId, setUserStoreId] = useState(stores[0]?.id || 'store-newtown');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryVehicle, setDeliveryVehicle] = useState('');

  // Add Store Hub Modal State
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeManager, setStoreManager] = useState('');
  const [storePincodes, setStorePincodes] = useState('');
  const [storeAreas, setStoreAreas] = useState('');
  const [storeCapacity, setStoreCapacity] = useState('180');

  function handleLogout() {
    logout();
    router.replace('/(auth)/login');
  }

  // Create New User Account (Admin, Manager, Fleet)
  const handleCreateUser = async () => {
    if (!userName.trim()) {
      Alert.alert('Required', 'Please enter full name.');
      return;
    }
    if (!userEmail.trim()) {
      Alert.alert('Required', 'Please enter email address.');
      return;
    }
    if (!userPassword.trim() || userPassword.length < 5) {
      Alert.alert('Required', 'Please enter password (at least 5 characters).');
      return;
    }

    const assignedStore = stores.find((s) => s.id === userStoreId) || stores[0];

    const newUser: StoredUser = {
      id: `user-${Date.now().toString(36)}`,
      name: userName.trim(),
      email: userEmail.trim().toLowerCase(),
      passwordHash: simpleHash(userPassword.trim()),
      role: userRole,
      storeId: userRole === 'super_admin' ? undefined : assignedStore?.id,
      storeName: userRole === 'super_admin' ? undefined : assignedStore?.name,
      createdAt: new Date().toISOString(),
    };

    await addNewUserAccount(newUser);

    // If role is delivery_boy, also register in delivery boys dispatch fleet
    if (userRole === 'delivery_boy' && assignedStore) {
      const newBoy: DeliveryBoy = {
        id: `del-${Date.now().toString(36)}`,
        name: userName.trim(),
        phone: deliveryPhone.trim() || '+91 98000 00000',
        storeId: assignedStore.id,
        storeName: assignedStore.name,
        vehicleNumber: deliveryVehicle.trim() || 'Two-Wheeler EV',
        status: 'available',
        activeOrdersCount: 0,
        avatarColor: Colors.primary,
        rating: 5.0,
      };
      await addNewDeliveryBoy(newBoy);
    }

    Alert.alert(
      'Account Created! 👤',
      `Created ${newUser.role.toUpperCase()} account for ${newUser.name}.\nEmail: ${newUser.email}\nPassword: ${userPassword}`
    );

    setShowAddUserModal(false);
    setUserName('');
    setUserEmail('');
    setUserPassword('');
    setDeliveryPhone('');
    setDeliveryVehicle('');
  };

  // Create New Store Hub
  const handleCreateStore = async () => {
    if (!storeName.trim() || !storeCode.trim() || !storePincodes.trim()) {
      Alert.alert('Required', 'Please enter store name, code, and serviced pincodes.');
      return;
    }

    const newStore: Store = {
      id: `store-${storeCode.trim().toLowerCase()}`,
      name: storeName.trim(),
      code: storeCode.trim().toUpperCase(),
      address: storeAddress.trim() || 'Regional Operations Hub',
      phone: storePhone.trim() || '+91 98000 11111',
      email: `${storeCode.trim().toLowerCase()}@tumblepro.com`,
      pincodes: storePincodes.split(',').map((p) => p.trim()).filter(Boolean),
      areas: storeAreas.split(',').map((a) => a.trim()).filter(Boolean),
      managerName: storeManager.trim() || 'Store Manager',
      managerEmail: `${storeCode.trim().toLowerCase()}@tumblepro.com`,
      managerPhone: storePhone.trim() || '+91 98000 11111',
      capacityPerDay: parseInt(storeCapacity, 10) || 180,
      color: '#0F2C59',
      status: 'active',
      lat: 22.5850,
      lng: 88.4600,
    };

    await addNewStore(newStore);
    Alert.alert(
      'Store Hub Added! 🏬',
      `Store ${newStore.name} (${newStore.code}) added covering pincodes: ${newStore.pincodes.join(', ')}`
    );

    setShowAddStoreModal(false);
    setStoreName('');
    setStoreCode('');
    setStoreAddress('');
    setStorePincodes('');
    setStoreAreas('');
  };

  // Find custom created accounts not in preset credentials
  const customUsers = (usersList || []).filter(
    (u) => !STORE_CREDENTIALS.some((c) => c.email.toLowerCase() === u.email.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.title}>Settings & Access Control</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => setShowAddUserModal(true)}
            >
              <Ionicons name="person-add" size={15} color="#FFFFFF" />
              <Text style={styles.headerActionBtnText}>+ Add User</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerLoginBtn}
              onPress={() => router.push('/(auth)/login')}
            >
              <Ionicons name="log-in-outline" size={15} color={Colors.primary} />
              <Text style={styles.headerLoginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.webContainer}>
          {/* Profile Card */}
          <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? 'T'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user?.name ?? 'TumblePro User'}</Text>
              <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>
                  {isSuperAdmin
                    ? '👑 SUPER ADMIN (ALL 4 STORES)'
                    : isStoreManager
                    ? `🏬 STORE MANAGER (${user?.storeName?.replace('TumblePro - ', '')})`
                    : '🛵 DELIVERY FLEET'}
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Quick Management Shortcuts Bar */}
          <View style={styles.quickBar}>
            <TouchableOpacity
              style={styles.quickBarBtn}
              onPress={() => setShowAddUserModal(true)}
            >
              <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.quickBarTitle}>+ Add Admin / Staff</Text>
                <Text style={styles.quickBarSub}>Add Super Admin, Store Manager, or Delivery Fleet</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickBarBtn}
              onPress={() => setShowAddStoreModal(true)}
            >
              <Ionicons name="business-outline" size={18} color={Colors.secondaryDark} />
              <View>
                <Text style={styles.quickBarTitle}>+ Add New Store Hub</Text>
                <Text style={styles.quickBarSub}>Expand coverage with new regional hub & pincodes</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tenant Isolation Status */}
          <View style={styles.card}>
            <View style={styles.isolationHeader}>
              <Ionicons name="shield-checkmark" size={18} color={Colors.success} />
              <Text style={styles.isolationTitle}>Store Tenant Isolation Guarantee</Text>
            </View>
            <Text style={styles.isolationDesc}>
              {isSuperAdmin
                ? '👑 As Super Admin, you have unrestricted global oversight over all 4 hubs (Newtown, Sepa, Tinsukhia, NaharLagun), consolidated revenues, cross-store rerouting, and fleet distribution.'
                : `🔒 Strict Tenant Isolation: You are authenticated as ${user?.storeName?.replace('TumblePro - ', '')}. Orders, customer details, and financials of all other hubs are strictly hidden.`}
            </Text>
          </View>

          {/* Separate Store Login Credentials Directory */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Separate Store Login Credentials & Passwords</Text>
            <TouchableOpacity
              style={styles.miniAddUserBtn}
              onPress={() => setShowAddUserModal(true)}
            >
              <Ionicons name="add" size={14} color={Colors.primary} />
              <Text style={styles.miniAddUserText}>New User</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardSub}>
              Each store hub has its own separate login credentials and isolated dashboard. Tap any account to switch:
            </Text>

            <View style={styles.credList}>
              {STORE_CREDENTIALS.map((cred) => {
                const isCurrent = user?.email.toLowerCase() === cred.email.toLowerCase();
                const matchedPreset = (usersList || presetUsers).find(
                  (p) => p.email.toLowerCase() === cred.email.toLowerCase()
                );

                return (
                  <TouchableOpacity
                    key={cred.email}
                    style={[
                      styles.credItem,
                      isCurrent && styles.credItemActive,
                      { borderLeftColor: cred.color },
                    ]}
                    onPress={() => {
                      if (matchedPreset) switchAccount(matchedPreset);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.credItemTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.credRoleTag, { color: cred.color }]}>{cred.title}</Text>
                        {isCurrent && (
                          <View style={styles.activeTag}>
                            <Text style={styles.activeTagText}>Active</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.passBox}>
                        <Text style={styles.passLabel}>Password: </Text>
                        <Text style={styles.passCode}>{cred.password}</Text>
                      </View>
                    </View>

                    <Text style={styles.credStoreText}>{cred.storeName.replace('TumblePro - ', '')}</Text>
                    <Text style={styles.credEmailText}>Email: {cred.email}</Text>
                    <Text style={styles.credAccessText}>{cred.accessDesc}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Custom Added Users */}
              {customUsers.map((cu) => {
                const isCurrent = user?.email.toLowerCase() === cu.email.toLowerCase();
                return (
                  <TouchableOpacity
                    key={cu.id}
                    style={[styles.credItem, isCurrent && styles.credItemActive, { borderLeftColor: Colors.primary }]}
                    onPress={() => switchAccount(cu)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.credItemTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.credRoleTag, { color: Colors.primary }]}>
                          {cu.role.toUpperCase()} (Custom Account)
                        </Text>
                        {isCurrent && (
                          <View style={styles.activeTag}>
                            <Text style={styles.activeTagText}>Active</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.passBox}>
                        <Text style={styles.passLabel}>Password: </Text>
                        <Text style={styles.passCode}>{cu.passwordHash}</Text>
                      </View>
                    </View>

                    <Text style={styles.credStoreText}>{cu.name} • {cu.storeName || 'Corporate'}</Text>
                    <Text style={styles.credEmailText}>Email: {cu.email}</Text>
                    <Text style={styles.credAccessText}>Role: {cu.role} • Store: {cu.storeId || 'All Network'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Order Simulator Shortcut */}
          <TouchableOpacity
            style={styles.simulatorBanner}
            onPress={() => router.push('/(app)/customer-portal')}
          >
            <View style={styles.simulatorInner}>
              <Ionicons name="compass" size={22} color="#FFFFFF" />
              <View style={{ flex: 1 }}>
                <Text style={styles.simTitle}>GPS Customer Order Portal</Text>
                <Text style={styles.simSub}>
                  Test customer order placement with live GPS geolocation auto-routing to the 4 store hubs
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Garment Price List */}
          <Text style={styles.sectionTitle}>TumblePro™ Master Pricing Schedule</Text>
          <View style={styles.card}>
            <View style={styles.priceHeader}>
              <Text style={styles.priceCol}>Garment Type</Text>
              <Text style={styles.priceColSm}>Dry Clean</Text>
              <Text style={styles.priceColSm}>Wash & Iron</Text>
              <Text style={styles.priceColSm}>Wash & Fold</Text>
            </View>
            {DEFAULT_PRICE_LIST.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.priceRow}>
                <Text style={styles.priceItemName}>{item.name}</Text>
                <Text style={styles.priceVal}>₹{item.prices.dry_clean}</Text>
                <Text style={styles.priceVal}>₹{item.prices.wash_iron}</Text>
                <Text style={styles.priceVal}>₹{item.prices.wash_fold}</Text>
              </View>
            ))}
          </View>

          {/* App Info */}
          <Text style={styles.sectionTitle}>Application Information</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingValue}>TumblePro CRM v4.2 Enterprise</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Connected Hubs</Text>
              <Text style={styles.settingValue}>{stores.length} Hubs (WB, Assam, Arunachal)</Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Two-Stage Tagging</Text>
              <Text style={styles.settingValue}>Active (Hamper Tag + Individual Garment Tags)</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            <Text style={styles.logoutText}>Log Out from Current Store Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ➕ MODAL 1: Add New Admin / Manager / Fleet User */}
      <Modal visible={showAddUserModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="person-add" size={20} color={Colors.primary} />
                <Text style={styles.modalSheetTitle}>Add Admin or Store Staff Account</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddUserModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
              <Text style={styles.fieldLabel}>Select Role:</Text>
              <View style={styles.roleGrid}>
                {[
                  { id: 'super_admin', label: '👑 Super Admin', sub: 'Global network access' },
                  { id: 'store_manager', label: '🏬 Store Manager', sub: 'Single store isolated' },
                  { id: 'delivery_boy', label: '🛵 Delivery Fleet', sub: 'Doorstep pickup app' },
                ].map((r) => {
                  const isSel = userRole === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleSelectBtn, isSel && styles.roleSelectBtnActive]}
                      onPress={() => setUserRole(r.id as any)}
                    >
                      <Text style={[styles.roleSelectTitle, isSel && styles.roleSelectTitleActive]}>
                        {r.label}
                      </Text>
                      <Text style={[styles.roleSelectSub, isSel && styles.roleSelectSubActive]}>
                        {r.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                placeholder="e.g. Arun Sharma"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Login Email Address</Text>
              <TextInput
                value={userEmail}
                onChangeText={setUserEmail}
                placeholder="e.g. arun@tumblepro.com"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                value={userPassword}
                onChangeText={setUserPassword}
                placeholder="e.g. tumble123"
                style={styles.textInput}
              />

              {userRole !== 'super_admin' && (
                <>
                  <Text style={styles.fieldLabel}>Assign Store Hub:</Text>
                  <View style={styles.storePickerGrid}>
                    {stores.map((s) => {
                      const isSel = userStoreId === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id}
                          style={[styles.storePickerBtn, isSel && styles.storePickerBtnActive]}
                          onPress={() => setUserStoreId(s.id)}
                        >
                          <Text style={[styles.storePickerText, isSel && styles.storePickerTextActive]}>
                            {s.code}: {s.name.replace('TumblePro - ', '')}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {userRole === 'delivery_boy' && (
                <>
                  <Text style={styles.fieldLabel}>Mobile Number (For Customer Contact)</Text>
                  <TextInput
                    value={deliveryPhone}
                    onChangeText={setDeliveryPhone}
                    placeholder="+91 98300 00000"
                    keyboardType="phone-pad"
                    style={styles.textInput}
                  />

                  <Text style={styles.fieldLabel}>Vehicle & Registration</Text>
                  <TextInput
                    value={deliveryVehicle}
                    onChangeText={setDeliveryVehicle}
                    placeholder="e.g. WB-06-AA-1234 (Electric Scooter)"
                    style={styles.textInput}
                  />
                </>
              )}

              <Button
                title="Create Account & Save to Directory"
                onPress={handleCreateUser}
                size="md"
                style={{ marginTop: 10 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ➕ MODAL 2: Add New Store Hub */}
      <Modal visible={showAddStoreModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalSheetHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="business" size={20} color={Colors.primary} />
                <Text style={styles.modalSheetTitle}>Add New Store Operations Hub</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddStoreModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
              <Text style={styles.fieldLabel}>Store Hub Name</Text>
              <TextInput
                value={storeName}
                onChangeText={setStoreName}
                placeholder="e.g. Siliguri Hub, Hill Cart Road"
                style={styles.textInput}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Store Code (3 letters)</Text>
                  <TextInput
                    value={storeCode}
                    onChangeText={setStoreCode}
                    placeholder="e.g. SLG"
                    autoCapitalize="characters"
                    style={styles.textInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Daily Capacity (Orders)</Text>
                  <TextInput
                    value={storeCapacity}
                    onChangeText={setStoreCapacity}
                    keyboardType="numeric"
                    placeholder="180"
                    style={styles.textInput}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Full Hub Address</Text>
              <TextInput
                value={storeAddress}
                onChangeText={setStoreAddress}
                placeholder="e.g. Plot 12, Hill Cart Road, Siliguri, West Bengal"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Store Contact Phone</Text>
              <TextInput
                value={storePhone}
                onChangeText={setStorePhone}
                placeholder="+91 98320 00000"
                keyboardType="phone-pad"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Store Owner / Manager Name</Text>
              <TextInput
                value={storeManager}
                onChangeText={setStoreManager}
                placeholder="e.g. Rajesh Ghosh"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Serviced Pincodes (Comma-separated)</Text>
              <TextInput
                value={storePincodes}
                onChangeText={setStorePincodes}
                placeholder="e.g. 734001, 734002, 734003"
                style={styles.textInput}
              />

              <Text style={styles.fieldLabel}>Covered Localities / Areas (Comma-separated)</Text>
              <TextInput
                value={storeAreas}
                onChangeText={setStoreAreas}
                placeholder="e.g. Hill Cart Rd, Pradhan Nagar, Sevoke Rd"
                style={styles.textInput}
              />

              <Button
                title="Create Store Hub & Enable Geo-Routing"
                onPress={handleCreateStore}
                size="md"
                style={{ marginTop: 10 }}
              />
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
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 16, fontWeight: '900', color: Colors.textPrimary },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  headerActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary + '33',
  },
  headerLoginText: { fontSize: 11, fontWeight: '800', color: Colors.primary },
  scroll: { padding: 14, paddingBottom: 40 },
  webContainer: { maxWidth: 960, width: '100%', alignSelf: 'center' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '900', color: '#FFFFFF' },
  profileName: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  profileEmail: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF' },
  quickBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  quickBarBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  quickBarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  quickBarSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
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
  isolationHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  isolationTitle: { fontSize: 13, fontWeight: '800', color: Colors.success },
  isolationDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  miniAddUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  miniAddUserText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  cardSub: { fontSize: 11, color: Colors.textSecondary, marginBottom: 12 },
  credList: { gap: 8 },
  credItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
  },
  credItemActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  credItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  credRoleTag: { fontSize: 11, fontWeight: '800' },
  activeTag: {
    backgroundColor: Colors.success,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeTagText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  passBox: { flexDirection: 'row', alignItems: 'center' },
  passLabel: { fontSize: 11, color: Colors.textMuted },
  passCode: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  credStoreText: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary },
  credEmailText: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  credAccessText: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  simulatorBanner: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: Colors.primary,
  },
  simulatorInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  simTitle: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  simSub: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  priceHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 6,
  },
  priceCol: { flex: 2, fontSize: 11, fontWeight: '800', color: Colors.primary },
  priceColSm: { flex: 1, fontSize: 11, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  priceItemName: { flex: 2, fontSize: 12, color: Colors.textPrimary, fontWeight: '600' },
  priceVal: { flex: 1, fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLabel: { fontSize: 12, color: Colors.textSecondary },
  settingValue: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 20,
  },
  logoutText: { fontSize: 13, fontWeight: '800', color: Colors.danger },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalSheetTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  roleSelectBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleSelectBtnActive: {
    backgroundColor: Colors.primarySubtle,
    borderColor: Colors.primary,
  },
  roleSelectTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  roleSelectTitleActive: {
    color: Colors.primary,
  },
  roleSelectSub: {
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  roleSelectSubActive: {
    color: Colors.primary,
  },
  storePickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  storePickerBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  storePickerBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  storePickerText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  storePickerTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
