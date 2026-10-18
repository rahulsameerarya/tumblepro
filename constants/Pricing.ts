export interface PriceItem {
  id: string;
  name: string;
  icon: string;
  category: 'Apparel' | 'Undergarments' | 'Accessories' | 'Shoe & Furniture Spa' | 'Home & Other';
  subCategory?: string;
  prices: {
    wash_fold: number;
    wash_iron: number;
    dry_clean: number;
    iron_only: number;
    shoe_cleaning?: number;
    sofa_cleaning?: number;
    carpet_cleaning?: number;
  };
}

export const DEFAULT_PRICE_LIST: PriceItem[] = [
  // ─── Standard Apparel ──────────────────────────────────────────
  {
    id: 'shirt',
    name: 'Formal Shirt',
    icon: '👔',
    category: 'Apparel',
    subCategory: 'Tops',
    prices: { wash_fold: 30, wash_iron: 45, dry_clean: 120, iron_only: 15 },
  },
  {
    id: 'tshirt',
    name: 'T-Shirt / Polo',
    icon: '👕',
    category: 'Apparel',
    subCategory: 'Tops',
    prices: { wash_fold: 25, wash_iron: 35, dry_clean: 100, iron_only: 12 },
  },
  {
    id: 'pants',
    name: 'Trousers / Chinos',
    icon: '👖',
    category: 'Apparel',
    subCategory: 'Bottoms',
    prices: { wash_fold: 40, wash_iron: 55, dry_clean: 130, iron_only: 20 },
  },
  {
    id: 'jeans',
    name: 'Denim Jeans',
    icon: '👖',
    category: 'Apparel',
    subCategory: 'Bottoms',
    prices: { wash_fold: 50, wash_iron: 65, dry_clean: 150, iron_only: 25 },
  },
  {
    id: 'suit',
    name: 'Suit / Blazer (2-Pc)',
    icon: '🧥',
    category: 'Apparel',
    subCategory: 'Formals',
    prices: { wash_fold: 120, wash_iron: 160, dry_clean: 300, iron_only: 60 },
  },
  {
    id: 'saree',
    name: 'Silk / Designer Saree',
    icon: '🥻',
    category: 'Apparel',
    subCategory: 'Traditional',
    prices: { wash_fold: 80, wash_iron: 110, dry_clean: 220, iron_only: 45 },
  },
  {
    id: 'kurta',
    name: 'Kurta / Kurti',
    icon: '👘',
    category: 'Apparel',
    subCategory: 'Traditional',
    prices: { wash_fold: 40, wash_iron: 55, dry_clean: 120, iron_only: 20 },
  },
  {
    id: 'dress',
    name: 'Dress / One-Piece',
    icon: '👗',
    category: 'Apparel',
    subCategory: 'Ladies',
    prices: { wash_fold: 60, wash_iron: 85, dry_clean: 180, iron_only: 35 },
  },
  {
    id: 'jacket',
    name: 'Winter Jacket / Coat',
    icon: '🧥',
    category: 'Apparel',
    subCategory: 'Outerwear',
    prices: { wash_fold: 100, wash_iron: 140, dry_clean: 260, iron_only: 55 },
  },

  // ─── Undergarments (New requested category) ────────────────────
  {
    id: 'vest',
    name: 'Men Vest / Undershirt',
    icon: '🎽',
    category: 'Undergarments',
    subCategory: 'Innerwear',
    prices: { wash_fold: 18, wash_iron: 25, dry_clean: 60, iron_only: 10 },
  },
  {
    id: 'briefs_boxers',
    name: 'Briefs / Boxers / Trunks',
    icon: '🩲',
    category: 'Undergarments',
    subCategory: 'Innerwear',
    prices: { wash_fold: 18, wash_iron: 25, dry_clean: 60, iron_only: 10 },
  },
  {
    id: 'bra_lingerie',
    name: 'Brassiere / Lingerie',
    icon: '👙',
    category: 'Undergarments',
    subCategory: 'Delicates',
    prices: { wash_fold: 25, wash_iron: 35, dry_clean: 80, iron_only: 15 },
  },
  {
    id: 'socks_pair',
    name: 'Socks (Pair)',
    icon: '🧦',
    category: 'Undergarments',
    subCategory: 'Hosiery',
    prices: { wash_fold: 15, wash_iron: 20, dry_clean: 40, iron_only: 8 },
  },
  {
    id: 'thermal_inner',
    name: 'Thermal Innerwear (Top/Bottom)',
    icon: '🥋',
    category: 'Undergarments',
    subCategory: 'Winter Innerwear',
    prices: { wash_fold: 35, wash_iron: 50, dry_clean: 100, iron_only: 18 },
  },
  {
    id: 'camisole_slip',
    name: 'Camisole / Inner Slip',
    icon: '👚',
    category: 'Undergarments',
    subCategory: 'Innerwear',
    prices: { wash_fold: 20, wash_iron: 30, dry_clean: 70, iron_only: 12 },
  },

  // ─── Accessories (New requested category) ──────────────────────
  {
    id: 'cap_hat',
    name: 'Cap / Hat / Beanie',
    icon: '🧢',
    category: 'Accessories',
    subCategory: 'Headwear',
    prices: { wash_fold: 30, wash_iron: 40, dry_clean: 90, iron_only: 15 },
  },
  {
    id: 'tie_bowtie',
    name: 'Neck Tie / Bow Tie',
    icon: '👔',
    category: 'Accessories',
    subCategory: 'Formals',
    prices: { wash_fold: 20, wash_iron: 30, dry_clean: 60, iron_only: 12 },
  },
  {
    id: 'scarf_dupatta',
    name: 'Scarf / Dupatta / Stole',
    icon: '🧣',
    category: 'Accessories',
    subCategory: 'Neckwear',
    prices: { wash_fold: 30, wash_iron: 45, dry_clean: 90, iron_only: 18 },
  },
  {
    id: 'handkerchief_pack',
    name: 'Handkerchiefs (Pack of 3)',
    icon: '◽',
    category: 'Accessories',
    subCategory: 'Personal',
    prices: { wash_fold: 20, wash_iron: 28, dry_clean: 50, iron_only: 10 },
  },
  {
    id: 'belt_fabric',
    name: 'Fabric Belt / Suspenders',
    icon: '🎗️',
    category: 'Accessories',
    subCategory: 'Waistwear',
    prices: { wash_fold: 25, wash_iron: 35, dry_clean: 60, iron_only: 12 },
  },
  {
    id: 'sneakers_shoes',
    name: 'Sneakers / Canvas Shoes (Pair)',
    icon: '👟',
    category: 'Accessories',
    subCategory: 'Footwear',
    prices: { wash_fold: 120, wash_iron: 150, dry_clean: 250, iron_only: 0 },
  },
  {
    id: 'bag_backpack',
    name: 'Backpack / Handbag',
    icon: '🎒',
    category: 'Accessories',
    subCategory: 'Bags',
    prices: { wash_fold: 100, wash_iron: 130, dry_clean: 220, iron_only: 0 },
  },

  // ─── Home Linen & Other ─────────────────────────────────────────
  {
    id: 'bedsheet_double',
    name: 'Double Bedsheet & Pillows',
    icon: '🛏️',
    category: 'Home & Other',
    subCategory: 'Bedding',
    prices: { wash_fold: 90, wash_iron: 120, dry_clean: 200, iron_only: 45 },
  },
  {
    id: 'blanket_quilt',
    name: 'Blanket / Heavy Quilt',
    icon: '🛋️',
    category: 'Home & Other',
    subCategory: 'Bedding',
    prices: { wash_fold: 160, wash_iron: 210, dry_clean: 380, iron_only: 80 },
  },
  {
    id: 'pillow_cover',
    name: 'Pillow Cover (Pair)',
    icon: '🛏️',
    category: 'Home & Other',
    subCategory: 'Bedding',
    prices: { wash_fold: 25, wash_iron: 35, dry_clean: 70, iron_only: 12 },
  },
  {
    id: 'bath_towel',
    name: 'Bath Towel',
    icon: '🛁',
    category: 'Home & Other',
    subCategory: 'Bath',
    prices: { wash_fold: 35, wash_iron: 45, dry_clean: 90, iron_only: 15 },
  },
  {
    id: 'curtains_pair',
    name: 'Window Curtains (Pair)',
    icon: '🪟',
    category: 'Home & Other',
    subCategory: 'Furnishing',
    prices: { wash_fold: 110, wash_iron: 140, dry_clean: 250, iron_only: 60 },
  },
  {
    id: 'cushion_cover',
    name: 'Cushion Covers (Set of 2)',
    icon: '🛋️',
    category: 'Home & Other',
    subCategory: 'Furnishing',
    prices: { wash_fold: 30, wash_iron: 40, dry_clean: 80, iron_only: 15 },
  },
  {
    id: 'bathrobe',
    name: 'Bathrobe / Night Gown',
    icon: '🥋',
    category: 'Home & Other',
    subCategory: 'Bath',
    prices: { wash_fold: 60, wash_iron: 80, dry_clean: 160, iron_only: 30 },
  },

  // ─── Shoe & Furniture Spa (New requested category) ──────────────
  {
    id: 'shoe_sneakers',
    name: 'Sneakers / Sports Shoes (Pair)',
    icon: '👟',
    category: 'Shoe & Furniture Spa',
    subCategory: 'Footwear',
    prices: { wash_fold: 140, wash_iron: 180, dry_clean: 260, iron_only: 0, shoe_cleaning: 260 },
  },
  {
    id: 'shoe_leather',
    name: 'Formal Leather Shoes (Pair)',
    icon: '👞',
    category: 'Shoe & Furniture Spa',
    subCategory: 'Footwear',
    prices: { wash_fold: 160, wash_iron: 200, dry_clean: 320, iron_only: 0, shoe_cleaning: 320 },
  },
  {
    id: 'shoe_boots',
    name: 'Boots / Suede Shoes (Pair)',
    icon: '🥾',
    category: 'Shoe & Furniture Spa',
    subCategory: 'Footwear',
    prices: { wash_fold: 200, wash_iron: 250, dry_clean: 380, iron_only: 0, shoe_cleaning: 380 },
  },
  {
    id: 'sofa_per_seat',
    name: 'Sofa Cleaning (Per Seat)',
    icon: '🛋️',
    category: 'Shoe & Furniture Spa',
    subCategory: 'Upholstery',
    prices: { wash_fold: 200, wash_iron: 260, dry_clean: 350, iron_only: 0, sofa_cleaning: 350 },
  },
  {
    id: 'sofa_3seater',
    name: '3-Seater Sofa Deep Cleaning',
    icon: '🛋️',
    category: 'Shoe & Furniture Spa',
    subCategory: 'Upholstery',
    prices: { wash_fold: 600, wash_iron: 750, dry_clean: 950, iron_only: 0, sofa_cleaning: 950 },
  },
  {
    id: 'recliner_chair',
    name: 'Recliner Chair Spa & Cleaning',
    icon: '💺',
    category: 'Shoe & Furniture Spa',
    subCategory: 'Upholstery',
    prices: { wash_fold: 350, wash_iron: 450, dry_clean: 550, iron_only: 0, sofa_cleaning: 550 },
  },
  {
    id: 'carpet_floor_rug',
    name: 'Floor Carpet / Persian Rug (Piece)',
    icon: '🧶',
    category: 'Shoe & Furniture Spa',
    subCategory: 'Floor Care',
    prices: { wash_fold: 280, wash_iron: 380, dry_clean: 580, iron_only: 0, carpet_cleaning: 580 },
  },
  {
    id: 'heavy_curtain_spa',
    name: 'Curtains / Heavy Drapes (Pair)',
    icon: '🪟',
    category: 'Shoe & Furniture Spa',
    subCategory: 'Window Care',
    prices: { wash_fold: 140, wash_iron: 180, dry_clean: 320, iron_only: 60, carpet_cleaning: 320 },
  },
];

export const ITEM_CATEGORIES = [
  'All',
  'Apparel',
  'Undergarments',
  'Accessories',
  'Shoe & Furniture Spa',
  'Home & Other',
] as const;
export type ItemCategory = typeof ITEM_CATEGORIES[number];
