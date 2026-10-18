import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getAllOrders,
  saveOrder,
  getOrderById,
  deleteOrder,
  generateId,
  generateOrderNumber,
  Order,
  OrderItem,
  Store,
  getAllStores,
  saveStore,
  DeliveryBoy,
  getAllDeliveryBoys,
  saveDeliveryBoy,
  findNearestStore,
  buildLaundryTagInfo,
  getScopedOrders,
} from '../utils/storage';
import { OrderStatus } from '../constants/Orders';
import { useAuth } from './AuthContext';

export interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  pincode: string;
  area?: string;
  serviceType: string;
  deliveryMode: string;
  packingType?: 'Hanger Cover' | 'Fold & Pack';
  items: OrderItem[];
  specialInstructions?: string;
  pickupDate?: string;
  deliveryDate?: string;
  bagCount?: number;
  explicitStoreId?: string; // Optional manual override
  coords?: { latitude: number; longitude: number };
}

export type Timeframe =
  | 'day'
  | 'yesterday'
  | 'week'
  | 'last_week'
  | 'month'
  | 'last_month'
  | 'year'
  | 'last_year'
  | 'all';

interface OrderContextType {
  orders: Order[];
  allOrders: Order[]; // For Super Admin global analytics
  stores: Store[];
  deliveryBoys: DeliveryBoy[];
  isLoading: boolean;
  activeStoreFilter: string; // 'all' or storeId
  setActiveStoreFilter: (storeId: string) => void;
  createOrder: (data: CreateOrderInput) => Promise<Order>;
  assignDeliveryBoy: (orderId: string, deliveryBoyId: string) => Promise<void>;
  markClothesCollected: (orderId: string, bagTagNumber?: string, bagTagColor?: string, actualBagCount?: number) => Promise<void>;
  markArrivedAtStore: (orderId: string) => Promise<void>;
  differentiateAndGenerateTags: (orderId: string, differentiatedItems?: OrderItem[], packingType?: 'Hanger Cover' | 'Fold & Pack') => Promise<void>;
  updateStatus: (id: string, status: OrderStatus | string) => Promise<void>;
  updatePayment: (id: string, paymentStatus: Order['paymentStatus'], method?: string) => Promise<void>;
  reassignStore: (orderId: string, newStoreId: string, reason?: string) => Promise<void>;
  addNewStore: (store: Store) => Promise<void>;
  addNewDeliveryBoy: (boy: DeliveryBoy) => Promise<void>;
  refreshOrders: () => Promise<void>;
  getOrder: (id: string) => Promise<Order | null>;
  removeOrder: (id: string) => Promise<void>;
  updateOrder: (id: string, updatedFields: Partial<Order>) => Promise<Order | null>;
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [deliveryBoys, setDeliveryBoys] = useState<DeliveryBoy[]>([]);
  const [activeStoreFilter, setActiveStoreFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const refreshOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const [allStoresData, allBoysData, fullOrdersData] = await Promise.all([
        getAllStores(),
        getAllDeliveryBoys(),
        getAllOrders(),
      ]);

      setStores(allStoresData);
      setAllOrders(fullOrdersData);

      // Filter delivery boys according to store manager role
      if (user?.role === 'store_manager' && user.storeId) {
        setDeliveryBoys(allBoysData.filter((b) => b.storeId === user.storeId));
      } else {
        setDeliveryBoys(allBoysData);
      }

      // Scoped orders based on role and active filter
      const scoped = await getScopedOrders(user, activeStoreFilter);
      setOrders(scoped);
    } finally {
      setIsLoading(false);
    }
  }, [user, activeStoreFilter]);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  async function createOrder(data: CreateOrderInput): Promise<Order> {
    const allStoresList = stores.length > 0 ? stores : await getAllStores();
    
    // 1. Auto-Route nearest store based on pincode & locality address
    let targetStore: Store;
    let routingReason: string;

    if (data.explicitStoreId) {
      const explicit = allStoresList.find((s) => s.id === data.explicitStoreId);
      targetStore = explicit || allStoresList[0] || (await getAllStores())[0];
      routingReason = `Manually selected: ${targetStore?.name || 'Selected Hub'}`;
    } else {
      const routing = findNearestStore(allStoresList, data.pincode, data.customerAddress, data.coords);
      targetStore = routing.store;
      routingReason = routing.reason;
    }

    if (!targetStore) {
      targetStore = (await getAllStores())[0];
      routingReason = 'Default regional hub';
    }

    // 2. Order number & total amount
    const orderNumber = generateOrderNumber();
    const items = data.items && data.items.length > 0 ? data.items : [];
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity || 1) * (item.unitPrice || 0), 0);
    const totalPieces = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // 3. Generate Unique Anti-Mixup Tag & QR payload
    const tagInfo = buildLaundryTagInfo(
      targetStore.code || 'HUB',
      orderNumber,
      (data.customerName || 'Valued Customer').trim(),
      data.bagCount || 1,
      totalPieces
    );

    const newOrder: Order = {
      id: generateId(),
      orderNumber,
      clothesDifferentiated: false,
      tagInfo,
      customerName: (data.customerName || 'Valued Customer').trim(),
      customerPhone: (data.customerPhone || '').trim(),
      customerAddress: (data.customerAddress || '').trim(),
      pincode: (data.pincode || '700156').trim(),
      area: data.area || targetStore.areas?.[0] || 'Local Area',
      storeId: targetStore.id,
      storeName: targetStore.name,
      routingReason,
      serviceType: data.serviceType,
      deliveryMode: data.deliveryMode,
      packingType: data.packingType || 'Hanger Cover',
      items: data.items,
      totalAmount,
      status: 'Lead Received', // Enters store queue for delivery assignment
      paymentStatus: 'Unpaid',
      specialInstructions: data.specialInstructions,
      pickupDate: data.pickupDate || 'Today, ASAP',
      deliveryDate: data.deliveryDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveOrder(newOrder);
    await refreshOrders();
    return newOrder;
  }

  async function assignDeliveryBoy(orderId: string, deliveryBoyId: string) {
    const order = await getOrderById(orderId);
    if (!order) return;

    const allBoys = await getAllDeliveryBoys();
    const boy = allBoys.find((b) => b.id === deliveryBoyId);
    if (!boy) return;

    const updated: Order = {
      ...order,
      assignedDeliveryBoyId: boy.id,
      assignedDeliveryBoyName: boy.name,
      assignedDeliveryBoyPhone: boy.phone,
      status: 'Assigned for Pickup',
      updatedAt: new Date().toISOString(),
    };

    // Update boy active orders count
    const updatedBoy: DeliveryBoy = {
      ...boy,
      activeOrdersCount: (boy.activeOrdersCount || 0) + 1,
      status: 'on_pickup',
    };
    await saveDeliveryBoy(updatedBoy);
    await saveOrder(updated);
    await refreshOrders();
  }

  // Stage 1 Tagging: At customer doorstep, delivery partner assigns ONLY Hamper Bag Tag Number
  async function markClothesCollected(
    orderId: string,
    bagTagNumber?: string,
    bagTagColor?: string,
    actualBagCount?: number
  ) {
    const order = await getOrderById(orderId);
    if (!order) return;

    const count = actualBagCount || order.tagInfo.bagCount || 1;
    const generatedBagTag = bagTagNumber || order.bagTagNumber || `BAG-${order.tagInfo.tagId.split('-')[1] || 'HUB'}-${order.orderNumber}`;

    const updatedTagInfo = {
      ...order.tagInfo,
      bagCount: count,
    };

    const updated: Order = {
      ...order,
      bagTagNumber: generatedBagTag,
      bagTagColor: bagTagColor || order.bagTagColor || order.tagInfo.colorHex || '#0F2C59',
      clothesDifferentiated: false, // Remains false until store manager opens and sorts
      tagInfo: updatedTagInfo,
      status: 'Picked Up (Bag Tagged)',
      pickedUpAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveOrder(updated);
    await refreshOrders();
  }

  // Arrival at Store Hub: Bag safely brought to store
  async function markArrivedAtStore(orderId: string) {
    const order = await getOrderById(orderId);
    if (!order) return;

    const updated: Order = {
      ...order,
      status: 'Arrived at Store',
      updatedAt: new Date().toISOString(),
    };

    await saveOrder(updated);
    await refreshOrders();
  }

  // Stage 2 Tagging: Store Manager opens hamper bag, differentiates clothes, and generates individual tags
  async function differentiateAndGenerateTags(
    orderId: string,
    differentiatedItems?: OrderItem[],
    packingType?: 'Hanger Cover' | 'Fold & Pack'
  ) {
    const order = await getOrderById(orderId);
    if (!order) return;

    const itemsToSave = differentiatedItems || order.items;
    const totalAmount = itemsToSave.reduce((sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0), 0);

    const updated: Order = {
      ...order,
      clothesDifferentiated: true,
      differentiatedAt: new Date().toISOString(),
      differentiatedBy: user?.name || 'Store Manager',
      items: itemsToSave,
      totalAmount: totalAmount > 0 ? totalAmount : order.totalAmount,
      packingType: packingType || order.packingType || 'Hanger Cover',
      status: 'Clothes Tagged & Sorted',
      updatedAt: new Date().toISOString(),
    };

    await saveOrder(updated);
    await refreshOrders();
  }

  async function updateStatus(id: string, status: OrderStatus | string) {
    const order = await getOrderById(id);
    if (!order) return;

    const updated: Order = {
      ...order,
      status,
      updatedAt: new Date().toISOString(),
    };
    await saveOrder(updated);
    await refreshOrders();
  }

  async function updatePayment(id: string, paymentStatus: Order['paymentStatus'], method?: string) {
    const order = await getOrderById(id);
    if (!order) return;

    const updated: Order = {
      ...order,
      paymentStatus,
      paymentMethod: method,
      updatedAt: new Date().toISOString(),
    };
    await saveOrder(updated);
    await refreshOrders();
  }

  async function reassignStore(orderId: string, newStoreId: string, reason?: string) {
    const order = await getOrderById(orderId);
    if (!order) return;

    const targetStore = stores.find((s) => s.id === newStoreId);
    if (!targetStore) return;

    const updated: Order = {
      ...order,
      storeId: targetStore.id,
      storeName: targetStore.name,
      routingReason: reason || `Manually re-assigned by Super Admin to ${targetStore.name}`,
      assignedDeliveryBoyId: undefined, // Clear assignment since it's a new store
      assignedDeliveryBoyName: undefined,
      assignedDeliveryBoyPhone: undefined,
      updatedAt: new Date().toISOString(),
    };

    await saveOrder(updated);
    await refreshOrders();
  }

  async function addNewStore(store: Store) {
    await saveStore(store);
    await refreshOrders();
  }

  async function addNewDeliveryBoy(boy: DeliveryBoy) {
    await saveDeliveryBoy(boy);
    await refreshOrders();
  }

  async function getOrder(id: string) {
    return getOrderById(id);
  }

  async function removeOrder(id: string) {
    await deleteOrder(id);
    await refreshOrders();
  }

  async function updateOrder(id: string, updatedFields: Partial<Order>): Promise<Order | null> {
    const existing = await getOrderById(id);
    if (!existing) return null;

    const merged: Order = {
      ...existing,
      ...updatedFields,
      updatedAt: new Date().toISOString(),
    };

    if (updatedFields.items) {
      merged.totalAmount = updatedFields.items.reduce(
        (sum, it) => sum + (it.quantity || 1) * (it.unitPrice || 0),
        0
      );
    }

    await saveOrder(merged);
    await refreshOrders();
    return merged;
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        allOrders,
        stores,
        deliveryBoys,
        isLoading,
        activeStoreFilter,
        setActiveStoreFilter,
        createOrder,
        assignDeliveryBoy,
        markClothesCollected,
        markArrivedAtStore,
        differentiateAndGenerateTags,
        updateStatus,
        updatePayment,
        reassignStore,
        addNewStore,
        addNewDeliveryBoy,
        refreshOrders,
        getOrder,
        removeOrder,
        updateOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used inside OrderProvider');
  return ctx;
}

// ─── Timeframe & Date Filtering Helper ──────────────────────────
export function filterOrdersByTimeframe(
  orders: Order[],
  timeframe: Timeframe,
  customDate?: string
): Order[] {
  if (customDate) {
    const target = new Date(customDate);
    if (!isNaN(target.getTime())) {
      const targetStr = target.toDateString();
      return orders.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return !isNaN(orderDate.getTime()) && orderDate.toDateString() === targetStr;
      });
    }
  }

  if (timeframe === 'all') return orders;
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return orders.filter((order) => {
    const orderDate = new Date(order.createdAt);
    if (isNaN(orderDate.getTime())) return true;

    switch (timeframe) {
      case 'day':
        return orderDate.toDateString() === now.toDateString();

      case 'yesterday':
        return orderDate.toDateString() === yesterday.toDateString();

      case 'week': {
        const diffMs = now.getTime() - orderDate.getTime();
        return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
      }

      case 'last_week': {
        const diffDays = (now.getTime() - orderDate.getTime()) / (24 * 60 * 60 * 1000);
        return diffDays > 7 && diffDays <= 14;
      }

      case 'month':
        return (
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear()
        );

      case 'last_month': {
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        return (
          orderDate.getMonth() === prevMonth &&
          orderDate.getFullYear() === prevYear
        );
      }

      case 'year':
        return orderDate.getFullYear() === now.getFullYear();

      case 'last_year':
        return orderDate.getFullYear() === now.getFullYear() - 1;

      default:
        return true;
    }
  });
}

