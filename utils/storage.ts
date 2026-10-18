import AsyncStorage from '@react-native-async-storage/async-storage';
import { TAG_COLORS } from '../constants/Orders';

const KEYS = {
  USER: '@tumblepro_user_v4',
  USERS_LIST: '@tumblepro_users_list_v4',
  ORDERS: '@tumblepro_orders_v4',
  STORES: '@tumblepro_stores_v4',
  DELIVERY_BOYS: '@tumblepro_delivery_boys_v4',
  SETTINGS: '@tumblepro_settings_v4',
  INITIALIZED: '@tumblepro_initialized_v4',
};

// ─── Store Model ────────────────────────────────────────────────
export interface Store {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  pincodes: string[];
  areas: string[];
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  capacityPerDay: number;
  color: string;
  status: 'active' | 'busy' | 'offline';
  lat: number;
  lng: number;
}

export const DEFAULT_STORES: Store[] = [
  {
    id: 'store-newtown',
    name: 'Newtown Store, CC Block',
    code: 'NWT',
    address: 'Plot No. CC-14, Action Area 1, CC Block, Newtown, Kolkata, West Bengal',
    phone: '+91 98301 11001',
    email: 'newtown@tumblepro.com',
    pincodes: ['700156', '700135', '700160', '700157', '700091'],
    areas: ['Newtown', 'CC Block', 'Action Area 1', 'Rajarhat', 'Salt Lake Sector V', 'Chinar Park', 'Eco Park'],
    managerName: 'Vivek',
    managerEmail: 'newtown@tumblepro.com',
    managerPhone: '+91 98301 11001',
    capacityPerDay: 200,
    color: '#0F2C59',
    status: 'active',
    lat: 22.5850,
    lng: 88.4600,
  },
  {
    id: 'store-sepa',
    name: 'Sepa Store, Itanagar',
    code: 'SEP',
    address: 'Main Market Road, Near SBI, Seppa / Itanagar, Arunachal Pradesh',
    phone: '+91 98620 22002',
    email: 'sepa@tumblepro.com',
    pincodes: ['790102', '790103', '791113'],
    areas: ['Seppa', 'Sepa', 'East Kameng', 'Pappu Valley', 'Ganga Lake', 'Itanagar Hills', 'Zero Point'],
    managerName: 'Tadar Tani',
    managerEmail: 'sepa@tumblepro.com',
    managerPhone: '+91 98620 22002',
    capacityPerDay: 140,
    color: '#10B981',
    status: 'active',
    lat: 27.3500,
    lng: 93.0300,
  },
  {
    id: 'store-tinsukhia',
    name: 'Tinsukhia Store, Assam',
    code: 'TSK',
    address: 'AT Road, Near Thana Chariali, Tinsukia, Assam',
    phone: '+91 98540 33003',
    email: 'tinsukhia@tumblepro.com',
    pincodes: ['786125', '786126', '786146', '786192'],
    areas: ['Tinsukia', 'Tinsukhia', 'Thana Chariali', 'Borguri', 'Chirwapatty', 'Makum', 'Hijuguri', 'Assam Trunk Rd'],
    managerName: 'Bhaskar Baruah',
    managerEmail: 'tinsukhia@tumblepro.com',
    managerPhone: '+91 98540 33003',
    capacityPerDay: 180,
    color: '#C59A27',
    status: 'active',
    lat: 27.4922,
    lng: 95.3468,
  },
  {
    id: 'store-naharlagun',
    name: 'NaharLagun, Itanagar',
    code: 'NHR',
    address: 'E-Sector, Near Daily Market, Naharlagun, Itanagar Capital Complex, Arunachal Pradesh',
    phone: '+91 98630 44004',
    email: 'naharlagun@tumblepro.com',
    pincodes: ['791110', '791111', '791112'],
    areas: ['Naharlagun', 'NaharLagun', 'E-Sector', 'A-Sector', 'Model Village', 'Polo Colony', 'Nirjuli', 'Banderdewa'],
    managerName: 'Nabam Tado',
    managerEmail: 'naharlagun@tumblepro.com',
    managerPhone: '+91 98630 44004',
    capacityPerDay: 160,
    color: '#0EA5E9',
    status: 'active',
    lat: 27.1060,
    lng: 93.6930,
  },
];

// ─── Delivery Boy Model ─────────────────────────────────────────
export interface DeliveryBoy {
  id: string;
  name: string;
  phone: string;
  storeId: string;
  storeName: string;
  vehicleNumber: string;
  status: 'available' | 'on_pickup' | 'on_delivery' | 'offline';
  activeOrdersCount: number;
  avatarColor: string;
  rating: number;
}

export const DEFAULT_DELIVERY_BOYS: DeliveryBoy[] = [
  {
    id: 'del-nwt-1',
    name: 'Sudu',
    phone: '+91 98311 22334',
    storeId: 'store-newtown',
    storeName: 'Newtown Store, CC Block',
    vehicleNumber: 'WB-06-AA-1122 (Activa)',
    status: 'available',
    activeOrdersCount: 1,
    avatarColor: '#0F2C59',
    rating: 4.9,
  },
  {
    id: 'del-nwt-2',
    name: 'Pritam Das',
    phone: '+91 98311 22335',
    storeId: 'store-newtown',
    storeName: 'Newtown Store, CC Block',
    vehicleNumber: 'WB-06-AB-3344 (Jupiter)',
    status: 'available',
    activeOrdersCount: 0,
    avatarColor: '#1E427B',
    rating: 4.8,
  },
  {
    id: 'del-sep-1',
    name: 'Tage Donyi',
    phone: '+91 98622 33445',
    storeId: 'store-sepa',
    storeName: 'Sepa Store, Itanagar',
    vehicleNumber: 'AR-01-4402 (Pulsar 150)',
    status: 'on_pickup',
    activeOrdersCount: 1,
    avatarColor: '#10B981',
    rating: 4.9,
  },
  {
    id: 'del-tsk-1',
    name: 'Debojit Gogoi',
    phone: '+91 98544 55667',
    storeId: 'store-tinsukhia',
    storeName: 'Tinsukhia Store, Assam',
    vehicleNumber: 'AS-23-9903 (Splendor+)',
    status: 'available',
    activeOrdersCount: 1,
    avatarColor: '#C59A27',
    rating: 4.8,
  },
  {
    id: 'del-nhr-1',
    name: 'Kaling Tayeng',
    phone: '+91 98633 66778',
    storeId: 'store-naharlagun',
    storeName: 'NaharLagun, Itanagar',
    vehicleNumber: 'AR-02-8804 (Access 125)',
    status: 'available',
    activeOrdersCount: 1,
    avatarColor: '#0EA5E9',
    rating: 4.9,
  },
];

