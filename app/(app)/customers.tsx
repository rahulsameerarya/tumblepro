import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOrders } from '../../contexts/OrderContext';
import { useAuth } from '../../contexts/AuthContext';
import RoleSwitcherBar from '../../components/common/RoleSwitcherBar';
import { Colors } from '../../constants/Colors';
import { Order } from '../../utils/storage';

interface CustomerSummary {
  name: string;
  phone: string;
  address: string;
  pincode: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  storeName: string;
}

export default function CustomersScreen() {
  const { orders } = useOrders();
  const { user, isSuperAdmin } = useAuth();

  // Aggregate customers from orders (respects role tenant isolation)
  const customers = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    for (const order of orders) {
      const key = `${order.customerPhone.trim()}_${order.customerName.trim().toLowerCase()}`;
      const existing = map.get(key);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.paymentStatus === 'Paid' ? order.totalAmount : 0;
        if (new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
          existing.address = order.customerAddress;
          existing.pincode = order.pincode;
        }
      } else {
        map.set(key, {
          name: order.customerName,
          phone: order.customerPhone,
          address: order.customerAddress,
          pincode: order.pincode,
          orderCount: 1,
          totalSpent: order.paymentStatus === 'Paid' ? order.totalAmount : 0,
          lastOrderDate: order.createdAt,
          storeName: order.storeName,
        });
      }
    }

    return Array.from(map.values());
  }, [orders]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`).catch(() => {
      Alert.alert('Calling', `Dialing ${phone}`);
    });
  };

  return (
    <View style={styles.container}>
      <RoleSwitcherBar />

      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Customer Directory</Text>
            <Text style={styles.subtitle}>
              {isSuperAdmin
                ? `All 4 Hub Customers (${customers.length})`
                : `${user?.storeName?.replace('TumblePro - ', '') || 'Store'} Customers (${customers.length})`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.webContainer}>
        <FlatList
          data={customers}
          keyExtractor={(item) => item.phone + item.name}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{item.name[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.phone}>{item.phone}</Text>
                </View>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(item.phone)}
                >
                  <Ionicons name="call" size={14} color="#FFFFFF" />
                  <Text style={styles.callText}>Call</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <Ionicons name="location-outline" size={14} color={Colors.primary} />
                <Text style={styles.addressText} numberOfLines={1}>
                  {item.address ? `${item.address} (PIN ${item.pincode})` : `Pincode: ${item.pincode}`}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Orders</Text>
                  <Text style={styles.statVal}>{item.orderCount}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Spent</Text>
                  <Text style={[styles.statVal, { color: Colors.success }]}>
                    ₹{item.totalSpent.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Assigned Hub</Text>
                  <Text style={styles.statValHub} numberOfLines={1}>
                    {item.storeName.replace('TumblePro - ', '')}
                  </Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No customers found in this store queue</Text>
            </View>
          }
        />
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  webContainer: {
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  title: { fontSize: 18, fontWeight: '900', color: Colors.textPrimary },
  subtitle: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F2C59',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  name: { fontSize: 14, fontWeight: '800', color: Colors.textPrimary },
  phone: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  callText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  addressText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600' },
  statVal: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginTop: 2 },
  statValHub: { fontSize: 11, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  emptyBox: { alignItems: 'center', padding: 50, gap: 10 },
  emptyTitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});
