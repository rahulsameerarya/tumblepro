import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';

export default function RoleSwitcherBar() {
  const { user, logout, isSuperAdmin, isStoreManager, isDeliveryBoy, presetUsers, switchAccount } = useAuth();
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const handleLogout = async () => {
    setProfileModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const getStoreBadge = () => {
    if (isSuperAdmin) {
      return {
        role: 'SUPER ADMIN',
        title: 'Global Corporate Network',
        tag: '🌐 Full Network Oversight',
        color: Colors.secondaryDark,
        bgColor: Colors.secondaryBg,
      };
    }
    if (isStoreManager) {
      return {
        role: 'STORE MANAGER',
        title: user?.storeName?.replace('TumblePro - ', '') || 'Store Hub',
        tag: '🔒 Store Isolated',
        color: Colors.primary,
        bgColor: Colors.primarySubtle,
      };
    }
    return {
      role: 'DELIVERY AGENT',
      title: user?.storeName?.replace('TumblePro - ', '') || 'Delivery Fleet',
      tag: '🛵 Doorstep Collection',
      color: Colors.accentCyan,
      bgColor: Colors.accentCyanBg,
    };
  };

  const badge = getStoreBadge();

  return (
    <>
      <View style={styles.container}>
        <View style={styles.inner}>
          {/* Brand Logo & Slogan */}
          <View style={styles.brandGroup}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.dividerV} />
            {/* Store Identification */}
            <View style={styles.storeContext}>
              <View style={styles.storeRow}>
                <Text style={styles.storeTitle}>{badge.title}</Text>
                <View style={[styles.statusPill, { backgroundColor: badge.bgColor }]}>
                  <Text style={[styles.statusText, { color: badge.color }]}>{badge.tag}</Text>
                </View>
              </View>
              <Text style={styles.slogan}>We Care For What You Wear</Text>
            </View>
          </View>

          {/* User Profile & Actions */}
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.simBtn}
              onPress={() => router.push('/(app)/customer-portal')}
            >
              <Ionicons name="cart-outline" size={15} color={Colors.secondaryDark} />
              <Text style={styles.simBtnText}>Simulator</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.userProfileBtn}
              onPress={() => setProfileModalVisible(true)}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{user?.name?.[0] || 'U'}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name?.split(' ')[0] || 'User'}
                </Text>
                <Text style={styles.userRole}>{badge.role}</Text>
              </View>
              <Ionicons name="chevron-down" size={14} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* User Session & Store Details Modal */}
      <Modal visible={profileModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.profileModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Store Session Profile</Text>
              <TouchableOpacity onPress={() => setProfileModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileCard}>
              <View style={styles.largeAvatar}>
                <Text style={styles.largeAvatarText}>{user?.name?.[0] || 'T'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user?.name}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: badge.bgColor }]}>
                  <Text style={[styles.roleBadgeText, { color: badge.color }]}>{badge.role}</Text>
                </View>
              </View>
            </View>

            {/* Store details info */}
            <View style={styles.detailsBox}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Assigned Hub:</Text>
                <Text style={styles.detailValue}>{user?.storeName || 'Global Consolidated'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tenant Isolation:</Text>
                <Text style={styles.detailValueGreen}>
                  {isSuperAdmin ? 'Full Network Oversight' : 'Strictly Scoped by Store ID'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Security:</Text>
                <Text style={styles.detailValue}>Individual Store Password Active</Text>
              </View>
            </View>

            {/* If Super Admin, show store switch options */}
            {isSuperAdmin && (
              <View style={styles.adminSwitchSection}>
                <Text style={styles.adminSwitchLabel}>Super Admin: Quick Switch Hub View</Text>
                <ScrollView style={{ maxHeight: 160 }}>
                  {presetUsers.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.switchRow,
                        user?.id === preset.id && styles.switchRowActive,
                      ]}
                      onPress={async () => {
                        await switchAccount(preset);
                        setProfileModalVisible(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.switchName}>{preset.name}</Text>
                        <Text style={styles.switchSub}>{preset.storeName || 'All Hubs'}</Text>
                      </View>
                      {user?.id === preset.id && (
                        <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Logout Action */}
            <TouchableOpacity style={styles.modalLogoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
              <Text style={styles.modalLogoutText}>Sign Out from Store</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 40,
  },
  dividerV: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  storeContext: {
    justifyContent: 'center',
  },
  storeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: Colors.primary,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  slogan: {
    fontSize: 9,
    fontWeight: '600',
    color: Colors.secondaryDark,
    marginTop: 1,
    letterSpacing: 0.4,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.secondaryBg,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.secondaryBorder,
  },
  simBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryDark,
  },
  userProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
  },
  userInfo: {
    marginRight: 2,
  },
  userName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userRole: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  logoutBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: Colors.dangerBg,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },

  // ─── Profile Modal ────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  profileModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    width: '100%',
    maxWidth: 460,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.primary,
  },
  closeBtn: {
    padding: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  largeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeAvatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  detailValueGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.success,
  },
  adminSwitchSection: {
    marginBottom: 14,
  },
  adminSwitchLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.secondaryDark,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    marginBottom: 6,
  },
  switchRowActive: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  switchName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  switchSub: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  modalLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.dangerBg,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  modalLogoutText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.danger,
  },
});