// ─── User / Auth & Role Isolation ────────────────────────────────
export type UserRole = 'super_admin' | 'store_manager' | 'delivery_boy';

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  storeId?: string;
  storeName?: string;
  createdAt: string;
}

export interface StoreCredential {
  role: UserRole;
  title: string;
  storeName: string;
  storeId?: string;
  email: string;
  password: string;
  pincodes: string[];
  accessDesc: string;
  color: string;
}

export const STORE_CREDENTIALS: StoreCredential[] = [
  {
    role: 'super_admin',
    title: 'Super Admin (Corporate)',
    storeName: 'Consolidated Network (All 4 Stores)',
    email: 'admin@tumblepro.com',
    password: 'admin123',
    pincodes: ['All Regions (WB, AP, Assam)'],
    accessDesc: 'Full global visibility across all 4 stores, consolidated revenues, and cross-store routing',
    color: '#0F2C59',
  },
  {
    role: 'store_manager',
    title: 'Store Owner & Manager (Newtown)',
    storeName: 'Newtown Store, CC Block (Vivek)',
    storeId: 'store-newtown',
    email: 'newtown@tumblepro.com',
    password: 'newtown123',
    pincodes: ['700156', '700135', '700160', '700157', '700091'],
    accessDesc: 'Strictly Newtown Store, CC Block orders & staff (Sepa/Tinsukhia/Naharlagun hidden)',
    color: '#0F2C59',
  },
  {
    role: 'store_manager',
    title: 'Store Manager (Sepa)',
    storeName: 'Sepa Store, Itanagar',
    storeId: 'store-sepa',
    email: 'sepa@tumblepro.com',
    password: 'sepa123',
    pincodes: ['790102', '790103', '791113'],
    accessDesc: 'Strictly Sepa Store, Itanagar orders & delivery team',
    color: '#10B981',
  },
  {
    role: 'store_manager',
    title: 'Store Manager (Tinsukhia)',
    storeName: 'Tinsukhia Store, Assam',
    storeId: 'store-tinsukhia',
    email: 'tinsukhia@tumblepro.com',
    password: 'tinsukhia123',
    pincodes: ['786125', '786126', '786146', '786192'],
    accessDesc: 'Strictly Tinsukhia Store, Assam orders & delivery team',
    color: '#C59A27',
  },
  {
    role: 'store_manager',
    title: 'Store Manager (NaharLagun)',
    storeName: 'NaharLagun, Itanagar',
    storeId: 'store-naharlagun',
    email: 'naharlagun@tumblepro.com',
    password: 'nahar123',
    pincodes: ['791110', '791111', '791112'],
    accessDesc: 'Strictly NaharLagun, Itanagar orders & delivery team',
    color: '#0EA5E9',
  },
  {
    role: 'delivery_boy',
    title: 'Delivery Fleet Agent (Sudu)',
    storeName: 'Newtown Store, CC Block (Sudu)',
    storeId: 'store-newtown',
    email: 'fleet@tumblepro.com',
    password: 'fleet123',
    pincodes: ['700156', '700135'],
    accessDesc: 'Delivery app view: Doorstep pickups, bag tagging & collections',
    color: '#0284C7',
  },
];

export const PRESET_USERS: StoredUser[] = [
  {
    id: 'user-super-admin',
    name: 'Vikrant Deshmukh (Super Admin)',
    email: 'admin@tumblepro.com',
    passwordHash: 'admin123',
    role: 'super_admin',
    createdAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'user-mgr-newtown',
    name: 'Vivek (Store Owner & Manager - Newtown)',
    email: 'newtown@tumblepro.com',
    passwordHash: 'newtown123',
    role: 'store_manager',
    storeId: 'store-newtown',
    storeName: 'Newtown Store, CC Block',
    createdAt: new Date('2026-01-15').toISOString(),
  },
  {
    id: 'user-mgr-sepa',
    name: 'Tadar Tani (Store Manager - Sepa Store)',
    email: 'sepa@tumblepro.com',
    passwordHash: 'sepa123',
    role: 'store_manager',
    storeId: 'store-sepa',
    storeName: 'Sepa Store, Itanagar',
    createdAt: new Date('2026-01-15').toISOString(),
  },
  {
    id: 'user-mgr-tinsukhia',
    name: 'Bhaskar Baruah (Store Manager - Tinsukhia)',
    email: 'tinsukhia@tumblepro.com',
    passwordHash: 'tinsukhia123',
    role: 'store_manager',
    storeId: 'store-tinsukhia',
    storeName: 'Tinsukhia Store, Assam',
    createdAt: new Date('2026-02-01').toISOString(),
  },
  {
    id: 'user-mgr-naharlagun',
    name: 'Nabam Tado (Store Manager - NaharLagun)',
    email: 'naharlagun@tumblepro.com',
    passwordHash: 'nahar123',
    role: 'store_manager',
    storeId: 'store-naharlagun',
    storeName: 'NaharLagun, Itanagar',
    createdAt: new Date('2026-02-01').toISOString(),
  },
  {
    id: 'user-del-sudu',
    name: 'Sudu (Delivery Fleet)',
    email: 'fleet@tumblepro.com',
    passwordHash: 'fleet123',
    role: 'delivery_boy',
    storeId: 'store-newtown',
    storeName: 'Newtown Store, CC Block',
    createdAt: new Date('2026-02-10').toISOString(),
  },
];

// ─── Orders ─────────────────────────────────────────────────────
export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  packingType?: 'Hanger Cover' | 'Fold & Pack';
  serviceCategory?: string;
  notes?: string;
}