export function getTimeframeDescription(timeframe: Timeframe, customDate?: string): string {
  if (customDate) {
    const d = new Date(customDate);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  switch (timeframe) {
    case 'day':
      return `Today (${now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
    case 'yesterday':
      return `Yesterday (${yesterday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`;
    case 'week':
      return 'This Week (Past 7 Days)';
    case 'last_week':
      return 'Last Week (7–14 Days Ago)';
    case 'month':
      return `This Month (${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`;
    case 'last_month':
      return `Last Month (${prevMonthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })})`;
    case 'year':
      return `This Year (${now.getFullYear()})`;
    case 'last_year':
      return `Last Year (${now.getFullYear() - 1})`;
    case 'all':
      return 'All-Time Lifetime Records';
    default:
      return 'Selected Period';
  }
}

// ─── Derived Statistics Helper with Timeframe Support ───────────
export function getDashboardStats(orders: Order[], timeframe: Timeframe = 'all', customDate?: string) {
  const filtered = filterOrdersByTimeframe(orders, timeframe, customDate);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.createdAt).toDateString() === today);

  const leadsToAssign = filtered.filter((o) => o.status === 'Lead Received');
  const outForPickup = filtered.filter((o) => o.status === 'Assigned for Pickup');
  const inProcessing = filtered.filter((o) =>
    ['Picked Up', 'Picked Up (Bag Tagged)', 'Arrived at Store', 'Clothes Tagged & Sorted', 'Washing', 'Drying', 'Ironing'].includes(o.status)
  );
  const ready = filtered.filter((o) => o.status === 'Ready');
  const delivered = filtered.filter((o) => o.status === 'Delivered');

  const pending = filtered.filter((o) => !['Delivered'].includes(o.status)).length;
  const completed = delivered.length;

  const timeframeRevenue = filtered
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((s, o) => s + o.totalAmount, 0);

  const revenueToday = todayOrders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((s, o) => s + o.totalAmount, 0);

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'Paid')
    .reduce((s, o) => s + o.totalAmount, 0);

  return {
    timeframe,
    timeframeOrdersCount: filtered.length,
    todayOrdersCount: todayOrders.length,
    totalOrders: orders.length,
    leadsToAssignCount: leadsToAssign.length,
    outForPickupCount: outForPickup.length,
    inProcessingCount: inProcessing.length,
    readyCount: ready.length,
    pending,
    completed,
    timeframeRevenue,
    revenueToday,
    totalRevenue,
  };
}
