/**
 * TumblePro™ Brand Colors
 * Extracted and synchronized with the official logo:
 * - Royal Navy Blue: #0F2C59 (Dominant brand color: "Tumble", "LAUNDRY SERVICES")
 * - Honey Gold: #C59A27 / #D4AF37 (Brand accent: "Pro™", crescent swoop, lotus)
 * - Fresh Laundry Cyan: #0EA5E9 / #38BDF8 (Drum water swirl, fresh clean towels)
 * - Crisp White / Slate: #FFFFFF / #F8FAFC (Clean laundry aesthetic, industry-grade SaaS)
 */

export const Colors = {
  // Backgrounds & Surfaces (Crisp, clean, professional laundry aesthetic)
  bg: '#F8FAFC',          // Light slate fresh background
  surface: '#FFFFFF',     // Pure white card surfaces
  surfaceSubtle: '#F1F5F9', // Subtle header & table row background
  card: '#FFFFFF',        // White cards with crisp shadow
  cardHover: '#F8FAFC',
  border: '#E2E8F0',      // Clean slate borders
  borderDark: '#CBD5E1',

  // TumblePro Logo Navy Blue Palette
  primary: '#0F2C59',     // Official TumblePro Deep Navy
  primaryDark: '#0A1C38', // Midnight Navy for contrast
  primaryLight: '#1E427B', // Soft Royal Navy
  primarySubtle: '#EFF6FF', // Light navy tint for tags and selection

  // TumblePro Logo Honey Gold Palette
  secondary: '#C59A27',   // Official TumblePro Honey Gold
  secondaryDark: '#A07817', // Deep burnished gold
  secondaryLight: '#DFB548', // Bright champagne gold
  secondaryBg: '#FEF9C3', // Warm gold soft badge background
  secondaryBorder: '#FDE047',

  // Fresh Laundry Water Cyan
  accentCyan: '#0EA5E9',   // Clean water swirl cyan
  accentCyanLight: '#38BDF8',
  accentCyanBg: '#F0F9FF',

  // Semantic Feedback
  success: '#10B981',     // Fresh emerald green
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  warning: '#F59E0B',     // Amber
  warningBg: '#FFFBEB',
  warningBorder: '#FDE68A',
  danger: '#EF4444',      // Coral red
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  info: '#0284C7',
  infoBg: '#F0F9FF',

  // Typography (High-contrast, clean enterprise readability)
  textPrimary: '#0F172A',   // Deep slate black
  textSecondary: '#475569', // Muted slate gray
  textMuted: '#94A3B8',     // Caption gray
  textInverse: '#FFFFFF',   // White text on dark elements
  textNavy: '#0F2C59',      // Brand navy text
  textGold: '#C59A27',      // Brand gold text

  // Status Badge Colors (Industry Laundry Standard)
  statusLead: '#0284C7',
  statusAssigned: '#D97706',
  statusPickedUp: '#0EA5E9',
  statusWashing: '#6366F1',
  statusDrying: '#EC4899',
  statusIroning: '#F97316',
  statusReady: '#10B981',
  statusOutForDelivery: '#8B5CF6',
  statusDelivered: '#475569',

  // Gradients
  gradientPrimary: ['#0F2C59', '#1E427B'] as string[],
  gradientGold: ['#D4AF37', '#B8860B'] as string[],
  gradientCyan: ['#0EA5E9', '#0284C7'] as string[],
  gradientCard: ['#FFFFFF', '#F8FAFC'] as string[],
  gradientBg: ['#F8FAFC', '#F1F5F9'] as string[],

  // Tab bar
  tabActive: '#0F2C59',
  tabInactive: '#94A3B8',
  tabBg: '#FFFFFF',
};

export const StatusColors: Record<string, string> = {
  'Received': Colors.statusLead,
  'Lead Received': Colors.statusLead,
  'Assigned for Pickup': Colors.statusAssigned,
  'Picked Up': Colors.statusPickedUp,
  'Picked Up (Bag Tagged)': Colors.statusPickedUp,
  'Arrived at Store': '#D97706',
  'Clothes Tagged & Sorted': '#8B5CF6',
  'Washing': Colors.statusWashing,
  'Drying': Colors.statusDrying,
  'Ironing': Colors.statusIroning,
  'Ready': Colors.statusReady,
  'Out for Delivery': Colors.statusOutForDelivery,
  'Delivered': Colors.statusDelivered,
};

export const StatusBgColors: Record<string, string> = {
  'Received': '#F0F9FF',
  'Lead Received': '#F0F9FF',
  'Assigned for Pickup': '#FFFBEB',
  'Picked Up': '#F0F9FF',
  'Picked Up (Bag Tagged)': '#F0F9FF',
  'Arrived at Store': '#FFFBEB',
  'Clothes Tagged & Sorted': '#F5F3FF',
  'Washing': '#EEF2FF',
  'Drying': '#FDF2F8',
  'Ironing': '#FFF7ED',
  'Ready': Colors.successBg,
  'Out for Delivery': '#F5F3FF',
  'Delivered': '#F1F5F9',
};