export interface LaundryTagInfo {
  tagId: string;
  colorName: string;
  colorHex: string;
  basketLabel: string;
  bagCount: number;
  qrPayload: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  // Two-stage tagging:
  // Stage 1 at pickup: Bag Tag Number assigned to hamper bag holding all clothes
  bagTagNumber?: string;
  bagTagColor?: string;
  // Stage 2 at store: Individual garment tags generated after store manager differentiation
  clothesDifferentiated: boolean;
  differentiatedAt?: string;
  differentiatedBy?: string;
  tagInfo: LaundryTagInfo;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  pincode: string;
  area: string;
  // Routing details
  storeId: string;
  storeName: string;
  routingReason: string;
  distanceKm?: number;
  // Delivery boy assignment
  assignedDeliveryBoyId?: string;
  assignedDeliveryBoyName?: string;
  assignedDeliveryBoyPhone?: string;
  // Service & details
  serviceType: string;
  deliveryMode: string;
  packingType?: 'Hanger Cover' | 'Fold & Pack';
  items: OrderItem[];
  totalAmount: number;
  status: string; // 'Lead Received' | 'Assigned for Pickup' | 'Picked Up (Bag Tagged)' | 'Arrived at Store' | 'Clothes Tagged & Sorted' | 'Washing' | 'Drying' | 'Ironing' | 'Ready' | 'Out for Delivery' | 'Delivered'
  paymentStatus: 'Unpaid' | 'Paid' | 'Partial';
  paymentMethod?: string;
  specialInstructions?: string;
  pickupDate?: string;
  deliveryDate?: string;
  pickedUpAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Initial Seed Orders across Timeframes (Day, Week, Month, Year) ───
const now = Date.now();
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

export const SEED_ORDERS: Order[] = [
  // ── Newtown Store, CC Block (Kolkata) ───────────────────────────
  {
    id: 'ord-nwt-101',
    orderNumber: '8767',
    bagTagNumber: 'BAG-NWT-8767',
    bagTagColor: '#0F2C59',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 2 * oneHour).toISOString(),
    differentiatedBy: 'Vivek',
    tagInfo: {
      tagId: 'TAG-NWT-8767',
      colorName: 'Royal Navy',
      colorHex: '#0F2C59',
      basketLabel: 'BAG-A (NAVY)',
      bagCount: 2,
      qrPayload: JSON.stringify({ tag: 'TAG-NWT-8767', order: '8767', cust: 'MRS PRERNA NATH', store: 'NWT', bags: 2, pcs: 10 }),
    },
    customerName: 'MRS PRERNA NATH',
    customerPhone: '+91 98301 99221',
    customerAddress: 'Flat 402, CC Block, Action Area 1, Newtown, Kolkata',
    pincode: '700156',
    area: 'CC Block',
    storeId: 'store-newtown',
    storeName: 'TumblePro - Newtown Store, CC Block',
    routingReason: 'Matched service pincode 700156 → Newtown Store, CC Block',
    serviceType: 'dry_clean',
    deliveryMode: 'pickup_delivery',
    packingType: 'Hanger Cover',
    items: [
      { itemId: 'saree', itemName: 'Silk Saree', quantity: 2, unitPrice: 180, packingType: 'Hanger Cover' },
      { itemId: 'shirt', itemName: 'Formal Shirt', quantity: 4, unitPrice: 40, packingType: 'Hanger Cover' },
      { itemId: 'vest', itemName: 'Men Vest', quantity: 4, unitPrice: 25, packingType: 'Fold & Pack' },
    ],
    totalAmount: 620,
    status: 'Clothes Tagged & Sorted', // Stage 3 complete
    paymentStatus: 'Unpaid',
    pickupDate: 'Today, 10:00 AM',
    deliveryDate: new Date(now + 2 * oneDay).toISOString(),
    createdAt: new Date(now - 3 * oneHour).toISOString(), // Today
    updatedAt: new Date(now - 2 * oneHour).toISOString(),
  },
  {
    id: 'ord-nwt-102',
    orderNumber: '8768',
    bagTagNumber: 'BAG-NWT-8768',
    bagTagColor: '#C59A27',
    clothesDifferentiated: false,
    tagInfo: {
      tagId: 'TAG-NWT-8768',
      colorName: 'Honey Gold',
      colorHex: '#C59A27',
      basketLabel: 'BAG-B (GOLD)',
      bagCount: 1,
      qrPayload: JSON.stringify({ tag: 'TAG-NWT-8768', order: '8768', cust: 'Anupam Sen', store: 'NWT', bags: 1 }),
    },
    customerName: 'Anupam Sen',
    customerPhone: '+91 98311 88334',
    customerAddress: 'Tower 3, Greenwood Elements, Rajarhat Main Rd',
    pincode: '700135',
    area: 'Rajarhat',
    storeId: 'store-newtown',
    storeName: 'TumblePro - Newtown Store, CC Block',
    routingReason: 'Matched locality keyword "Rajarhat" → Newtown Store, CC Block',
    assignedDeliveryBoyId: 'del-nwt-1',
    assignedDeliveryBoyName: 'Sudu',
    assignedDeliveryBoyPhone: '+91 98311 22334',
    serviceType: 'wash_iron',
    deliveryMode: 'pickup_delivery',
    packingType: 'Fold & Pack',
    items: [
      { itemId: 'trousers', itemName: 'Trousers / Jeans', quantity: 3, unitPrice: 50 },
      { itemId: 'shirt', itemName: 'Casual Shirts', quantity: 3, unitPrice: 40 },
    ],
    totalAmount: 270,
    status: 'Picked Up (Bag Tagged)', // Stage 2: Bag tagged, traveling to store
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    pickupDate: 'Today, 2:00 PM',
    deliveryDate: new Date(now + 1 * oneDay).toISOString(),
    createdAt: new Date(now - 5 * oneHour).toISOString(), // Today
    updatedAt: new Date(now - 1 * oneHour).toISOString(),
  },
  {
    id: 'ord-nwt-103',
    orderNumber: '8769',
    clothesDifferentiated: false,
    tagInfo: {
      tagId: 'TAG-NWT-8769',
      colorName: 'Royal Navy',
      colorHex: '#0F2C59',
      basketLabel: 'BAG-A (NAVY)',
      bagCount: 1,
      qrPayload: JSON.stringify({ tag: 'TAG-NWT-8769', order: '8769', cust: 'Rina Banerjee', store: 'NWT', bags: 1 }),
    },
    customerName: 'Rina Banerjee',
    customerPhone: '+91 98322 44556',
    customerAddress: 'Action Area 1, Near Axis Mall, Newtown',
    pincode: '700156',
    area: 'Action Area 1',
    storeId: 'store-newtown',
    storeName: 'TumblePro - Newtown Store, CC Block',
    routingReason: 'Matched service pincode 700156 → Newtown Store, CC Block',
    serviceType: 'wash_fold',
    deliveryMode: 'pickup_delivery',
    packingType: 'Fold & Pack',
    items: [
      { itemId: 'bedsheet', itemName: 'Bedsheet Double', quantity: 2, unitPrice: 80 },
      { itemId: 'towels', itemName: 'Bath Towels', quantity: 4, unitPrice: 30 },
    ],
    totalAmount: 280,
    status: 'Lead Received', // Stage 1: Waiting for delivery boy assignment
    paymentStatus: 'Unpaid',
    pickupDate: 'Today, ASAP',
    createdAt: new Date(now - 40 * 60 * 1000).toISOString(), // Today
    updatedAt: new Date(now - 40 * 60 * 1000).toISOString(),
  },

