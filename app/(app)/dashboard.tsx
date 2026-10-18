import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import {
  useOrders,
  getDashboardStats,
  filterOrdersByTimeframe,
  getTimeframeDescription,
  Timeframe,
} from '../../contexts/OrderContext';
import StatCard from '../../components/dashboard/StatCard';
import OrderCard from '../../components/orders/OrderCard';
import RoleSwitcherBar from '../../components/common/RoleSwitcherBar';
import AssignDeliveryModal from '../../components/orders/AssignDeliveryModal';
import { Colors } from '../../constants/Colors';
import { Order } from '../../utils/storage';

export default function DashboardScreen() {
  const { user, logout, isSuperAdmin, isStoreManager, isDeliveryBoy } = useAuth();
  const {
    orders,
    allOrders,
    stores,
    deliveryBoys,
    isLoading,
    refreshOrders,
    activeStoreFilter,
    setActiveStoreFilter,
    assignDeliveryBoy,
  } = useOrders();

  // Timeframe filter state: day (Today), week (Weekly), month (Monthly), year (Yearly), all (All Time)
  const [timeframe, setTimeframe] = useState<Timeframe>('day');
  const [customDate, setCustomDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const stats = getDashboardStats(orders, timeframe, customDate || undefined);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Modal for lead assignment
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<Order | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Leads that arrived at this store but are not yet assigned to a delivery boy
  const unassignedLeads = orders.filter((o) => o.status === 'Lead Received');

  // Filtered orders matching selected timeframe or custom date for recent view
  const timeframeOrders = filterOrdersByTimeframe(orders, timeframe, customDate || undefined);
  const displayOrders = timeframeOrders.slice(0, 5);

  const getTimeframeLabel = () => {
    if (customDate) {
      const d = new Date(customDate);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : 'Selected Date';
    }
    switch (timeframe) {
      case 'day':
        return "Today's";
      case 'week':
        return "Weekly";
      case 'month':
        return "Monthly";
      case 'year':
        return "Yearly";
      default:
        return 'All Time';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Role & Tenant Isolation Bar */}
      <RoleSwitcherBar />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshOrders}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.headerInner}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{greeting()},</Text>
              <Text style={styles.userName}>
                {user?.name?.split(' ')[0] ?? 'User'} 👋
              </Text>
              <Text style={styles.scopeBadge}>
                {isSuperAdmin
                  ? '🌐 Super Admin (Network Wide Analytics)'
                  : `🏬 ${user?.storeName?.replace('TumblePro - ', '') || 'Store Hub'}`}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => router.push('/(app)/customer-portal')}
                accessibilityLabel="Customer Portal"
              >
                <Ionicons name="cart-outline" size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionIconBtn}
                onPress={() => router.push('/(app)/orders/new')}
                accessibilityLabel="New Order"
              >
                <Ionicons name="add-circle-outline" size={20} color={Colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                <Ionicons name="log-out-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Animated.View style={[styles.webContainer, { opacity: fadeAnim }]}>
          {/* Super Admin Store Filter Selector */}
          {isSuperAdmin && (
            <View style={styles.filterSection}>
              <View style={styles.filterHeader}>
                <Ionicons name="filter" size={14} color={Colors.primary} />
                <Text style={styles.filterLabel}>STORE HUB FILTER (SUPER ADMIN)</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, activeStoreFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setActiveStoreFilter('all')}
                >
                  <Text style={[styles.filterChipText, activeStoreFilter === 'all' && styles.filterChipTextActive]}>
                    All Stores ({allOrders.length})
                  </Text>
                </TouchableOpacity>
                {stores.map((s) => {
                  const isSelected = activeStoreFilter === s.id;
                  const storeOrderCount = allOrders.filter((o) => o.storeId === s.id).length;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.filterChip, isSelected && styles.filterChipActive]}
                      onPress={() => setActiveStoreFilter(s.id)}
                    >
                      <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                        {s.code}: {s.name.replace('TumblePro - ', '')} ({storeOrderCount})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Executive Time Period & Date Selector */}
          <View style={styles.timeframeCard}>
            <View style={styles.timeframeTitleRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="calendar" size={16} color={Colors.primary} />
                <Text style={styles.timeframeTitle}>TIME PERIOD ANALYTICS</Text>
              </View>
              <View style={styles.activePeriodBadge}>
                <Ionicons name="time-outline" size={12} color={Colors.primary} />
                <Text style={styles.activePeriodText}>
                  {customDate
                    ? `Date: ${new Date(customDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : getTimeframeDescription(timeframe)}
                </Text>
                {customDate && (
                  <TouchableOpacity onPress={() => setCustomDate(null)} style={{ marginLeft: 6 }}>
                    <Ionicons name="close-circle" size={14} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Modern Segmented Control Bar */}
            <View style={styles.periodTabsRow}>
              {[
                { id: 'day', label: 'Today', icon: 'today-outline' },
                { id: 'week', label: 'Weekly', icon: 'calendar-outline' },
                { id: 'month', label: 'Monthly', icon: 'calendar-number-outline' },
                { id: 'year', label: 'Yearly', icon: 'bar-chart-outline' },
                { id: 'all', label: 'All Time', icon: 'infinite-outline' },
              ].map((t) => {
                const active = !customDate && timeframe === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.periodTabBtn, active && styles.periodTabBtnActive]}
                    onPress={() => {
                      setCustomDate(null);
                      setTimeframe(t.id as Timeframe);
                    }}
                  >
                    <Ionicons
                      name={t.icon as any}
                      size={13}
                      color={active ? '#FFFFFF' : '#475569'}
                    />
                    <Text style={[styles.periodTabText, active && styles.periodTabTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Date Selector Button */}
              <TouchableOpacity
                style={[styles.dateSelectorBtn, !!customDate && styles.dateSelectorBtnActive]}
                onPress={() => setShowDatePicker(!showDatePicker)}
              >
                <Ionicons
                  name="calendar"
                  size={13}
                  color={customDate ? '#FFFFFF' : Colors.primary}
                />
                <Text style={[styles.dateSelectorBtnText, !!customDate && styles.dateSelectorBtnTextActive]}>
                  {customDate
                    ? new Date(customDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                    : 'Pick Date'}
                </Text>
                <Ionicons
                  name={showDatePicker ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color={customDate ? '#FFFFFF' : Colors.primary}
                />
              </TouchableOpacity>
            </View>

            {/* Custom Date Picker Popup / Panel */}
            {showDatePicker && (
              <View style={styles.datePickerCard}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>Filter Dashboard by Exact Date</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Ionicons name="close" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {Platform.OS === 'web' ? (
                  <View style={styles.webDateRow}>
                    <input
                      type="date"
                      defaultValue={customDate || new Date().toISOString().slice(0, 10)}
                      onChange={(e: any) => {
                        if (e.target.value) {
                          setCustomDate(e.target.value);
                          setShowDatePicker(false);
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1.5px solid #CBD5E1',
                        fontSize: '13px',
                        color: '#0F2C59',
                        fontWeight: '700',
                        backgroundColor: '#FFFFFF',
                        outline: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    />
                    <TouchableOpacity
                      style={styles.quickDateChip}
                      onPress={() => {
                        const y = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                        setCustomDate(y);
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={styles.quickDateChipText}>Yesterday</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.quickDateChip}
                      onPress={() => {
                        setCustomDate(new Date().toISOString().slice(0, 10));
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={styles.quickDateChipText}>Today</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.webDateRow}>
                    <TouchableOpacity
                      style={styles.quickDateChip}
                      onPress={() => {
                        const y = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                        setCustomDate(y);
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={styles.quickDateChipText}>Yesterday</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Revenue Card (Dynamically reflects selected timeframe) */}
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.revenueCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{ flex: 1 }}>
              <View style={styles.revenueTagPill}>
                <Ionicons name="sparkles" size={12} color={Colors.secondary} />
                <Text style={styles.revenueTagText}>
                  {getTimeframeLabel()} Revenue • {timeframe.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.revenueAmount}>
                ₹{stats.timeframeRevenue.toLocaleString('en-IN')}
              </Text>
              <Text style={styles.revenueSub}>
                Lifetime: ₹{stats.totalRevenue.toLocaleString('en-IN')} • {stats.timeframeOrdersCount} order{stats.timeframeOrdersCount !== 1 ? 's' : ''} in this period
              </Text>
            </View>

            <View style={styles.revenueRight}>
              <View style={styles.revenueCircleIcon}>
                <Ionicons name="trending-up" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.revenueCount}>
                {stats.timeframeOrdersCount} order{stats.timeframeOrdersCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </LinearGradient>

          {/* Priority Alert: Incoming Leads Needing Delivery Assignment */}
          {unassignedLeads.length > 0 && (
            <View style={styles.leadsAlertCard}>
              <View style={styles.leadsAlertHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="alert-circle" size={18} color="#D97706" />
                  <Text style={styles.leadsAlertTitle}>
                    {unassignedLeads.length} Pickup Lead{unassignedLeads.length > 1 ? 's' : ''} Require Delivery Assignment
                  </Text>
                </View>
                <View style={styles.leadsPulse} />
              </View>
              <Text style={styles.leadsAlertSub}>
                New customer orders auto-routed to this store based on customer pincode/GPS. Assign to delivery boy for collection:
              </Text>

              {unassignedLeads.slice(0, 3).map((lead) => (
                <View key={lead.id} style={styles.leadItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadCustomerName}>{lead.customerName}</Text>
                    <Text style={styles.leadAddress} numberOfLines={1}>
                      {lead.customerAddress} ({lead.pincode})
                    </Text>
                    <Text style={styles.leadTagText}>
                      🏷️ Hamper Tag: {lead.bagTagNumber || lead.tagInfo.tagId}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.assignBtn}
                    onPress={() => setSelectedLeadForAssign(lead)}
                  >
                    <Ionicons name="bicycle" size={14} color="#FFFFFF" />
                    <Text style={styles.assignBtnText}>Assign Fleet</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* 4 Stat Cards for the Selected Timeframe */}
          <View style={styles.statsRow}>
            <StatCard
              title={`Orders (${getTimeframeLabel()})`}
              value={stats.timeframeOrdersCount}
              subtitle={`${stats.totalOrders} Lifetime`}
              icon="receipt-outline"
              color={Colors.primary}
              bgColor={'#EFF6FF'}
              style={{ flex: 1 }}
            />
            <View style={{ width: 12 }} />
            <StatCard
              title="Pickup Leads"
              value={stats.leadsToAssignCount + stats.outForPickupCount}
              subtitle="Pending collection"
              icon="bicycle-outline"
              color={Colors.warning}
              bgColor={'#FFFBEB'}
              style={{ flex: 1 }}
            />
          </View>
          <View style={styles.statsRow}>
            <StatCard
              title="In Processing"
              value={stats.inProcessingCount}
              subtitle="Wash, Dry & Iron"
              icon="water-outline"
              color="#7C3AED"
              bgColor={'#F5F3FF'}
              style={{ flex: 1 }}
            />
            <View style={{ width: 12 }} />
            <StatCard
              title="Ready for Delivery"
              value={stats.readyCount}
              subtitle="Packaged & Tagged"
              icon="bag-check-outline"
              color={Colors.success}
              bgColor={'#ECFDF5'}
              style={{ flex: 1 }}
            />
          </View>

          {/* Super Admin 4 Stores Network Performance */}
          {isSuperAdmin && (
            <View style={styles.storesOverviewSection}>
              <View style={styles.sectionTitleRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="business" size={16} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>4 STORE HUBS PERFORMANCE ({getTimeframeLabel()})</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/(app)/stores')}>
                  <Text style={styles.viewAllText}>Manage Stores →</Text>
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {stores.map((s) => {
                  const storeAllOrders = allOrders.filter((o) => o.storeId === s.id);
                  const storePeriodOrders = filterOrdersByTimeframe(storeAllOrders, timeframe);
                  const storePeriodRev = storePeriodOrders
                    .filter((o) => o.paymentStatus === 'Paid')
                    .reduce((sum, o) => sum + o.totalAmount, 0);

                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.storeMiniCard, { borderTopColor: s.color }]}
                      onPress={() => {
                        setActiveStoreFilter(s.id);
                        router.push('/(app)/orders');
                      }}
                    >
                      <View style={styles.miniCardHeader}>
                        <Text style={styles.miniCode}>{s.code}</Text>
                        <View style={styles.onlineDot} />
                      </View>
                      <Text style={styles.miniName}>{s.name.replace('TumblePro - ', '')}</Text>
                      <Text style={styles.miniPincodes}>{s.pincodes.slice(0, 3).join(', ')}</Text>
                      <View style={styles.miniStats}>
                        <Text style={styles.miniOrders}>{storePeriodOrders.length} orders</Text>
                        <Text style={styles.miniRev}>₹{storePeriodRev.toLocaleString('en-IN')}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Quick Actions Bar */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(app)/customer-portal')}
            >
              <View style={[styles.quickActionInner, { backgroundColor: Colors.primary }]}>
                <Ionicons name="compass-outline" size={18} color="#FFFFFF" />
                <Text style={styles.quickActionText}>GPS Customer Portal</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => router.push('/(app)/orders/new')}
            >
              <View style={[styles.quickActionInner, { backgroundColor: Colors.secondary }]}>
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.quickActionText}>+ New Store Order</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Orders Section (Filtered by selected Timeframe) */}
          <View style={styles.sectionTitleRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="receipt-outline" size={16} color={Colors.primary} />
              <Text style={styles.sectionTitle}>
                {getTimeframeLabel()} Orders ({timeframeOrders.length})
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/orders')}>
              <Text style={styles.viewAllText}>View All ({orders.length}) →</Text>
            </TouchableOpacity>
          </View>

          {displayOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No orders in {getTimeframeLabel().toLowerCase()} period</Text>
              <Text style={styles.emptyText}>
                Try selecting "This Month" or "All Time" to view previous orders.
              </Text>
              <TouchableOpacity
                style={styles.resetTimeBtn}
                onPress={() => setTimeframe('all')}
              >
                <Text style={styles.resetTimeBtnText}>Switch to All Time</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPress={() => router.push(`/(app)/orders/${order.id}` as any)}
                showStoreBadge={isSuperAdmin}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Assign Delivery Boy Modal */}
      <AssignDeliveryModal
        visible={!!selectedLeadForAssign}
        order={selectedLeadForAssign}
        deliveryBoys={deliveryBoys}
        onClose={() => setSelectedLeadForAssign(null)}
        onAssign={assignDeliveryBoy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
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
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
  },
  webContainer: {
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  userName: { fontSize: 20, fontWeight: '900', color: Colors.textPrimary },
  scopeBadge: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  // Store Hub Filter
  filterSection: {
    marginBottom: 14,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  filterLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // Executive Timeframe & Date Selector Styles
  timeframeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  timeframeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  timeframeTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  activePeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 4,
  },
  activePeriodText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  periodTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  periodTabBtn: {
    flex: 1,
    minWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  periodTabBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  periodTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  periodTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  dateSelectorBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  dateSelectorBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  dateSelectorBtnTextActive: {
    color: '#FFFFFF',
  },
  datePickerCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginTop: 10,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  datePickerTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F2C59',
  },
  webDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickDateChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  quickDateChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F2C59',
  },

  // Revenue Card
  revenueCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  revenueTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  revenueTagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  revenueAmount: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  revenueSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  revenueRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  revenueCircleIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  revenueCount: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
    marginTop: 6,
  },

  // Leads Alert Card
  leadsAlertCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 16,
  },
  leadsAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leadsAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  leadsPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
  leadsAlertSub: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 16,
    marginBottom: 10,
  },
  leadItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  leadCustomerName: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  leadAddress: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  leadTagText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '800',
    marginTop: 3,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  assignBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Stats Grid
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  // Store Hubs Section
  storesOverviewSection: {
    marginVertical: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  viewAllText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '800',
  },
  storeMiniCard: {
    width: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderTopWidth: 3.5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  miniCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  miniCode: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.primary,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.success,
  },
  miniName: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 5,
  },
  miniPincodes: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  miniOrders: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  miniRev: {
    fontSize: 10,
    color: Colors.success,
    fontWeight: '900',
  },

  // Quick Action Buttons
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  quickActionInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Empty State
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  resetTimeBtn: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetTimeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  periodNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 6,
    marginBottom: 12,
    gap: 8,
  },
  navStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navStepBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  currentPeriodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primarySubtle,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  currentPeriodText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  timeframeSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  timeTabBtnHistoricalActive: {
    backgroundColor: Colors.secondaryDark,
    borderColor: Colors.secondaryDark,
  },
});
