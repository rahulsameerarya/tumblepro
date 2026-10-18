import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useOrders, filterOrdersByTimeframe, Timeframe } from '../../../contexts/OrderContext';
import { useAuth } from '../../../contexts/AuthContext';
import OrderCard from '../../../components/orders/OrderCard';
import RoleSwitcherBar from '../../../components/common/RoleSwitcherBar';
import { Colors } from '../../../constants/Colors';
import { ORDER_STATUSES } from '../../../constants/Orders';
import { Order } from '../../../utils/storage';

const STATUS_FILTERS = ['All', ...ORDER_STATUSES];

const TIMEFRAME_FILTERS: { id: Timeframe; label: string; icon: string }[] = [
  { id: 'all', label: 'All Time', icon: 'infinite-outline' },
  { id: 'day', label: 'Today', icon: 'today-outline' },
  { id: 'week', label: 'This Week', icon: 'calendar-outline' },
  { id: 'month', label: 'This Month', icon: 'calendar-number-outline' },
  { id: 'year', label: 'This Year', icon: 'bar-chart-outline' },
];

export default function OrdersScreen() {
  const { orders, refreshOrders } = useOrders();
  const { user, isSuperAdmin } = useAuth();
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('all');
  const [search, setSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      refreshOrders();
    }, [refreshOrders])
  );

  // Filter by Timeframe first
  const timeframeFiltered = filterOrdersByTimeframe(orders, activeTimeframe);

  // Then filter by Status and Search
  const filtered = timeframeFiltered.filter((o: Order) => {
    const matchFilter = activeFilter === 'All' || o.status === activeFilter;
    const q = search.toLowerCase().trim();
    if (!q) return matchFilter;

    const matchSearch =
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.includes(q) ||
      o.orderNumber.toLowerCase().includes(q) ||
      (o.tagInfo && o.tagInfo.tagId.toLowerCase().includes(q)) ||
      (o.bagTagNumber && o.bagTagNumber.toLowerCase().includes(q)) ||
      (o.pincode && o.pincode.includes(q)) ||
      (o.storeName && o.storeName.toLowerCase().includes(q));

    return matchFilter && matchSearch;
  });

  return (
    <View style={styles.container}>
      <RoleSwitcherBar />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View>
            <Text style={styles.title}>Orders & Laundry Leads</Text>
            <Text style={styles.subtitle}>
              {isSuperAdmin
                ? `Network Consolidated (${orders.length} total orders across 4 hubs)`
                : `${user?.storeName?.replace('TumblePro - ', '') || 'Store Hub'} (${orders.length} orders)`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(app)/orders/new')}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>+ New Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.webContainer}>
        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by customer name, phone, bag tag, order #, PIN..."
            placeholderTextColor={Colors.textMuted}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Timeframe Filter Row */}
        <View style={styles.timeframeRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeframeScroll}>
            <View style={styles.timeframeLabelWrap}>
              <Ionicons name="calendar-outline" size={12} color={Colors.primary} />
              <Text style={styles.timeframeLabel}>TIME:</Text>
            </View>
            {TIMEFRAME_FILTERS.map((t) => {
              const isActive = activeTimeframe === t.id;
              const countInTimeframe = filterOrdersByTimeframe(orders, t.id).length;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.timeChip, isActive && styles.timeChipActive]}
                  onPress={() => setActiveTimeframe(t.id)}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={12}
                    color={isActive ? '#FFFFFF' : Colors.textSecondary}
                  />
                  <Text style={[styles.timeChipText, isActive && styles.timeChipTextActive]}>
                    {t.label}
                  </Text>
                  <View style={[styles.timeCountBadge, isActive && styles.timeCountBadgeActive]}>
                    <Text style={[styles.timeCountText, isActive && styles.timeCountTextActive]}>
                      {countInTimeframe}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Status Filter Horizontal Tabs */}
        <View style={styles.statusFilterWrap}>
          <FlatList
            horizontal
            data={STATUS_FILTERS}
            keyExtractor={(f) => f}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterList}
            renderItem={({ item }) => {
              const count = item === 'All'
                ? timeframeFiltered.length
                : timeframeFiltered.filter((o) => o.status === item).length;
              const isActive = activeFilter === item;

              return (
                <TouchableOpacity
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setActiveFilter(item)}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {item}
                  </Text>
                  {count > 0 && (
                    <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                      <Text
                        style={[
                          styles.filterBadgeText,
                          isActive && { color: Colors.primary },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Orders List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.orderList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => router.push(`/(app)/orders/${item.id}` as any)}
              showStoreBadge={isSuperAdmin}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="receipt-outline" size={38} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySub}>
                {search
                  ? 'Try a different search term or clear the filter.'
                  : `No orders matching status "${activeFilter}" in this period.`}
              </Text>
              {(activeFilter !== 'All' || activeTimeframe !== 'all') && (
                <TouchableOpacity
                  style={styles.clearFilterBtn}
                  onPress={() => {
                    setActiveFilter('All');
                    setActiveTimeframe('all');
                    setSearch('');
                  }}
                >
                  <Text style={styles.clearFilterBtnText}>Reset All Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
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
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  webContainer: {
    maxWidth: 1040,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
  },

  // Timeframe filter row
  timeframeRow: {
    marginBottom: 6,
  },
  timeframeScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  timeframeLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  timeframeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 6,
  },
  timeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  timeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  timeCountBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  timeCountBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  timeCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  timeCountTextActive: {
    color: '#FFFFFF',
  },

  // Status Filter tabs
  statusFilterWrap: {
    height: 44,
    marginBottom: 4,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondaryDark,
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  filterBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: '#FFFFFF',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  orderList: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  clearFilterBtn: {
    marginTop: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  clearFilterBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
});