  // ── Sepa Store, Itanagar ─────────────────────────────────────────
  {
    id: 'ord-sep-201',
    orderNumber: '5541',
    bagTagNumber: 'BAG-SEP-5541',
    bagTagColor: '#10B981',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 1 * oneDay).toISOString(),
    differentiatedBy: 'Tadar Tani',
    tagInfo: {
      tagId: 'TAG-SEP-5541',
      colorName: 'Emerald Green',
      colorHex: '#10B981',
      basketLabel: 'BAG-C (GREEN)',
      bagCount: 2,
      qrPayload: JSON.stringify({ tag: 'TAG-SEP-5541', order: '5541', cust: 'Yomgam Bagra', store: 'SEP', bags: 2, pcs: 8 }),
    },
    customerName: 'Yomgam Bagra',
    customerPhone: '+91 98621 11223',
    customerAddress: 'Near Zero Point, Main Seppa Bazaar, East Kameng',
    pincode: '790102',
    area: 'Seppa',
    storeId: 'store-sepa',
    storeName: 'TumblePro - Sepa Store, Itanagar',
    routingReason: 'Matched service pincode 790102 → Sepa Store, Itanagar',
    serviceType: 'wash_iron',
    deliveryMode: 'pickup_delivery',
    packingType: 'Hanger Cover',
    items: [
      { itemId: 'jacket', itemName: 'Winter Heavy Jacket', quantity: 2, unitPrice: 150 },
      { itemId: 'trousers', itemName: 'Warm Trousers', quantity: 3, unitPrice: 60 },
      { itemId: 'thermals', itemName: 'Thermal Tops', quantity: 3, unitPrice: 45 },
    ],
    totalAmount: 615,
    status: 'Washing',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    pickupDate: 'Yesterday, 11:00 AM',
    deliveryDate: new Date(now + 2 * oneDay).toISOString(),
    createdAt: new Date(now - 2 * oneDay).toISOString(), // This Week
    updatedAt: new Date(now - 1 * oneDay).toISOString(),
  },
  {
    id: 'ord-sep-202',
    orderNumber: '5542',
    clothesDifferentiated: false,
    tagInfo: {
      tagId: 'TAG-SEP-5542',
      colorName: 'Emerald Green',
      colorHex: '#10B981',
      basketLabel: 'BAG-C (GREEN)',
      bagCount: 1,
      qrPayload: JSON.stringify({ tag: 'TAG-SEP-5542', order: '5542', cust: 'Kojing Lego', store: 'SEP', bags: 1 }),
    },
    customerName: 'Kojing Lego',
    customerPhone: '+91 98624 33445',
    customerAddress: 'Pappu Valley Road, Near Helipad, Seppa',
    pincode: '790103',
    area: 'Pappu Valley',
    storeId: 'store-sepa',
    storeName: 'TumblePro - Sepa Store, Itanagar',
    routingReason: 'Matched locality "Pappu Valley" → Sepa Store, Itanagar',
    assignedDeliveryBoyId: 'del-sep-1',
    assignedDeliveryBoyName: 'Tage Donyi',
    assignedDeliveryBoyPhone: '+91 98622 33445',
    serviceType: 'wash_fold',
    deliveryMode: 'pickup_delivery',
    packingType: 'Fold & Pack',
    items: [
      { itemId: 'shirt', itemName: 'Casual Shirts', quantity: 4, unitPrice: 35 },
      { itemId: 'blanket', itemName: 'Heavy Quilt / Blanket', quantity: 1, unitPrice: 220 },
    ],
    totalAmount: 360,
    status: 'Assigned for Pickup', // Assigned to delivery boy
    paymentStatus: 'Unpaid',
    pickupDate: 'Today, 4:00 PM',
    createdAt: new Date(now - 2 * oneHour).toISOString(), // Today
    updatedAt: new Date(now - 1 * oneHour).toISOString(),
  },

  // ── Tinsukhia Store, Assam ───────────────────────────────────────
  {
    id: 'ord-tsk-301',
    orderNumber: '6610',
    bagTagNumber: 'BAG-TSK-6610',
    bagTagColor: '#C59A27',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 4 * oneDay).toISOString(),
    differentiatedBy: 'Bhaskar Baruah',
    tagInfo: {
      tagId: 'TAG-TSK-6610',
      colorName: 'Honey Gold',
      colorHex: '#C59A27',
      basketLabel: 'BAG-B (GOLD)',
      bagCount: 1,
      qrPayload: JSON.stringify({ tag: 'TAG-TSK-6610', order: '6610', cust: 'Pranjal Saikia', store: 'TSK', bags: 1, pcs: 6 }),
    },
    customerName: 'Pranjal Saikia',
    customerPhone: '+91 98541 66778',
    customerAddress: 'AT Road, Near Thana Chariali, Tinsukia',
    pincode: '786125',
    area: 'Thana Chariali',
    storeId: 'store-tinsukhia',
    storeName: 'TumblePro - Tinsukhia Store, Assam',
    routingReason: 'Matched service pincode 786125 → Tinsukhia Store, Assam',
    serviceType: 'dry_clean',
    deliveryMode: 'pickup_delivery',
    packingType: 'Hanger Cover',
    items: [
      { itemId: 'suit', itemName: '2-Piece Men Suit', quantity: 1, unitPrice: 280 },
      { itemId: 'saree', itemName: 'Mekhela Chador / Saree', quantity: 2, unitPrice: 190 },
      { itemId: 'shirt', itemName: 'Silk Shirts', quantity: 3, unitPrice: 50 },
    ],
    totalAmount: 810,
    status: 'Ready',
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    pickupDate: '3 days ago',
    deliveryDate: new Date(now + 1 * oneDay).toISOString(),
    createdAt: new Date(now - 5 * oneDay).toISOString(), // This Week
    updatedAt: new Date(now - 4 * oneDay).toISOString(),
  },
  {
    id: 'ord-tsk-302',
    orderNumber: '6611',
    bagTagNumber: 'BAG-TSK-6611',
    bagTagColor: '#C59A27',
    clothesDifferentiated: false,
    tagInfo: {
      tagId: 'TAG-TSK-6611',
      colorName: 'Honey Gold',
      colorHex: '#C59A27',
      basketLabel: 'BAG-B (GOLD)',
      bagCount: 2,
      qrPayload: JSON.stringify({ tag: 'TAG-TSK-6611', order: '6611', cust: 'Mridula Dutta', store: 'TSK', bags: 2 }),
    },
    customerName: 'Mridula Dutta',
    customerPhone: '+91 98544 22331',
    customerAddress: 'Borguri Industrial Area, Tinsukia',
    pincode: '786126',
    area: 'Borguri',
    storeId: 'store-tinsukhia',
    storeName: 'TumblePro - Tinsukhia Store, Assam',
    routingReason: 'Matched locality keyword "Borguri" → Tinsukhia Store, Assam',
    assignedDeliveryBoyId: 'del-tsk-1',
    assignedDeliveryBoyName: 'Debojit Gogoi',
    assignedDeliveryBoyPhone: '+91 98544 55667',
    serviceType: 'wash_iron',
    deliveryMode: 'pickup_delivery',
    packingType: 'Fold & Pack',
    items: [
      { itemId: 'shirt', itemName: 'School Uniform Shirts', quantity: 5, unitPrice: 30 },
      { itemId: 'trousers', itemName: 'School Uniform Trousers', quantity: 3, unitPrice: 35 },
    ],
    totalAmount: 255,
    status: 'Arrived at Store', // Stage 3 ready: Bag arrived, waiting for manager differentiation
    paymentStatus: 'Unpaid',
    pickupDate: 'Today, 11:30 AM',
    createdAt: new Date(now - 4 * oneHour).toISOString(), // Today
    updatedAt: new Date(now - 1 * oneHour).toISOString(),
  },

  // ── NaharLagun, Itanagar ─────────────────────────────────────────
  {
    id: 'ord-nhr-401',
    orderNumber: '4421',
    bagTagNumber: 'BAG-NHR-4421',
    bagTagColor: '#0EA5E9',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 10 * oneDay).toISOString(),
    differentiatedBy: 'Nabam Tado',
    tagInfo: {
      tagId: 'TAG-NHR-4421',
      colorName: 'Cyan Water',
      colorHex: '#0EA5E9',
      basketLabel: 'BAG-D (CYAN)',
      bagCount: 1,
      qrPayload: JSON.stringify({ tag: 'TAG-NHR-4421', order: '4421', cust: 'Tana Hina', store: 'NHR', bags: 1, pcs: 5 }),
    },
    customerName: 'Tana Hina',
    customerPhone: '+91 98631 88990',
    customerAddress: 'E-Sector, Near Daily Market, Naharlagun',
    pincode: '791110',
    area: 'E-Sector',
    storeId: 'store-naharlagun',
    storeName: 'TumblePro - NaharLagun, Itanagar',
    routingReason: 'Matched service pincode 791110 → NaharLagun, Itanagar',
    serviceType: 'wash_iron',
    deliveryMode: 'pickup_delivery',
    packingType: 'Hanger Cover',
    items: [
      { itemId: 'kurtas', itemName: 'Traditional Kurta Sets', quantity: 3, unitPrice: 85 },
      { itemId: 'bedsheet', itemName: 'Single Bedsheet', quantity: 2, unitPrice: 60 },
    ],
    totalAmount: 375,
    status: 'Delivered', // Completed order
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    pickupDate: '10 days ago',
    deliveryDate: new Date(now - 8 * oneDay).toISOString(),
    createdAt: new Date(now - 12 * oneDay).toISOString(), // This Month
    updatedAt: new Date(now - 8 * oneDay).toISOString(),
  },
  {
    id: 'ord-nhr-402',
    orderNumber: '4422',
    bagTagNumber: 'BAG-NHR-4422',
    bagTagColor: '#0EA5E9',
    clothesDifferentiated: false,
    tagInfo: {
      tagId: 'TAG-NHR-4422',
      colorName: 'Cyan Water',
      colorHex: '#0EA5E9',
      basketLabel: 'BAG-D (CYAN)',
      bagCount: 2,
      qrPayload: JSON.stringify({ tag: 'TAG-NHR-4422', order: '4422', cust: 'Bamang Taji', store: 'NHR', bags: 2 }),
    },
    customerName: 'Bamang Taji',
    customerPhone: '+91 98634 77889',
    customerAddress: 'Model Village Road, Near River View, Naharlagun',
    pincode: '791111',
    area: 'Model Village',
    storeId: 'store-naharlagun',
    storeName: 'TumblePro - NaharLagun, Itanagar',
    routingReason: 'Matched locality keyword "Model Village" → NaharLagun, Itanagar',
    assignedDeliveryBoyId: 'del-nhr-1',
    assignedDeliveryBoyName: 'Kaling Tayeng',
    assignedDeliveryBoyPhone: '+91 98633 66778',
    serviceType: 'dry_clean',
    deliveryMode: 'pickup_delivery',
    packingType: 'Hanger Cover',
    items: [
      { itemId: 'coat', itemName: 'Overcoat / Blazer', quantity: 2, unitPrice: 200 },
      { itemId: 'saree', itemName: 'Designer Saree', quantity: 1, unitPrice: 190 },
    ],
    totalAmount: 590,
    status: 'Picked Up (Bag Tagged)',
    paymentStatus: 'Unpaid',
    pickupDate: 'Today, 1:00 PM',
    createdAt: new Date(now - 3 * oneHour).toISOString(), // Today
    updatedAt: new Date(now - 1 * oneHour).toISOString(),
  },
  // ── Earlier This Year Orders (For Yearly Analytics Filter) ───────
  {
    id: 'ord-nwt-098',
    orderNumber: '8750',
    bagTagNumber: 'BAG-NWT-8750',
    bagTagColor: '#0F2C59',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 45 * oneDay).toISOString(),
    differentiatedBy: 'Vivek',
    tagInfo: {
      tagId: 'TAG-NWT-8750',
      colorName: 'Royal Navy',
      colorHex: '#0F2C59',
      basketLabel: 'BAG-A (NAVY)',
      bagCount: 2,
      qrPayload: JSON.stringify({ tag: 'TAG-NWT-8750', order: '8750', cust: 'Amitav Ghosh', store: 'NWT', bags: 2, pcs: 8 }),
    },
    customerName: 'Amitav Ghosh',
    customerPhone: '+91 98305 66778',
    customerAddress: 'CC Block, Action Area 1, Newtown, Kolkata',
    pincode: '700156',
    area: 'CC Block',
    storeId: 'store-newtown',
    storeName: 'Newtown Store, CC Block',
    routingReason: 'Matched service pincode 700156 → Newtown Store, CC Block',
    serviceType: 'dry_clean',
    deliveryMode: 'pickup_delivery',
    packingType: 'Hanger Cover',
    items: [
      { itemId: 'suit', itemName: '2-Piece Men Suit', quantity: 2, unitPrice: 280 },
      { itemId: 'shirt', itemName: 'Formal Shirts', quantity: 4, unitPrice: 40 },
    ],
    totalAmount: 720,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    createdAt: new Date(now - 45 * oneDay).toISOString(), // This Year
    updatedAt: new Date(now - 43 * oneDay).toISOString(),
  },
  {
    id: 'ord-sep-195',
    orderNumber: '5520',
    bagTagNumber: 'BAG-SEP-5520',
    bagTagColor: '#10B981',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 75 * oneDay).toISOString(),
    differentiatedBy: 'Tadar Tani',
    tagInfo: {
      tagId: 'TAG-SEP-5520',
      colorName: 'Emerald Green',
      colorHex: '#10B981',
      basketLabel: 'BAG-C (GREEN)',
      bagCount: 1,
      qrPayload: JSON.stringify({ tag: 'TAG-SEP-5520', order: '5520', cust: 'Donyi Polo Club', store: 'SEP', bags: 1, pcs: 12 }),
    },
    customerName: 'Donyi Polo Club',
    customerPhone: '+91 98629 88112',
    customerAddress: 'Zero Point Road, Seppa, East Kameng',
    pincode: '790102',
    area: 'Seppa',
    storeId: 'store-sepa',
    storeName: 'Sepa Store, Itanagar',
    routingReason: 'Matched service pincode 790102 → Sepa Store, Itanagar',
    serviceType: 'wash_fold',
    deliveryMode: 'pickup_delivery',
    packingType: 'Fold & Pack',
    items: [
      { itemId: 'blanket', itemName: 'Heavy Quilt', quantity: 3, unitPrice: 220 },
      { itemId: 'bedsheet', itemName: 'Double Bedsheet', quantity: 4, unitPrice: 80 },
    ],
    totalAmount: 980,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    createdAt: new Date(now - 75 * oneDay).toISOString(), // This Year
    updatedAt: new Date(now - 72 * oneDay).toISOString(),
  },
  // ── Yesterday's Order (For Yesterday Filter) ─────────────────────
  {
    id: 'ord-nwt-099',
    orderNumber: '8760',
    bagTagNumber: 'BAG-NWT-8760',
    bagTagColor: '#0F2C59',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 1 * oneDay).toISOString(),
    differentiatedBy: 'Vivek',
    tagInfo: {
      tagId: 'TAG-NWT-8760',
      colorName: 'Royal Navy',
      colorHex: '#0F2C59',
      basketLabel: 'BAG-A (NAVY)',
      bagCount: 1,
      qrPayload: JSON.stringify({ tag: 'TAG-NWT-8760', order: '8760', cust: 'Debashis Roy', store: 'NWT', bags: 1, pcs: 5 }),
    },
    customerName: 'Debashis Roy',
    customerPhone: '+91 98309 11223',
    customerAddress: 'Action Area 1, CC Block, Newtown',
    pincode: '700156',
    area: 'CC Block',
    storeId: 'store-newtown',
    storeName: 'Newtown Store, CC Block',
    routingReason: 'Matched service pincode 700156 → Newtown Store, CC Block',
    serviceType: 'wash_iron',
    deliveryMode: 'pickup_delivery',
    packingType: 'Fold & Pack',
    items: [
      { itemId: 'trousers', itemName: 'Cotton Trousers', quantity: 3, unitPrice: 50 },
      { itemId: 'shirt', itemName: 'Casual Shirts', quantity: 2, unitPrice: 40 },
    ],
    totalAmount: 230,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    createdAt: new Date(now - 1 * oneDay).toISOString(), // Yesterday
    updatedAt: new Date(now - 1 * oneDay + 4 * oneHour).toISOString(),
  },
  // ── Last Week's Order (For Last Week Filter) ─────────────────────
  {
    id: 'ord-tsk-295',
    orderNumber: '6605',
    bagTagNumber: 'BAG-TSK-6605',
    bagTagColor: '#C59A27',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 9 * oneDay).toISOString(),
    differentiatedBy: 'Bhaskar Baruah',
    tagInfo: {
      tagId: 'TAG-TSK-6605',
      colorName: 'Honey Gold',
      colorHex: '#C59A27',
      basketLabel: 'BAG-B (GOLD)',
      bagCount: 2,
      qrPayload: JSON.stringify({ tag: 'TAG-TSK-6605', order: '6605', cust: 'Pankaj Bora', store: 'TSK', bags: 2, pcs: 6 }),
    },
    customerName: 'Pankaj Bora',
    customerPhone: '+91 98547 33221',
    customerAddress: 'Chirwapatty, Tinsukia',
    pincode: '786125',
    area: 'Chirwapatty',
    storeId: 'store-tinsukhia',
    storeName: 'Tinsukhia Store, Assam',
    routingReason: 'Matched service pincode 786125 → Tinsukhia Store, Assam',
    serviceType: 'dry_clean',
    deliveryMode: 'pickup_delivery',
    packingType: 'Hanger Cover',
    items: [
      { itemId: 'suit', itemName: '2-Piece Men Suit', quantity: 1, unitPrice: 280 },
      { itemId: 'jacket', itemName: 'Blazer', quantity: 1, unitPrice: 200 },
    ],
    totalAmount: 480,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    createdAt: new Date(now - 9 * oneDay).toISOString(), // Last Week
    updatedAt: new Date(now - 7 * oneDay).toISOString(),
  },
  // ── Last Month's Order (For Last Month Filter) ───────────────────
  {
    id: 'ord-nhr-390',
    orderNumber: '4410',
    bagTagNumber: 'BAG-NHR-4410',
    bagTagColor: '#0EA5E9',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 38 * oneDay).toISOString(),
    differentiatedBy: 'Nabam Tado',
    tagInfo: {
      tagId: 'TAG-NHR-4410',
      colorName: 'Cyan Water',
      colorHex: '#0EA5E9',
      basketLabel: 'BAG-D (CYAN)',
      bagCount: 2,
      qrPayload: JSON.stringify({ tag: 'TAG-NHR-4410', order: '4410', cust: 'Taba Yallung', store: 'NHR', bags: 2, pcs: 8 }),
    },
    customerName: 'Taba Yallung',
    customerPhone: '+91 98632 11009',
    customerAddress: 'A-Sector, Naharlagun, Itanagar',
    pincode: '791110',
    area: 'A-Sector',
    storeId: 'store-naharlagun',
    storeName: 'NaharLagun, Itanagar',
    routingReason: 'Matched service pincode 791110 → NaharLagun, Itanagar',
    serviceType: 'wash_iron',
    deliveryMode: 'pickup_delivery',
    packingType: 'Fold & Pack',
    items: [
      { itemId: 'bedsheet', itemName: 'Double Bedsheets', quantity: 3, unitPrice: 80 },
      { itemId: 'blanket', itemName: 'Fleece Blanket', quantity: 2, unitPrice: 180 },
    ],
    totalAmount: 600,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'UPI',
    createdAt: new Date(now - 38 * oneDay).toISOString(), // Last Month
    updatedAt: new Date(now - 35 * oneDay).toISOString(),
  },
  // ── Last Year's Order (For Last Year Filter) ─────────────────────
  {
    id: 'ord-nwt-070',
    orderNumber: '8701',
    bagTagNumber: 'BAG-NWT-8701',
    bagTagColor: '#0F2C59',
    clothesDifferentiated: true,
    differentiatedAt: new Date(now - 380 * oneDay).toISOString(),
    differentiatedBy: 'Vivek',
    tagInfo: {
      tagId: 'TAG-NWT-8701',
      colorName: 'Royal Navy',
      colorHex: '#0F2C59',
      basketLabel: 'BAG-A (NAVY)',
      bagCount: 2,
      qrPayload: JSON.stringify({ tag: 'TAG-NWT-8701', order: '8701', cust: 'Siddhartha Sen', store: 'NWT', bags: 2, pcs: 10 }),
    },
    customerName: 'Siddhartha Sen',
    customerPhone: '+91 98300 44556',
    customerAddress: 'Action Area 1, CC Block, Newtown',
    pincode: '700156',
    area: 'CC Block',
    storeId: 'store-newtown',
    storeName: 'Newtown Store, CC Block',
    routingReason: 'Matched service pincode 700156 → Newtown Store, CC Block',
    serviceType: 'dry_clean',
    deliveryMode: 'pickup_delivery',
    packingType: 'Hanger Cover',
    items: [
      { itemId: 'suit', itemName: '3-Piece Designer Suit', quantity: 2, unitPrice: 380 },
      { itemId: 'saree', itemName: 'Banarasi Silk Saree', quantity: 2, unitPrice: 220 },
    ],
    totalAmount: 1200,
    status: 'Delivered',
    paymentStatus: 'Paid',
    paymentMethod: 'Cash',
    createdAt: new Date(now - 380 * oneDay).toISOString(), // Last Year
    updatedAt: new Date(now - 377 * oneDay).toISOString(),
  },
];

