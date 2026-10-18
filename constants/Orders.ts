export const ORDER_STATUSES = [
  'Lead Received',
  'Assigned for Pickup',
  'Picked Up (Bag Tagged)',
  'Arrived at Store',
  'Clothes Tagged & Sorted',
  'Washing',
  'Drying',
  'Ironing',
  'Ready',
  'Out for Delivery',
  'Delivered',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

// Legacy / short status mapping for backwards compatibility
export const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  Received: 'Lead Received',
  'Picked Up': 'Picked Up (Bag Tagged)',
  Washing: 'Washing',
  Drying: 'Drying',
  Ready: 'Ready',
  Delivered: 'Delivered',
};

export const SERVICE_TYPES = [
  { id: 'wash_fold', name: 'Wash & Fold', label: 'Wash & Fold', icon: '🫧', description: 'Washed, dried & neatly folded' },
  { id: 'wash_iron', name: 'Wash & Iron', label: 'Wash & Iron', icon: '👔', description: 'Washed, dried & steam pressed' },
  { id: 'dry_clean', name: 'Dry Clean', label: 'Dry Clean', icon: '✨', description: 'Professional premium dry cleaning' },
  { id: 'iron_only', name: 'Iron Only', label: 'Iron Only', icon: '🔥', description: 'Steam ironing only, no wash' },
  { id: 'shoe_cleaning', name: 'Shoe Cleaning', label: 'Shoe Spa & Cleaning', icon: '👟', description: 'Sneakers, leather & suede shoe cleaning' },
  { id: 'sofa_cleaning', name: 'Sofa Cleaning', label: 'Sofa & Upholstery Cleaning', icon: '🛋️', description: 'Deep vacuum, shampoo & stain extraction' },
  { id: 'carpet_cleaning', name: 'Carpet & Curtain', label: 'Carpet & Curtain Spa', icon: '🪟', description: 'Dust extraction & deep fabric shampoo' },
] as const;

export type ServiceType = typeof SERVICE_TYPES[number]['id'];

export const DELIVERY_MODES = [
  { id: 'pickup_delivery', name: 'Home Pickup & Delivery', label: 'Home Pickup & Delivery', icon: '🛵', description: 'Delivery boy collects & delivers to doorstep' },
  { id: 'walkin', name: 'Store Walk-in', label: 'Store Walk-in', icon: '🚶', description: 'Customer drops off & picks up at store' },
] as const;

export type DeliveryMode = typeof DELIVERY_MODES[number]['id'];

// Distinct colors used for physical bag tags / hampers to avoid separating clothes confusion
export const TAG_COLORS = [
  { name: 'Royal Navy', hex: '#0F2C59', bgHex: '#EFF6FF', label: 'BAG-A (NAVY)' },
  { name: 'Honey Gold', hex: '#C59A27', bgHex: '#FEF9C3', label: 'BAG-B (GOLD)' },
  { name: 'Emerald Green', hex: '#10B981', bgHex: '#ECFDF5', label: 'BAG-C (GREEN)' },
  { name: 'Cyan Water', hex: '#0EA5E9', bgHex: '#F0F9FF', label: 'BAG-D (CYAN)' },
  { name: 'Rose Coral', hex: '#F43F5E', bgHex: '#FFF1F2', label: 'BAG-E (CORAL)' },
  { name: 'Purple Lavender', hex: '#8B5CF6', bgHex: '#F5F3FF', label: 'BAG-F (PURPLE)' },
] as const;