// ─── Geo-Location Haversine Distance Engine ──────────────────────
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// ─── Pincode, Locality & GeoLocation Routing Engine ──────────────
export function findNearestStore(
  stores: Store[],
  pincode: string = '',
  address: string = '',
  coords?: { latitude: number; longitude: number }
): { store: Store; reason: string; distanceKm?: number } {
  const storeList = stores && stores.length > 0 ? stores : DEFAULT_STORES;

  // 1. If GPS coordinates are passed, calculate exact geometric distance to each store
  if (coords && coords.latitude && coords.longitude) {
    let nearest = storeList[0];
    let minDistance = Infinity;

    for (const store of storeList) {
      if (store.lat && store.lng) {
        const dist = calculateDistanceKm(coords.latitude, coords.longitude, store.lat, store.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = store;
        }
      }
    }

    if (minDistance !== Infinity) {
      return {
        store: nearest,
        reason: `GPS Geolocation: Closest hub is ${nearest.name} (${minDistance} km away)`,
        distanceKm: minDistance,
      };
    }
  }

  const cleanPin = (pincode || '').replace(/\D/g, '').trim();
  const cleanAddr = (address || '').toLowerCase();

  // 2. Exact Pincode Match
  if (cleanPin.length >= 5) {
    const matched = storeList.find((s) => s.pincodes.some((p) => p.trim() === cleanPin));
    if (matched) {
      return {
        store: matched,
        reason: `Matched service pincode: ${cleanPin} → ${matched.name}`,
      };
    }
  }

  // 3. Locality Keyword Match in address text
  if (cleanAddr) {
    for (const store of storeList) {
      for (const area of store.areas) {
        if (cleanAddr.includes(area.toLowerCase())) {
          return {
            store,
            reason: `Matched locality keyword "${area}" in address → ${store.name}`,
          };
        }
      }
    }
  }

  // 4. Default Fallback
  const fallback = storeList[0];
  return {
    store: fallback,
    reason: `Assigned to regional hub (${fallback.name}) for dispatch verification`,
  };
}

// ─── Storage Initialization ─────────────────────────────────────
export async function initializeDefaultDataIfNeeded(): Promise<void> {
  const isInit = await AsyncStorage.getItem(KEYS.INITIALIZED);
  if (!isInit) {
    await AsyncStorage.setItem(KEYS.STORES, JSON.stringify(DEFAULT_STORES));
    await AsyncStorage.setItem(KEYS.DELIVERY_BOYS, JSON.stringify(DEFAULT_DELIVERY_BOYS));
    await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(SEED_ORDERS));
    await AsyncStorage.setItem(KEYS.USERS_LIST, JSON.stringify(PRESET_USERS));
    // Do not set a default logged in user so user must authenticate
    await AsyncStorage.setItem(KEYS.INITIALIZED, 'true');
  }
}

// ─── Stores API ─────────────────────────────────────────────────
export async function getAllStores(): Promise<Store[]> {
  await initializeDefaultDataIfNeeded();
  const raw = await AsyncStorage.getItem(KEYS.STORES);
  return raw ? JSON.parse(raw) : DEFAULT_STORES;
}

export async function saveStore(store: Store): Promise<void> {
  const stores = await getAllStores();
  const idx = stores.findIndex((s) => s.id === store.id);
  if (idx >= 0) {
    stores[idx] = store;
  } else {
    stores.push(store);
  }
  await AsyncStorage.setItem(KEYS.STORES, JSON.stringify(stores));
}

export async function getStoreById(id: string): Promise<Store | null> {
  const stores = await getAllStores();
  return stores.find((s) => s.id === id) ?? null;
}

// ─── Delivery Boys API ──────────────────────────────────────────
export async function getAllDeliveryBoys(): Promise<DeliveryBoy[]> {
  await initializeDefaultDataIfNeeded();
  const raw = await AsyncStorage.getItem(KEYS.DELIVERY_BOYS);
  const list: DeliveryBoy[] = raw ? JSON.parse(raw) : DEFAULT_DELIVERY_BOYS;
  return list.map((b) => {
    if (b.id === 'del-nwt-1' || b.name === 'Subhash Roy') {
      return { ...b, name: 'Sudu' };
    }
    return b;
  });
}

export async function getDeliveryBoysByStore(storeId: string): Promise<DeliveryBoy[]> {
  const all = await getAllDeliveryBoys();
  return all.filter((b) => b.storeId === storeId);
}

export async function saveDeliveryBoy(boy: DeliveryBoy): Promise<void> {
  const all = await getAllDeliveryBoys();
  const idx = all.findIndex((b) => b.id === boy.id);
  if (idx >= 0) {
    all[idx] = boy;
  } else {
    all.push(boy);
  }
  await AsyncStorage.setItem(KEYS.DELIVERY_BOYS, JSON.stringify(all));
}

// ─── Orders API with Tenant Isolation ───────────────────────────
export async function getAllOrders(): Promise<Order[]> {
  await initializeDefaultDataIfNeeded();
  const raw = await AsyncStorage.getItem(KEYS.ORDERS);
  return raw ? JSON.parse(raw) : SEED_ORDERS;
}

/**
 * Scopes orders based on user role and assigned store.
 * - Store Manager: strictly sees only their store's orders.
 * - Delivery Boy: sees assigned pickups/deliveries.
 * - Super Admin: sees all orders (can be filtered optionally by storeId).
 */
export async function getScopedOrders(user: StoredUser | null, storeFilterId?: string): Promise<Order[]> {
  const allOrders = await getAllOrders();
  if (!user) return [];

  if (user.role === 'store_manager') {
    return allOrders.filter((o) => o.storeId === user.storeId);
  }

  if (user.role === 'delivery_boy') {
    return allOrders.filter(
      (o) => o.assignedDeliveryBoyId === user.id || (o.storeId === user.storeId && o.status === 'Assigned for Pickup')
    );
  }

  if (storeFilterId && storeFilterId !== 'all') {
    return allOrders.filter((o) => o.storeId === storeFilterId);
  }

  return allOrders;
}

export async function saveOrder(order: Order): Promise<void> {
  const orders = await getAllOrders();
  const idx = orders.findIndex((o) => o.id === order.id);
  if (idx >= 0) {
    orders[idx] = order;
  } else {
    orders.unshift(order);
  }
  await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getAllOrders();
  return orders.find((o) => o.id === id) ?? null;
}

export async function deleteOrder(id: string): Promise<void> {
  const orders = await getAllOrders();
  const filtered = orders.filter((o) => o.id !== id);
  await AsyncStorage.setItem(KEYS.ORDERS, JSON.stringify(filtered));
}

// ─── Unique Tag & QR Code Helpers ───────────────────────────────
export function generateTagId(storeCode: string, orderNumber: string): string {
  const cleanOrder = orderNumber.replace(/[^a-zA-Z0-9]/g, '');
  const timestamp = String(Date.now()).slice(-4);
  return `TAG-${storeCode.toUpperCase()}-${timestamp}-${cleanOrder.slice(-3)}`;
}

export function generateBagTagNumber(storeCode: string, orderNumber: string): string {
  const cleanOrder = orderNumber.replace(/\D/g, '').slice(-4) || orderNumber.slice(-4);
  return `BAG-${storeCode.toUpperCase()}-${cleanOrder}`;
}

export function getTagColorForOrder(seed: string): typeof TAG_COLORS[number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[idx];
}

export function buildLaundryTagInfo(
  storeCode: string,
  orderNumber: string,
  customerName: string,
  bagCount: number = 1,
  pieceCount: number = 1
): LaundryTagInfo {
  const tagId = generateTagId(storeCode, orderNumber);
  const tagColor = getTagColorForOrder(orderNumber + customerName);

  const qrPayload = JSON.stringify({
    tag: tagId,
    order: orderNumber,
    cust: customerName,
    store: storeCode,
    bags: bagCount,
    pcs: pieceCount,
    color: tagColor.name,
    time: new Date().toISOString(),
  });

  return {
    tagId,
    colorName: tagColor.name,
    colorHex: tagColor.hex,
    basketLabel: tagColor.label,
    bagCount: Math.max(1, bagCount),
    qrPayload,
  };
}

// ─── User / Auth API ────────────────────────────────────────────
export async function saveUser(user: StoredUser): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export async function getUser(): Promise<StoredUser | null> {
  await initializeDefaultDataIfNeeded();
  const raw = await AsyncStorage.getItem(KEYS.USER);
  return raw ? JSON.parse(raw) : null;
}

export async function clearUser(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.USER);
}

// ─── Users Directory API (For Adding New Admins & Staff Accounts) ─
export async function getAllUsers(): Promise<StoredUser[]> {
  await initializeDefaultDataIfNeeded();
  const raw = await AsyncStorage.getItem(KEYS.USERS_LIST);
  if (!raw) return PRESET_USERS;
  try {
    const parsed: StoredUser[] = JSON.parse(raw);
    return parsed && parsed.length > 0 ? parsed : PRESET_USERS;
  } catch {
    return PRESET_USERS;
  }
}

export async function saveUserToDirectory(newUser: StoredUser): Promise<void> {
  const users = await getAllUsers();
  const idx = users.findIndex(
    (u) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase()
  );
  if (idx >= 0) {
    users[idx] = newUser;
  } else {
    users.push(newUser);
  }
  await AsyncStorage.setItem(KEYS.USERS_LIST, JSON.stringify(users));
}

export async function deleteUserFromDirectory(userId: string): Promise<void> {
  const users = await getAllUsers();
  const filtered = users.filter((u) => u.id !== userId);
  await AsyncStorage.setItem(KEYS.USERS_LIST, JSON.stringify(filtered));
}

// ─── Helpers ────────────────────────────────────────────────────
export function generateId(): string {
  return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function generateOrderNumber(): string {
  // Generates 4-digit numeric order ID matching industry standard (e.g. 8767)
  const num = Math.floor(1000 + Math.random() * 9000);
  return String(num);
}

export function simpleHash(str: string): string {
  return str;
}
